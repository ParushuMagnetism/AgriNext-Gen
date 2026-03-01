# 🌾 AgriNext Gen — AI-Powered Agriculture Operating System for India

> **Reducing India's ₹92,000 crore annual post-harvest food loss through AI-driven coordination of farmers, agents, transporters, and buyers on one unified platform.**

[![Built for AMD Slingshot 2026](https://img.shields.io/badge/AMD%20RYZEN-Slingshot%202026-ED1C24?style=for-the-badge&logo=amd&logoColor=white)](https://amdslingshot.in/)
[![Theme: AI for Social Good](https://img.shields.io/badge/Theme-AI%20for%20Social%20Good-4CAF50?style=for-the-badge)](https://amdslingshot.in/)
[![Made in India](https://img.shields.io/badge/Made%20in-India%20🇮🇳-FF9933?style=for-the-badge)](https://amdslingshot.in/)

---

## 📌 The Problem

India's agriculture feeds **1.4 billion people**, yet the ecosystem is broken:

| Crisis | Scale |
|--------|-------|
| 🍅 **Post-harvest food loss** | **30–40%** of produce wasted due to poor logistics & storage |
| 📉 **Price instability** | Farmers sell at distress prices; consumers overpay |
| 🚛 **Empty return trips** | **35%+** of agri-transport trucks return empty — wasted fuel, time, capacity |
| 🧑‍🌾 **Middleman exploitation** | Farmers lose **20–40%** of produce value to intermediaries |
| 📝 **Government schemes unreachable** | Complex language, no digital access — benefits don't reach farmers |
| 🏙️ **Rural youth migration** | No local opportunities → mass migration to cities |

**Root Cause**: No unified, data-driven system connects production, logistics, storage, and markets.

---

## 💡 Our Solution — AgriNext Gen

AgriNext Gen is a **multi-role agricultural operating system** that connects **5 stakeholders** on one intelligent platform:

```
 🧑‍🌾 FARMER ←→ 🧑‍💼 FIELD AGENT ←→ 🚚 TRANSPORTER ←→ 🛒 BUYER
                          ↕
                    🛠️ ADMIN
                          ↕
                  🤖 AI DECISION ENGINE
```

**Core Value**: **TRUST + COORDINATION** — verified data, AI-powered decisions, proof-based execution, full traceability from farm to fork.

### How It Works (End-to-End Flow)
```
1. 🧑‍💼 Agent onboards farmer → verifies land, crops with geo-tagged photos
2. 🧑‍🌾 Farmer tracks crops → gets AI advisory in Kannada via Krishi Mitra
3. 📊 AI predicts optimal harvest time + market prices
4. 🧑‍🌾 Farmer creates listing → requests transport
5. 🚚 Transporter accepts load → AI optimizes route → picks up with photo proof
6. 📦 Produce delivered to buyer → proof captured at delivery
7. 🛒 Buyer gets verified, traceable produce with quality grading
8. 🛠️ Admin monitors everything → audit trail, finance, disputes
9. 📱 Consumer scans QR → sees full farm-to-fork journey
```

---

## 🚀 Key Features

### 🧑‍🌾 Farmer Dashboard
| Feature | Description |
|---------|-------------|
| **Krishi Mitra AI** 🤖 | Bilingual AI chatbot (English + Kannada) — personalized crop advisory, pest alerts, market prices |
| **Real-time Crop Tracking** | Track crop lifecycle: Sown → Growing → Ready → Harvested |
| **Crop Diary** 📸 | Photo evidence + disease detection for every crop stage |
| **Market Price Predictions** | AI-forecasted mandi prices — know when to sell for maximum profit |
| **One-Click Transport** | Request transport with a single tap — matched to nearest verified transporter |
| **Earnings Dashboard** | Track income, payments, and settlement history |
| **Offline Mode** 📡 | Full functionality without internet — auto-syncs when connected |
| **Weather Intelligence** | Hyperlocal weather with AI-generated farming recommendations |

### 🧑‍💼 Field Agent Dashboard
| Feature | Description |
|---------|-------------|
| **AI-Prioritized Visit Planning** | AI ranks which farmers to visit first based on crop urgency |
| **Geo-Tagged Crop Verification** | Photo + GPS evidence for every crop update |
| **Yield Estimation & Harvest Scoring** | AI-predicted yield based on field data |
| **Voice Notes** 🎙️ | Record observations via voice — transcribed and stored |
| **Farmer Onboarding** | Register new farmers with guided profile creation |
| **Cluster-Level Risk Summary** | AI identifies at-risk farmers in the agent's area |

### 🚚 Transporter Dashboard
| Feature | Description |
|---------|-------------|
| **Smart Load Matching** | AI matches available loads to transporters by location & capacity |
| **Trip State Machine** | Full lifecycle: Assigned → En Route → Picked Up → In Transit → Delivered → Closed |
| **Proof-Based Execution** 📸 | Photo + GPS + timestamp required at pickup AND delivery |
| **AI Route Optimization** | Google Maps + AI for fastest, most fuel-efficient routes |
| **Reverse Logistics AI** 🔄 | Finds return loads to eliminate empty trips |
| **Vehicle Management** | Register vehicles, track capacity, maintenance alerts |

### 🛒 Buyer Dashboard
| Feature | Description |
|---------|-------------|
| **Verified Listings** | Browse produce from verified farmers with quality grading |
| **Full Traceability** | Farmer → Agent verification → Transport → Delivery — complete chain |
| **AI Procurement Recommendations** | AI suggests what to buy based on availability, quality, and price trends |
| **Order Tracking** | Real-time status: Placed → Confirmed → Packed → Shipped → Delivered |
| **QR Traceability** | Scan QR code on any produce to see its complete journey |

### 🛠️ Admin Dashboard
| Feature | Description |
|---------|-------------|
| **Ecosystem Command Center** | Real-time monitoring of all 4 roles across Karnataka |
| **User & Role Management** | RBAC with Row Level Security on every table |
| **Finance Operations** | Payments, refunds, payouts, reconciliation via Razorpay |
| **AI Console** | Monitor and control all AI models from one interface |
| **Anomaly & Fraud Detection** | AI flags suspicious patterns in data |
| **Data Health Dashboard** | Monitor data completeness and quality scores |
| **Dispute Resolution** | Handle farmer/transporter/buyer disputes with audit trail |

---

## 🤖 AI Decision Engine — "The Brain of AgriNext"

All AI runs through a **single intelligent gateway** (`ai-gateway`) with role-specific routes:

| AI Module | Route | What It Does | AMD Optimization |
|-----------|-------|-------------|-----------------|
| **Krishi Mitra** 🌾 | `/farmer-assistant` | Context-aware farmer chatbot — uses live crop, weather, mandi price data | LLM inference on AMD GPU via ROCm |
| **Agent AI** | `/agent-ai` | Summarizes farmer situations, recommends tasks | Batch inference on AMD hardware |
| **Transport AI** | `/transport-ai` | Route optimization, timing estimation, reverse logistics | AMD-accelerated route computation |
| **Marketplace AI** | `/marketplace-ai` | Buyer/seller matching, procurement recommendations | AMD-optimized demand forecasting |
| **Voice AI** 🎙️ | `/elevenlabs/tts` | Text-to-speech in English + Kannada | — |
| **Market Scraper** | `/firecrawl/fetch` | Real-time mandi price scraping from Karnataka markets | — |

### Krishi Mitra — Context-Aware AI (Our Star Feature ⭐)
```
Before responding, Krishi Mitra automatically builds context from:
├── 👤 Farmer Profile: name, village, taluk, district, language preference
├── 🌱 Active Crops: type, status, growth stage, estimated harvest, quantity
├── 🌤️ Weather: hyperlocal conditions via Open-Meteo
└── 📊 Mandi Prices: real-time prices for farmer's specific crops

→ Result: Personalized, actionable advice in the farmer's own language
→ Example: "ರಾಮೇಶ, ನಿಮ್ಮ ಟೊಮ್ಯಾಟೋ ಬೆಳೆ 8 ದಿನಗಳಲ್ಲಿ ಕೊಯ್ಲಿಗೆ ಸಿದ್ಧ. 
   ಮೈಸೂರು ಮಂಡಿಯಲ್ಲಿ ಬೆಲೆ ₹28/ಕೆಜಿ — ಈಗ ಮಾರಾಟ ಮಾಡಿ."
   (Ramesh, your tomato crop is ready for harvest in 8 days.
    Mysuru mandi price is ₹28/kg — sell now.)
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 APPLICATION LAYER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐│
│  │ Farmer   │ │  Agent   │ │Transport │ │Buyer │ │  Admin   ││
│  │Dashboard │ │Dashboard │ │Dashboard │ │ Dash │ │Dashboard ││
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬───┘ └────┬─────┘│
│       │             │            │           │          │       │
│  ┌────▼─────────────▼────────────▼───────────▼──────────▼─────┐│
│  │              ⚡ SUPABASE REALTIME + REST APIs               ││
│  └────┬───────────────────────────────────────────────────────┘│
├───────▼───────────────────────────────────────────────────────-─┤
│                    🤖 AI DECISION ENGINE                        │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐ │
│  │Krishi Mitra│ │Price     │ │Route      │ │Demand-Supply   │ │
│  │(Bilingual) │ │Forecast  │ │Optimizer  │ │Prediction      │ │
│  └────────────┘ └──────────┘ └───────────┘ └────────────────┘ │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐ │
│  │Crop        │ │Harvest   │ │Reverse    │ │Agent Visit     │ │
│  │Advisory    │ │Readiness │ │Logistics  │ │Prioritization  │ │
│  └────────────┘ └──────────┘ └───────────┘ └────────────────┘ │
├────────────────────────────────────────────────────────────────-┤
│                    🔒 BACKEND LAYER (Supabase)                  │
│  ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────┐ │
│  │PostgreSQL  │ │Supabase  │ │Edge       │ │Supabase        │ │
│  │14.1 + RLS  │ │Auth      │ │Functions  │ │Storage         │ │
│  │60+ Migr.   │ │Phone+Pwd │ │(Deno)     │ │(Private Only)  │ │
│  └────────────┘ └──────────┘ └───────────┘ └────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🔐 4-Tier Security: Public → Operational → Sensitive →  │  │
│  │    Regulated (KYC/Aadhaar/Payments — Edge Function only) │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────-┤
│                    📊 DATA LAYER                                │
│  Farmer & Crop Data │ Agent Verification │ Transport Logs      │
│  GPS & Geo Events   │ Mandi Prices       │ Weather Signals     │
│  Audit Trails       │ Payment Events     │ KYC Documents       │
├────────────────────────────────────────────────────────────────-┤
│                    📡 OFFLINE LAYER                              │
│  Dexie (IndexedDB) → Action Queue → Upload Queue → Auto-Sync  │
│  Works without internet → Syncs when connected → Zero data loss│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18.3** + **TypeScript 5.8** | Core framework with type safety |
| **Vite 5.4** | Lightning-fast build tooling (dev port: 8080) |
| **Tailwind CSS 3.4** + **shadcn/ui** | Beautiful, responsive UI with Radix primitives |
| **TanStack Query v5** | Server state management with offline cache |
| **React Hook Form** + **Zod** | Type-safe form validation |
| **Recharts** | Interactive data visualization |
| **Google Maps API** | Geo-location, service areas, route display |
| **Dexie (IndexedDB)** | Offline-first local database |
| **qrcode.react** | QR code generation for produce traceability |

### Backend (100% Supabase)
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 14.1** | Primary database with Row Level Security |
| **Supabase Auth** | Phone+password authentication |
| **Supabase Edge Functions** | Deno-powered serverless backend |
| **Supabase Storage** | Private file storage with signed URLs |
| **Supabase Realtime** | Live subscriptions for dashboards & notifications |
| **60+ Database Migrations** | Production-grade schema evolution |

### AI & Integrations
| Technology | Purpose |
|-----------|---------|
| **Google Gemini** | Primary LLM — Krishi Mitra, advisory, predictions |
| **ElevenLabs** | Text-to-speech in English + Kannada |
| **Open-Meteo** | Hyperlocal weather data (free, no API key) |
| **Firecrawl** | Market price web scraping from Karnataka mandis |
| **Google Maps API** | Location services, route optimization |
| **Razorpay** | Payment processing (orders + webhooks) |

### AMD Technology Integration 🔴
| Technology | Purpose |
|-----------|---------|
| **AMD ROCm** | Open-source GPU compute for AI model inference |
| **AMD Ryzen AI / NPU** | On-device crop disease detection at the edge |
| **ONNX Runtime on AMD** | Optimized inference for demand-supply prediction models |
| **AMD Instinct MI300X** *(roadmap)* | Training custom agriculture models at scale |

### DevOps & Quality
| Technology | Purpose |
|-----------|---------|
| **Vitest** | Unit testing framework |
| **Playwright** | End-to-end browser testing |
| **Vercel** | Frontend deployment |
| **Supabase CLI** | Database migrations & edge function deployment |

---

## 📦 Repository Structure

```
agrinext-gen/
├── 📁 src/
│   ├── 📁 components/          # Shared UI components (shadcn/ui based)
│   ├── 📁 pages/
│   │   ├── 📁 farmer/          # 🧑‍🌾 Farmer dashboard pages
│   │   ├── 📁 agent/           # 🧑‍💼 Agent dashboard pages
│   │   ├── 📁 logistics/       # 🚚 Transporter dashboard pages
│   │   ├── 📁 buyer/           # 🛒 Buyer dashboard pages
│   │   └── 📁 admin/           # 🛠️ Admin dashboard pages
│   ├── 📁 hooks/               # React hooks (useAuth, useLanguage, etc.)
│   ├── 📁 i18n/                # Translations (en.ts + kn.ts — Kannada)
│   ├── 📁 offline/             # Offline engine (Dexie, queues, sync)
│   │   ├── actionQueue.ts      # Offline mutation queue
│   │   ├── uploadQueue.ts      # Offline file upload queue
│   │   ├── queryPersister.ts   # TanStack Query cache persistence
│   │   └── network.ts          # Connectivity detection
│   ├── 📁 integrations/
│   │   └── 📁 supabase/        # Supabase client config
│   └── App.tsx                 # All routes — single source of truth
├── 📁 supabase/
│   ├── 📁 functions/           # Edge Functions (Deno)
│   │   ├── 📁 ai-gateway/      # 🤖 Master AI entry point
│   │   ├── 📁 login-by-phone/  # Auth: phone+password login
│   │   ├── 📁 signup-by-phone/ # Auth: phone+password signup
│   │   ├── 📁 get-weather/     # Weather data fetcher
│   │   └── 📁 _shared/         # Shared utilities (prompts, context)
│   └── 📁 migrations/          # 60+ versioned SQL migrations
├── 📁 docs/                    # Architecture rules & documentation
├── 📁 tests/                   # Vitest + Playwright test suites
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md                   # ← You are here
```

---

## 🔒 Security Architecture

AgriNext Gen implements **enterprise-grade security** with a 4-tier data classification model:

| Tier | Data Type | Access Rule |
|------|-----------|-------------|
| **Tier 1 — Public** | Mandi prices, district lists, aggregates | Broad client access |
| **Tier 2 — Operational** | Trips, tasks, listings metadata | Client access with RLS |
| **Tier 3 — Sensitive** | Phone numbers, farm GPS, earnings | Strict RLS required |
| **Tier 4 — Regulated** | KYC, Aadhaar, payment events | Edge Function access ONLY |

### Security Principles (Non-Negotiable)
- ✅ **Row Level Security (RLS)** on every user-facing table
- ✅ **Server-side state machines** — no client-side status writes
- ✅ **Append-only audit logs** — every sensitive action logged
- ✅ **Private storage buckets** — signed URLs only, no public access
- ✅ **No service_role keys in frontend** — ever
- ✅ **Additive-only migrations** — never destructive in production

---

## 📡 Offline-First Architecture

Designed for **rural India** where internet connectivity is unreliable:

```
┌──────────────────────────────────────────────┐
│  User performs action (no internet)           │
│         ↓                                     │
│  Action queued in IndexedDB (Dexie)          │
│         ↓                                     │
│  SyncIndicator shows pending count ⏳        │
│         ↓ (internet restored)                │
│  Queue auto-replays against Supabase API     │
│         ↓                                     │
│  Photos/files uploaded via Upload Queue      │
│         ↓                                     │
│  ✅ Zero data loss — fully synchronized      │
└──────────────────────────────────────────────┘
```

---

## 🌍 Impact & Vision

### Phase 1 — Karnataka (Current)
- **Region**: Karnataka, India — Mysuru district pilot
- **Languages**: English + Kannada (ಕನ್ನಡ)
- **Target**: 50+ farmers, 10+ agents, 5+ transporters, 5+ buyers

### Phase 2 — Multi-State Expansion
- Expand to Andhra Pradesh, Tamil Nadu, Maharashtra
- Add Telugu, Tamil, Marathi language support
- Integrate with more mandi APIs

### Phase 3 — National Platform
- All Indian states with regional language support
- Warehouse & cold storage network integration
- Advanced AI: crop disease detection via AMD-powered computer vision
- Government scheme auto-enrollment

### Projected Impact
| Metric | Target |
|--------|--------|
| Post-harvest loss reduction | **35% → under 10%** |
| Empty return trip elimination | **40% reduction** |
| Farmer income increase | **₹15,000–₹25,000/season** |
| Rural jobs created | **1,000+ in Phase 1** |
| Government scheme reach | **3x improvement** |

---

## 🏃 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key

### Installation
```bash
# Clone the repository
git clone https://github.com/ShivabasaveshAS/agrinext-gen.git
cd agrinext-gen

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start development server
npm run dev
# → Opens at http://localhost:8080
```

### Key Scripts
```bash
npm run dev                          # Start dev server (port 8080)
npm run build                        # Production build → dist/
npm run test                         # Run Vitest unit tests
npm run staging:run-all              # Full staging smoke tests
npm run staging:seed-dummy-data      # Seed demo data
npm run security:check-edge          # Security audit of edge functions
npm run i18n:audit-kannada-encoding  # Verify Kannada text encoding
```

---

## 👥 Team

| Member | Role | Expertise |
|--------|------|-----------|
| **ShivabasaveshAS** | Lead Developer & Architect | Full-stack, AI Integration, System Design |
| [Team Member 2] | [Role] | [Skills] |
| [Team Member 3] | [Role] | [Skills] |

---

## 📄 License

This project is built for the **AMD RYZEN Slingshot Hackathon 2026**.  
All intellectual property remains with the team.

---

## 🙏 Acknowledgments

- **AMD India** — For organizing RYZEN Slingshot 2026 and supporting innovation
- **Supabase** — For the powerful backend-as-a-service platform
- **Google** — For Gemini AI and Maps APIs
- **Karnataka Farmers** — For inspiring this platform with their resilience

---

<p align="center">
  <b>🌾 AgriNext Gen — Because every farmer deserves AI-powered intelligence. 🌾</b>
</p>
