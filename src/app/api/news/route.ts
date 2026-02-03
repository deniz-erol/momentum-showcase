import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

const FEEDS = [
    { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
    { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" }
];

export async function GET() {
    try {
        const newsPromises = FEEDS.map(async (feed) => {
            try {
                const data = await parser.parseURL(feed.url);
                return data.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: feed.name,
                    contentSnippet: item.contentSnippet,
                    thumbnail: (item.enclosure?.url) || ""
                }));
            } catch (err) {
                console.error(`Failed to fetch feed ${feed.name}:`, err);
                return [];
            }
        });

        const allNews = (await Promise.all(newsPromises)).flat();

        // Sort by date desc
        allNews.sort((a, b) => {
            return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
        });

        return NextResponse.json(allNews.slice(0, 30));
    } catch (error) {
        console.error("News fetch failed:", error);
        return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
    }
}
