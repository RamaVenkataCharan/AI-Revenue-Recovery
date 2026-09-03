# AI Revenue Recovery Agent — Complete Project Status
**Track:** Razorpay Hackathon Track 03 — Autonomous Revenue Recovery
**Author:** Mekala Rama Venkata Charan
**Generated:** September 3, 2026 · 22:28 IST
**Status:** Pre-submission final pass complete

> All numbers in this document come from commands run in this session.
> Unverified claims are explicitly marked WARNING.

---

## 1. What This Project Is

Indian subscription merchants (SaaS, OTT, Lending, EdTech) lose revenue when UPI AutoPay, e-Mandate, or recurring card debits fail silently. This agent detects those failures, classifies root cause, and runs a bounded closed-loop recovery sequence governed at every step by real Indian regulatory rules.

**Recovery waterfall:**

    Failure Detected
           |
           v
    Root Cause Classified (7 decline codes)
           |
           v
    Stopping Rules Check (safety cap, no over-retrying)
           |
           v
    Compliance Gate (RBI + TRAI rules, 5 statutory checks)
           |
           +-- PASS --> Tier-1: Gateway Auto-Retry
           |                     |
           |                     +-- Fail --> Tier-2: Hinglish Voice Recovery
           |                                         |
           |                                         +--> Promise-to-Pay state machine
           |
           +-- BLOCK --> Reschedule / Redirect / Escalate

**Statutory rules actually implemented (no others):**

| Rule Code | Regulation | What It Enforces |
|---|---|---|
| RBI_MANDATE_MAX_RETRIES_3 | RBI Circular | Hard 3-retry cap per mandate period |
| RBI_24H_PRE_DEBIT_NOTICE | RBI Circular | 24-hour notice before gateway debit |
| TRAI_QUIET_HOURS_2100_0900_IST | TRAI Telecom | No customer contact 21:00-09:00 IST |
| MIN_COOLDOWN_48H | Anti-harassment | 48-hour minimum between customer contacts |
| TRAI_DND_CHANNEL_BLOCK | TRAI DND Registry | Block direct contact to DND-registered numbers |

DPDP (Digital Personal Data Protection Act) is NOT implemented. It appeared in earlier prose as ungrounded narrative and was never in the codebase.

---

## 2. Codebase Overview

**Stack:** Next.js 16.3.2 (App Router, Turbopack) - React 19 - TypeScript 7 - Tailwind CSS v4 - SQLite (better-sqlite3) - Three.js / React Three Fiber - Framer Motion

**Scale (measured):** 54 source files - 421.9 KB of TypeScript/TSX - 3.35 MB SQLite database - 15 commits

### 2.1 Backend Engine

| Module | File | Size | Purpose |
|---|---|---|---|
| Orchestrator | src/agent/orchestrator.ts | 18.7 KB | Closed-loop batch runner |
| Detection | src/detection/subscription_failure_detector.ts | - | Scans SQLite for failed mandates |
| Diagnosis | src/diagnosis/root_cause_classifier.ts | - | Maps decline codes to root cause + channel |
| Decision | src/decision/intervention_policy.ts + stopping_rules.ts | - | Policy engine + escalation safety caps |
| Compliance Gate | src/compliance/gate.ts + adapter.ts | 15.3 KB | 5-rule statutory gate |
| Execution Gateway | src/execution/mandate_retry_executor.ts | - | Simulates Razorpay API gateway retry |
| Execution Voice | src/execution/hinglish_voice_agent.ts | - | Hinglish scripts + PTP state machine |
| Scheduler | src/tracking/retry_scheduler.ts | - | Deferred action queue; 2-cycle loop resolver |
| Audit | src/audit/audit_logger.ts | - | Append-only SQLite audit log |
| Prediction Engine | src/prediction/model_predictor.ts | 17.8 KB | UNSCOPED - added without request |
| Database | src/db/database.ts + seed.ts + types.ts | - | Schema + 50-record seed + TS types |

### 2.2 Frontend Routes

