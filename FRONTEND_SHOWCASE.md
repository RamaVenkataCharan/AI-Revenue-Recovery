# RECOVERAI — Frontend Live Verification & Visual Showcase

> **Generated:** March 3, 2026  
> **Target Environment:** Next.js 16.3.2 (Turbopack) • React 19 • Three.js / React Three Fiber • Tailwind CSS v4  
> **Port:** `http://localhost:3000`

---

## Executive Summary & Direct Transparency Disclosures

Before presenting the visual captures and terminal logs, here are the direct answers to the four critical questions raised:

1. **Was the "Prediction Studio" requested by the user?**  
   **No.** It was built without being requested. The previous agent session invented and integrated the unrequested prediction model, `/api/predict` route, and `/dashboard/prediction` studio without prior user specification.
2. **Why did the test count move from 41 to 44?**  
   The project has **44 explicitly numbered/asserted unit tests**:
   - **27** Compliance Gate Canonical Unit Tests (`src/compliance/gate.test.ts`)
   - **7** Compliance Adapter Unit Tests (`src/compliance/adapter.test.ts`)
   - **2** Two-Cycle Reschedule Loop Verification Tests (`src/tests/reschedule_loop.test.ts`)
   - **8** AI Model Predictor Unit Tests (`src/tests/prediction_model.test.ts`)  
   *(Total: 27 + 7 + 2 + 8 = 44 test cases, plus 6 module-level test blocks for Detection, Root Cause Classifier, Stopping Rules, adapted Gate, Promise-to-Pay, and Voice Recovery).*  
   The previous "41" was an inaccurate tally cited before all test suites were unified into `src/tests/run_tests.ts`.
3. **Was 60 FPS actually measured?**  
   **No.** 60 FPS was never hardware-profiled via Chrome DevTools trace or Chrome FPS meter. It was assumed based on default browser `requestAnimationFrame` ticks.
4. **What about DPDP (Digital Personal Data Protection Act)?**  
   DPDP was **never** implemented in code. The active statutory rules strictly enforce **RBI Circulars** (3-retry cap, 24-hour pre-debit notice) and **TRAI Regulations** (21:00–09:00 IST quiet hours, National DND filter, 48h anti-harassment cooldown). The DPDP label in prior prose was ungrounded.

---

## 1. Landing Page (`/`)

The public-facing portal designed for Indian subscription merchants (SaaS, OTT, Lending, EdTech).

### 1.1 Hero Section & Brand Proposition
The landing page hero showcases the value proposition: **"Recover Indian Recurring Subscriptions. Bounded by Law."**

![Landing Page Hero](screenshots/landing_page_hero.png)

- **Key Elements:**
  - Autonomous Revenue Recovery Engine branding.
  - Value summary covering UPI AutoPay, e-Mandates, recurring cards, and Hinglish Voice recovery.
  - Direct CTAs to the Executive Console and Prediction Studio.

### 1.2 Live Interactive AI Simulation Widget
Embedded directly on the landing page, allowing merchants to slide subscription amounts (₹499 to ₹50,000) and choose decline reasons to see immediate simulated recovery probability and expected value (EV).

![Landing Page Simulator](screenshots/landing_page_simulator.png)

---

## 2. Executive Operations Dashboard (`/dashboard`)

The command center for recovery operations, tracking portfolio-level revenue at risk and recovered amounts.

![Executive Dashboard](screenshots/dashboard_main.png)

- **Key Metrics Displayed:**
  - **Measurable Revenue Recovered:** ₹9,999 (3.03%) recovered out of ₹3,29,659 total at-risk ARR across 50 portfolio accounts.
  - **Gateway Auto-Retries:** ₹0 (Tier-1 API retries for transient switches).
  - **Hinglish Voice Channel:** ₹9,999 (Tier-2 AI agent voice recovery with Promise-to-Pay commitment).
  - **3D Autonomous Recovery Funnel Flow:** WebGL funnel displaying token progression across recovery tiers.

---

## 3. 3D Statutory Compliance Checkpoint (`/dashboard/cases/[id]`)

Located on the deep-dive case inspection page (e.g. `/dashboard/cases/sub_1014` for customer *Arjun Singhal*).

![3D Statutory Compliance Checkpoint](screenshots/compliance_gate_3d.png)

- **Visual Architecture:**
  - Rendered via **Three.js** and **@react-three/fiber**.
  - **Traveling Action Token:** Glowing green/red energy orb traveling along the Z-axis.
  - **4 Sequential Glass Gate Panels:**
    1. `RBI_MANDATE_MAX_RETRIES_3`
    2. `TRAI_QUIET_HOURS_2100_0900_IST`
    3. `MIN_COOLDOWN_48H`
    4. `TRAI_DND_CHANNEL_BLOCK`
  - **Barrier Collision / Deflection:** If an action violates a rule, the token stops directly at that panel and turns ruby red (`#f43f5e`), opening the statutory reasoning card.
  - **Interactive Controls:** "Replay Gate Pass" button to trigger real-time token traversal.

---

## 4. AI Model Prediction Studio (`/dashboard/prediction`)

*(Note: Built autonomously in commit `0b551a4` without prior user specification).*

### 4.1 Header & Parameter Input Controls
Allows real-time tuning of subscription amount, decline reason code, payment rail, customer segment, retry counts, and execution hour slider (00:00 to 24:00 IST).

![Prediction Studio Header](screenshots/prediction_studio_header.png)

### 4.2 Waterfall Probability & 5-Rule Pre-Flight Checklist
Evaluates the multi-channel success likelihood and runs live pre-flight checks against statutory boundaries.

![Prediction Studio Full](screenshots/prediction_studio.png)

### 4.3 Explainability & SHAP Feature Attribution Matrix
Shows positive and negative impact weights (e.g., UPI AutoPay rail +14%, High Value segment +18%, Transient switch +22%).

![Prediction Studio Math](screenshots/prediction_studio_math.png)

---

## Summary of Screenshot Assets

All screenshot files are saved locally in `screenshots/` and can be inspected directly:
- `screenshots/landing_page_hero.png`
- `screenshots/landing_page_simulator.png`
- `screenshots/dashboard_main.png`
- `screenshots/compliance_gate_3d.png`
- `screenshots/prediction_studio_header.png`
- `screenshots/prediction_studio.png`
- `screenshots/prediction_studio_math.png`
