import { Capacitor, CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { API_BASE_URL } from './config';

export interface NativeFetchOptions extends RequestInit {
    params?: Record<string, string>;
}

let unpatchedFetch: typeof fetch | null = null;

export function setUnpatchedFetch(f: typeof fetch) {
    unpatchedFetch = f;
}

export async function nativeFetch(url: string, options: NativeFetchOptions = {}): Promise<Response> {
    const f = unpatchedFetch || fetch;
    // Only use native fetch if we are on a native platform (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
        return f(url, options);
    }

    try {
        let finalUrl = url;
        if (url.startsWith('/')) {
            finalUrl = `${API_BASE_URL}${url}`;
        } else if (url.includes('localhost') && !API_BASE_URL.includes('localhost')) {
            finalUrl = url.replace(/https?:\/\/localhost(:\d+)?/, API_BASE_URL);
        }

        const httpOptions: HttpOptions = {
            url: finalUrl,
            method: options.method || 'GET',
            headers: (options.headers as Record<string, string>) || {},
            params: options.params || {},
        };

        // Handle body for POST/PUT/PATCH
        if (options.body) {
            if (typeof options.body === 'string') {
                try {
                    httpOptions.data = JSON.parse(options.body);
                } catch (e) {
                    httpOptions.data = options.body;
                }
            } else if (options.body instanceof URLSearchParams) {
                const params: Record<string, string> = {};
                options.body.forEach((value, key) => {
                    params[key] = value;
                });
                httpOptions.data = params;
                // CapacitorHttp will set correct content-type for objects, 
                // but let's be explicit for form data
                if (!httpOptions.headers) httpOptions.headers = {};
                (httpOptions.headers as Record<string, string>)['Content-Type'] = 'application/x-www-form-urlencoded';
            } else if (options.body instanceof FormData) {
                const params: Record<string, any> = {};
                options.body.forEach((value, key) => {
                    params[key] = value;
                });
                httpOptions.data = params;
            } else {
                httpOptions.data = options.body;
            }
        }

        // Set standard Capacitor headers for cookies/auth if not present
        if (options.credentials === 'include') {
            // CapacitorHttp handles cookies automatically when enabled in config
        }

        const response: HttpResponse = await CapacitorHttp.request(httpOptions);

        // Convert HttpResponse to a standard fetch Response object
        const responseHeaders = new Headers();
        Object.entries(response.headers).forEach(([key, value]) => {
            responseHeaders.append(key, value);
        });

        const bodyData = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;

        return new Response(bodyData, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Native fetch failed, falling back to standard fetch', error);
        return f(url, options);
    }
}
