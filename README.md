# TradeFlow Simulator

**Order Lifecycle & Validation System for Derivatives Trading**

A frontend-centric simulation of how trade orders move through validation, risk checks, and execution readiness in a derivatives trading environment.

---

## What It Does

- **Order Entry** — Submit simulated orders with instrument, order type, quantity, price, and strategy tag
- **Server-Side Validation** — Orders are validated via a Next.js API route running Node.js logic: quantity limits, price sanity checks, notional exposure caps, strategy restrictions, daily exposure thresholds
- **Order Lifecycle State Machine** — Each order transitions through `CREATED → VALIDATED → RISK_APPROVED → READY` (or `→ REJECTED`), managed with Redux Toolkit
- **Order Blotter** — Real-time table showing all orders with state badges, click any row for detail
- **Detail Panel** — Per-order view showing all validation check results, rejection reasons, and timestamped transition history

---

## How It Matches a Quant Trading Frontend Role

| Requirement | Implementation |
|---|---|
| React + Redux | Redux Toolkit state machine for order lifecycle |
| Node.js logic | Server-side validation engine in Next.js API routes |
| Financial domain | Derivatives order flow, risk limits, strategy restrictions |
| Production patterns | Defensive rendering, fallback states, no blank screens |

---

## One-Click Deployment on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import Project**
3. Select the repo → Click **Deploy**
4. ✅ Done — no environment variables, no backend service, no configuration required

**Why it works:** This is a self-contained Next.js app. The "backend" validation logic lives in `/app/api/validate-order/route.ts` as a Next.js API route — same repo, same deployment, no CORS, no sleeping servers.

---

## Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## Architecture

```
/app
  /api/validate-order/route.ts   # Server-side Node.js validation
  layout.tsx                     # Root layout with Redux provider
  page.tsx                       # All UI components
  globals.css                    # Design system
/lib
  types.ts                       # Shared TypeScript types
  validationEngine.ts            # Risk validation logic (Node.js)
/store
  index.ts                       # Redux store
  /slices/ordersSlice.ts         # Order state machine via Redux
```
