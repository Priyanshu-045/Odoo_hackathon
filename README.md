# BrightSync

Offline-capable subscription management PWA with an AI finance dashboard.

## Quick start
1. `./setup.sh`
2. Copy `client-overrides/` over `brightsync/client/`, and `server/src` + `server/.env.example` into `brightsync/server/`
3. `cp .env.example .env`, then `npm run dev` in /server and /client

## Time-Travel Simulator (Admin)
`POST /api/simulate-time` with `{"targetDate":"2027-03-01"}` rewrites next_billing_date on all active subscriptions and runs billing immediately. Use a demo database: it overwrites real billing dates.

---
Author: Priyanshu Pandey | Enrollment No: 0801e1241068

## Phase 2: PWA + Gemini
- `./setup-phase2.sh`, then copy `client-overrides/` over `client/` again (vite.config.js, src/sw.js, public/*, main.jsx, AskFinance.jsx).
- Render `<AskFinance />` under the metric cards in Dashboard.jsx.
- Set `GEMINI_API_KEY` in server/.env. `POST /api/finance/query` (Admin/Staff) turns a question into a validated, read-only aggregation pipeline and runs it.

---
Author: Priyanshu Pandey | Enrollment No: 0801e1241068

## Phase 3: Seed + performance proof
```
./setup-phase3.sh          # installs express-rate-limit, adds npm scripts
cd brightsync/server
npm run seed               # 53 users, 3 products, 4 plans, 5,000 subs, 10,000 invoices
npm run bench              # runs the dashboard aggregations 10x vs the 2s budget
```
Demo login: admin@brightloop.demo / Brightsync@123

---
Architect: Priyanshu Pandey | 0801e1241068
