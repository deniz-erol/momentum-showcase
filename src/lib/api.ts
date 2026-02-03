import { CoinGeckoSearchResult } from "@/types";
import { API_BASE_URL } from "@/lib/config";
import { nativeFetch as fetch } from "@/lib/http";

// CoinGecko API (free, no key required)
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Optimized headers to prevent rate limiting
const COINGECKO_HEADERS = {
  "User-Agent": "Momentum/1.0",
  "Accept": "application/json",
};

export async function searchCrypto(
  query: string
): Promise<CoinGeckoSearchResult[]> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`,
      { headers: COINGECKO_HEADERS }
    );

    if (!res.ok) {
      console.error(`CoinGecko search failed: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.coins.slice(0, 50).map((c: Record<string, any>) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      // Use 'large' instead of 'thumb' for high-resolution logos (200x200 vs 32x32)
      thumb: c.large || c.thumb,
    }));
  } catch (err) {
    console.error("Crypto search error:", err);
    return [];
  }
}

export async function getCryptoPrices(
  ids: string[],
  vsCurrency = "usd"
): Promise<Record<string, { [key: string]: number }>> {
  if (ids.length === 0) return {};

  try {
    // Use our cached API route instead of calling CoinGecko directly
    const res = await fetch(
      `${API_BASE_URL}/api/crypto/prices?ids=${ids.join(",")}&vs_currency=${vsCurrency}`
    );

    if (!res.ok) {
      console.error(`Crypto price fetch failed: ${res.status}`);
      return {};
    }

    return res.json();
  } catch (err) {
    console.error("Crypto price fetch error:", err);
    return {};
  }
}

export async function getSupportedCurrencies(): Promise<string[]> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/supported_vs_currencies`,
      { headers: COINGECKO_HEADERS }
    );

    if (!res.ok) {
      console.error(`Failed to fetch supported currencies: ${res.status}`);
      return ["usd", "eur", "gbp", "try"]; // Fallback currencies
    }

    return res.json();
  } catch (err) {
    console.error("Supported currencies fetch error:", err);
    return ["usd", "eur", "gbp", "try"]; // Fallback currencies
  }
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Use our cached API route
    const res = await fetch(`${API_BASE_URL}/api/exchange-rates`);

    if (!res.ok) {
      console.error(`Exchange rates fetch failed: ${res.status}`);
      return {};
    }

    // API route returns: { USD_TRY: 34.5, TRY_USD: 0.029, ... }
    return res.json();
  } catch (err) {
    console.error("Exchange rates fetch error:", err);
    return {};
  }
}

// TEFAS - We use a Next.js API route to proxy the request
export async function searchTEFAS(query: string) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/tefas/search?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      console.error(`TEFAS search failed: ${res.status}`);
      return [];
    }

    return res.json();
  } catch (err) {
    console.error("TEFAS search error:", err);
    return [];
  }
}

export async function getTEFASPrices(
  codes: string[]
): Promise<Record<string, number>> {
  if (codes.length === 0) return {};

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/tefas/prices?codes=${codes.join(",")}`
    );

    if (!res.ok) {
      console.error(`TEFAS price fetch failed: ${res.status}`);
      return {};
    }

    return res.json();
  } catch (err) {
    console.error("TEFAS price fetch error:", err);
    return {};
  }
}

// Metals - using metals.dev free API
export async function getMetalPrices(): Promise<
  Record<string, number>
> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/metals/prices`);

    if (!res.ok) {
      console.error(`Metals price fetch failed: ${res.status}`);
      return {};
    }

    return res.json();
  } catch (err) {
    console.error("Metals price fetch error:", err);
    return {};
  }
}

export const METRIC_WEIGHTS = {
  OZ_TO_GR: 31.1034768,
};

export const AVAILABLE_METALS = [
  { symbol: "XAUUSD", name: "Gold", unit: "oz", apiId: "gold" },
  { symbol: "XAGUSD", name: "Silver", unit: "oz", apiId: "silver" },
  { symbol: "XPTUSD", name: "Platinum", unit: "oz", apiId: "platinum" },
  { symbol: "XPDUSD", name: "Palladium", unit: "oz", apiId: "palladium" },
];

// Historical price data
export async function getCryptoHistory(
  id: string,
  days: number = 30,
  vsCurrency = "usd"
): Promise<{ prices: [number, number][] }> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=${vsCurrency}&days=${days}`,
      { headers: COINGECKO_HEADERS }
    );

    if (!res.ok) {
      console.error(`CoinGecko history fetch failed: ${res.status}`);
      return { prices: [] };
    }

    return res.json();
  } catch (err) {
    console.error("Crypto history fetch error:", err);
    return { prices: [] };
  }
}

