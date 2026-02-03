import { NextRequest, NextResponse } from "next/server";
import fundsData from "@/data/tefas-funds.json";

// Shared Metals list
const AVAILABLE_METALS = [
    { symbol: "XAUUSD", name: "Gold", unit: "oz", apiId: "gold" },
    { symbol: "XAGUSD", name: "Silver", unit: "oz", apiId: "silver" },
    { symbol: "XPTUSD", name: "Platinum", unit: "oz", apiId: "platinum" },
    { symbol: "XPDUSD", name: "Palladium", unit: "oz", apiId: "palladium" },
];

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() || "";

    if (!q || q.length < 2) {
        return NextResponse.json({
            crypto: [],
            tefas: [],
            metals: []
        });
    }

    try {
        // 1. Search Crypto (CoinGecko)
        const cryptoPromise = fetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`,
            {
                headers: { "User-Agent": "Momentum/1.0", "Accept": "application/json" },
                next: { revalidate: 3600 }
            }
        ).then(res => res.ok ? res.json() : { coins: [] })
            .then(data => (data.coins || []).slice(0, 50).map((c: any) => ({
                id: c.id,
                symbol: c.symbol,
                name: c.name,
                thumb: c.large || c.thumb
            })));

        // 2. Search TEFAS (Local)
        const tefasResults = (fundsData as any[]).filter(f =>
            f.code.toLowerCase().includes(q) ||
            f.title.toLowerCase().includes(q)
        ).slice(0, 50);

        // 3. Search Metals (Local)
        const metalResults = AVAILABLE_METALS.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.symbol.toLowerCase().includes(q)
        );

        const [cryptoResults] = await Promise.all([cryptoPromise]);

        return NextResponse.json({
            crypto: cryptoResults,
            tefas: tefasResults,
            metals: metalResults
        });
    } catch (error) {
        console.error("Unified search failed:", error);
        return NextResponse.json({
            error: "Search failed",
            crypto: [],
            tefas: [],
            metals: []
        }, { status: 500 });
    }
}