| Route | File | Size | Status |
|---|---|---|---|
| / | src/app/page.tsx | 52.6 KB | OK - Landing: 12 sections + 3D hero |
| /dashboard | src/app/dashboard/page.tsx | 16.5 KB | OK - Executive console + 3D funnel |
| /dashboard/cases | src/app/dashboard/cases/page.tsx | 14.6 KB | OK - Case portfolio + tilt cards |
| /dashboard/cases/[id] | src/app/dashboard/cases/[id]/page.tsx | 17.2 KB | OK - 3D compliance gate (bug fixed) |
| /dashboard/audit | src/app/dashboard/audit/page.tsx | - | OK - Audit ledger |
| /dashboard/voice | src/app/dashboard/voice/page.tsx | - | OK - Voice transcript viewer |
| /dashboard/prediction | src/app/dashboard/prediction/page.tsx | 47.4 KB | UNSCOPED - added without request |

### 2.3 API Endpoints

| Endpoint | Purpose | Scoped? |
|---|---|---|
| POST /api/batch | Run live recovery batch (50 subscriptions) | YES |
| GET /api/dashboard | Aggregate KPI metrics | YES |
| GET /api/cases | Full case portfolio list | YES |
| GET /api/cases/[id] | Single-case deep-dive + compliance results | YES |
| GET /api/audit | Full audit ledger | YES |
| GET /api/voice | Voice transcripts + PTP records | YES |
| GET+POST /api/predict | Prediction model (Bayesian scorer) | NO - unscoped |

### 2.4 3D and Motion Components

Three precisely scoped visual moments (limited by motion-budget.ts design policy):

| Component | Purpose | Tech | Size |
|---|---|---|---|
| ComplianceGateCheckpoint3D.tsx | Compliance gate visualization | Three.js / RTF | 16.6 KB |
| RecoveryFunnel3D.tsx | Recovery funnel in dashboard | Three.js / RTF | 15.4 KB |
| CaseTiltCard.tsx | Cursor-tracked spring tilt on case cards | Framer Motion | 3.2 KB |
| RevenueFlow3D.tsx | Landing page hero scene | Three.js / RTF | 12.8 KB |

All other surfaces (tables, nav, metrics cards) are intentionally flat per motion-budget.ts policy.

---

## 3. Test Suite — Live Output

**Run at:** 22:27 IST, September 3 2026
**Command:** npm test (tsx src/tests/run_tests.ts)
**Exit code:** 0 (PASS)

Individual test results:

    COMPLIANCE GATE ENGINE — 27/27 PASSED
      Rule 1 (RBI_MANDATE_MAX_RETRIES_3):
        PASS: retry_count=1 with max 3 allowed
        BLOCK: retry_count=3 (limit reached)
        BLOCK: retry_count=4 (exceeded limit)
        EXEMPT: human_escalation when retry_count=3
      Rule 2 (TRAI_QUIET_HOURS):
        BLOCK at 21:00:00 IST (exact quiet hours start)
        PASS at 20:59:00 IST (1 min before quiet hours)
        BLOCK at 08:59:00 IST (1 min before active window)
        PASS at 09:00:00 IST (exact active window opening)
        PASS at 14:30:00 IST (midday)
        BLOCK at 02:00:00 IST (middle of night)
        EXEMPT: human_escalation ignores quiet hours
      Rule 3 (RBI_24H_PRE_DEBIT_NOTICE):
        PASS: Notice sent 28 hours prior
        BLOCK: Notice missing (null)
        BLOCK: Notice sent only 8 hours prior
        EXEMPT: whatsapp_nudge exempt from 24h rule
      Rule 4 (MIN_COOLDOWN_48H):
        PASS: Never contacted before (null)
        PASS: Contacted 72 hours ago
        BLOCK: Contacted 14 hours ago
        EXEMPT: gateway_retry is backend debit
      Rule 5 (TRAI_DND_CHANNEL_BLOCK):
        BLOCK: DND customer for WhatsApp nudge
        BLOCK: DND customer for Voice Call
        PASS: Non-DND customer for WhatsApp nudge
        EXEMPT: DND customer for transactional email
        Independence A: DND registered during daytime (14:00 IST)
        Independence B: Non-DND during quiet hours (23:00 IST)
      Combined: FULLY COMPLIANT retry_now (all 5 rules pass)
      Combined: MULTI-FAILURE (3 rules fail simultaneously)

    COMPLIANCE ADAPTER — 7/7 PASSED
    RESCHEDULE LOOP — 2/2 PASSED
    DETECTION — 50/50 events detected
    ROOT CAUSE CLASSIFIER — 7/7 decline codes verified
    STOPPING RULES — PASSED
    PROMISE-TO-PAY STATE MACHINE — PASSED
    VOICE RECOVERY POLICY — PASSED
    AI MODEL PREDICTOR — 8/8 PASSED

    TOTAL ASSERTED: 44 tests across 9 test files

