# Momentum — Technical Showcase

This repository is a **public technical showcase** of the **Momentum** project: an AI-native fintech app for tracking crypto, TEFAS (Turkish mutual funds), and precious metals in one dashboard — on web and native mobile (Android & iOS via Capacitor 6). The full application lives in a **private** repo; here we expose selected **engineering patterns and APIs** that power it: unified search across financial data sources, asset management UX, native-mobile networking, and relational financial modeling.

---

## What’s in this repo

| Area | Description |
|------|-------------|
| **Unified Search** | [Search API](./src/app/api/search/all/route.ts) — Aggregates and normalizes results from CoinGecko (crypto), TEFAS funds (local JSON), and precious metals in parallel for high-performance discovery. |
| **Asset management UX** | [AddHoldingModal](./src/components/AddHoldingModal.tsx) — Complex UI state and data-driven flows for adding holdings across 15+ currencies. |
| **Native HTTP layer** | [http.ts](./src/lib/http.ts) — **CapacitorHttp**-aware fetch layer for reliable networking on Android/iOS with logic parity to web. |
| **Financial data model** | [Prisma schema](./prisma/schema.prisma) — Relational design for users, holdings, transactions, snapshots, goals, price alerts, and market cache. |
| **News API** | [News route](./src/app/api/news/route.ts) — Server-side RSS aggregation for finance news. |

The **full application** (auth, portfolio dashboard, market view, goals, alerts, price history, mobile builds, and deployment) is maintained in a private repository.

---

## Full product highlights (main repo)

- **Multi-asset:** Crypto (CoinGecko), TEFAS funds, precious metals — live prices, retries, caching (Redis/PostgreSQL).
- **Price history:** Stored history for TEFAS and metals; local backfill script for charts.
- **Cross-platform:** Next.js 16, React 19, Tailwind 4; Capacitor 6 for Android & iOS with haptics, safe areas, and OAuth deep link.
- **AI-accelerated SDLC:** Built with agentic AI tooling (e.g. Cursor, Claude, GPT, Gemini) for architecture, code generation, and refactoring while keeping production-grade quality and tests.

---

## Stack (showcase + full app)

| Layer | Technologies |
|-------|----------------|
| **Core** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **State & data** | Zustand, TanStack Query, Prisma ORM, PostgreSQL |
| **Mobile** | Capacitor 6, Native Haptics, CapacitorHttp |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Infra** | Redis (Upstash), Vercel, optional Bicep/Azure DevOps |

---

## About the author

**Deniz Erol** — Cloud-Native Backend Engineer with experience building resilient microservices on Azure. Passionate about accelerating the SDLC with agentic AI tools and designing high-performance, cross-platform financial products using modern .NET and Node.js.

- [LinkedIn](https://linkedin.com/in/denizerol95)
- [GitHub](https://github.com/deniz-erol)
