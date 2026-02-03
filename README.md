# Momentum: Multi-Asset Portfolio Engine (Showcase)

This repository is a technical showcase of the **Momentum** project, a professional-grade multi-asset portfolio tracker. It demonstrates core engineering patterns, financial data orchestration, and cross-platform architecture.

---

## 🏗️ Technical Highlights

### 1. Unified Search Orchestration
The [Unified Search API Handler](./src/app/api/search/all/route.ts) demonstrates a custom orchestrator that aggregates and normalizes data from disparate financial APIs (Crypto, TEFAS Funds, and Precious Metals) in parallel, ensuring high-performance discovery for users.

### 2. High-Density Asset Management
The [AddHoldingModal](./src/components/AddHoldingModal.tsx) component showcases complex UI state management and optimized data-driven workflows, providing a seamless "Pro" experience for asset entry across 15+ global currencies.

### 3. Native-Mobile Bridging
The [Native HTTP Layer](./src/lib/http.ts) highlights the use of **CapacitorHttp** to solve platform-specific networking challenges, ensuring high-reliability data fetching on Android and iOS while maintaining logic parity with the web version.

### 4. Relational Financial Modeling
The [Prisma Schema](./prisma/schema.prisma) reflects a robust relational design for managing complex financial data, including varied asset types, historical valuation snapshots, and automated portfolio metrics.

---

## 🛠️ Stack Overview
- **Core:** Next.js 16 (React 19), Node.js, TypeScript
- **State/Caching:** Zustand, TanStack Query (React Query), Redis
- **Data:** Prisma ORM, PostgreSQL, SQLite
- **Network/Mobile:** Capacitor 6.0, Native Haptics, CapacitorHttp
- **Styling:** Tailwind CSS 4.0, Framer Motion

---

## 📝 About the Author
Developed by **Deniz Erol**, an Azure Backend & Integration Engineer specializing in building secure, scalable architectures and modern full-stack financial products.

[LinkedIn](https://linkedin.com/in/denizerol95) | [Main Portfolio](https://github.com/deniz-erol)