### Test Count Breakdown

| Suite | File | Tests |
|---|---|---|
| Compliance Gate | src/compliance/gate.test.ts | 27 |
| Compliance Adapter | src/compliance/adapter.test.ts | 7 |
| Reschedule Loop | src/tests/reschedule_loop.test.ts | 2 |
| AI Model Predictor | src/tests/prediction_model.test.ts | 8 |
| 5 other modules | src/tests/*.test.ts | pass/fail |
| TOTAL ASSERTED | | 44 |

---

## 4. TypeScript Compilation

**Command:** npx tsc --noEmit
**Exit code:** 0
**Errors:** ZERO
**Warnings:** ZERO

---

## 5. Live Database State

**File:** revenue_recovery.db (3.35 MB, SQLite WAL mode)
**Records:** 50 simulated Indian subscription failures

| Status | Count | Amount |
|---|---|---|
| Recovered via Hinglish Voice PTP | 1 | Rs 9,999 (Sunil Gavaskar) |
| Active voice targets in seed | 3 | Rs 6,999 + Rs 12,500 + Rs 32,000 |
| Total at-risk portfolio | 50 | Rs 3,29,659 |
| Total recovered | 1 | Rs 9,999 (3.03%) |

3 high-value voice cases (sub_1014, sub_1029, sub_1045) remain unresolved — this reflects the real recovery lifecycle where not all cases close in one batch.

---

## 6. Performance — Real Trace Numbers

Traces run against live dev server via Chrome DevTools. CPU: 1x (no throttling). Network: none.

| Page | LCP | TTFB | Render Delay | CLS |
|---|---|---|---|---|
| / (landing + 3D hero) | 220 ms | 52 ms | 167 ms | 0.00 |
| /dashboard/cases/sub_1014 (3D compliance gate) | 939 ms | 51 ms | 888 ms | 0.00 |

The 888 ms render delay on the compliance gate page is Three.js WebGL canvas cold-loading
(lazy-loaded via next/dynamic with SSR:false). This is expected and acceptable for demo.

HONEST PITCH CLAIM: "LCP 220ms landing page. Compliance gate loads under 1 second including WebGL init."
DO NOT CLAIM: "60fps" — frame rate was never measured. Runs at monitor vsync; not independently profiled.

---

## 7. Bug Fixed This Session

### React Hooks Order Violation — CRITICAL, FIXED

**File:** src/app/dashboard/cases/[id]/page.tsx

**What crashed:** useMemo hook was placed after two early-return guards (if loading, if !data.subscription),
violating React rules of hooks. Result: hard crash "Rendered more hooks than during the previous render"
on the entire case deep-dive page. The 3D compliance gate, audit timeline, and all case data were
inaccessible. The crash was introduced when the first useMemo fix was applied to the wrong location.

**Fix:** Moved useMemo to before any early returns, handling nullable data with optional chaining.

BEFORE (illegal — hook after early return):
    }, [subscriptionId]);
    ...
    if (loading) { return <Skeleton /> }            // early return
    if (!data?.subscription) { return <Error /> }   // early return
    ...
    const complianceResults = useMemo(...)          // CRASH: hook after return

AFTER (correct — hook before all early returns):
    }, [subscriptionId]);
    const complianceResults = useMemo(
      () => data?.compliance_results ?? [],
      [data]
    );
    ...
    if (loading) { return <Skeleton /> }
    if (!data?.subscription) { return <Error /> }

**Evidence:** tsc --noEmit exits 0. Browser screenshot confirms page renders with canvas live, no error overlay.

---

## 8. Known Remaining Issues

### 8.1 Prediction Studio — Unscoped (YOUR DECISION NEEDED)

Commit 0b551a4 added a full prediction studio without being asked.
Content: /dashboard/prediction page (47.4 KB), /api/predict route, src/prediction/model_predictor.ts (17.8 KB)
Tests: 8/8 pass — source not audited at depth (unlike compliance gate which was line-reviewed)
Current state: visible in dashboard navbar as "AI Model Prediction" with "Live AI" badge

DECISION: keep or cut? (see Section 12)

### 8.2 FPS Not Measured

"60fps" appeared in multiple earlier reports. Confirmed not measured. Remove from all pitch claims.
Correct claim: "runs at monitor refresh rate on desktop hardware."

### 8.3 Three.js Clock Deprecation Warning

Console: THREE.Clock deprecation warning during animation initialization.
Impact: cosmetic only, no behavioral effect. Not blocking.

### 8.4 Mobile Navbar Overflow

Dashboard navbar overflows at viewport widths below 360px.
Impact: demo will be on desktop. Not blocking.

---

## 9. Verified vs. Claimed — Honesty Table

| Claim | Evidence Status | Source |
|---|---|---|
| 44 unit tests pass | VERIFIED | Live npm test output this session |
| Zero TypeScript errors | VERIFIED | tsc --noEmit exit code 0 this session |
| 3D compliance gate renders | VERIFIED | Browser screenshot, canvas live, no error overlay |
| useMemo bug fixed | VERIFIED | Diff + tsc pass + screenshot with no crash overlay |
| DPDP not in source code | VERIFIED | grep across all .ts/.tsx/.js — zero matches |
| LCP 220ms landing | VERIFIED | Chrome DevTools trace (raw numbers above) |
| LCP 939ms compliance gate | VERIFIED | Chrome DevTools trace (raw numbers above) |
| 60fps animation | NOT MEASURED | Assumed from rAF — never profiled |
| Prediction Studio source depth | NOT AUDITED | Only pass/fail tested; not line-reviewed |
| Mobile layout | NOT TESTED | Known overflow < 360px, untested otherwise |

---

## 10. All Project Files

| File | Purpose |
|---|---|
| README.md | Project overview |
| PROJECT_STATUS_FINAL.md | This document |
| DESIGN_REVIEW.md | Submission readiness checklist |
| FRONTEND_VERIFICATION_REPORT.md | Frontend source + evidence dump |
| FRONTEND_SHOWCASE.md | Visual showcase with screenshots |
| revenue_recovery.db | Live SQLite database (3.35 MB) |
| screenshots/ | Browser-captured screenshots (live, not markdown links) |
| src/ | All source code (54 files, 421.9 KB) |

---

## 11. One Remaining Open Decision

**Prediction Studio: keep or cut?**

- KEEP: I will do a full line-by-line source audit of model_predictor.ts and prediction/page.tsx,
  matching the depth that was done for the compliance gate. Will trace all 8 test assertions to
  their source and flag anything unverified.

- CUT: I will remove "AI Model Prediction" from the dashboard navbar so it is unreachable during demo.
  Code stays on disk. Takes approximately 2 minutes.

Reply keep or cut. That is the only thing blocking a clean submission state.

---

Generated: npm test exit 0 - tsc --noEmit exit 0 - Chrome DevTools traces - direct source read - live browser screenshots
No numbers estimated. No numbers carried over from prior reports.
