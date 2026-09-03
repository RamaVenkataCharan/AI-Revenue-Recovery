# Project Design Review — AI Revenue Recovery Agent
**Track:** Razorpay Track 03 — Autonomous Revenue Recovery
**Author:** Mekala Rama Venkata Charan
**Status as of:** September 2026
**Document purpose:** Single source of truth on architecture, verified status, and remaining work before submission.

---

## 1. Problem & Scope

Indian subscription merchants (SaaS, OTT, Lending, EdTech) lose recurring revenue to failed UPI AutoPay / e-Mandate / card debits. The agent detects failures, classifies root cause, and runs a bounded, statutorily-compliant recovery sequence (gateway retry → WhatsApp/email nudge → Hinglish voice call with Promise-to-Pay), enforcing RBI and TRAI rules at every step.

**In scope (originally specified):**
- Failure detection across a simulated batch of subscription records
- Root-cause classification of decline reasons
- Statutory compliance gate (RBI + TRAI rules)
- Multi-channel recovery orchestration with stopping rules
- Executive dashboard with 3D visualizations of the funnel and compliance gate
- Landing page for merchant-facing positioning

**Out of scope / added without request (flagged for a decision, not silently kept):**
- AI Model Prediction Studio (`/dashboard/prediction`, `/api/predict`) — built in commit `0b551a4` without being asked for. Not yet independently verified. **Decision needed today: cut from demo path, or keep and disclose as bonus scope.**

---

## 2. Architecture

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · SQLite · Three.js / React Three Fiber

| Layer | Component | Path |
|---|---|---|
| Landing | Hero + 12-section marketing page | `src/app/page.tsx` |
| Landing | 3D revenue-flow hero scene | `src/app/components/marketing/RevenueFlow3D.tsx` (+ `RevenueFlowFallback.tsx`) |
| Dashboard | Executive console (dark theme, isolated layout) | `src/app/dashboard/layout.tsx`, `src/app/dashboard/page.tsx` |
| Dashboard | 3D recovery funnel | `src/app/components/motion/RecoveryFunnel3D.tsx` (+ `FunnelFallback.tsx`) |
| Dashboard | Case detail + 3D compliance checkpoint | `src/app/dashboard/cases/[id]/page.tsx`, `src/app/components/motion/ComplianceGateCheckpoint3D.tsx` |
| Dashboard | Case card tilt interaction | `src/app/components/motion/CaseTiltCard.tsx` |
| Compliance | Canonical rule engine | `src/compliance/gate.ts`, `gate.test.ts` |
| Compliance | Adapter layer | `src/compliance/adapter.ts`, `adapter.test.ts` |
| Unscoped | Prediction model + API | `src/prediction/model_predictor.ts`, `src/app/api/predict/route.ts` |
| Tests | Unified runner | `src/tests/run_tests.ts` |

**Statutory rules implemented (confirmed, not DPDP):**
- `RBI_MANDATE_MAX_RETRIES_3` — 3-retry cap
- `RBI_24H_PRE_DEBIT_NOTICE` — 24h pre-debit notice requirement
- `TRAI_QUIET_HOURS_2100_0900_IST` — quiet hours
- `MIN_COOLDOWN_48H` — anti-harassment cooldown
- `TRAI_DND_CHANNEL_BLOCK` — DND registry filter

---

## 3. Verification Status — what's actually confirmed vs. still claimed

This is the part that matters most for a jury. Be honest about the difference.

### ✅ Independently verifiable (evidence was actually produced in this thread)
- `ComplianceGateCheckpoint3D.tsx` source reviewed directly — confirmed it consumes real `ComplianceCheckResult[]` props, not mocked data.
- `npm test` raw output reviewed — test names and boundary conditions (e.g. exact IST/UTC transition times) have the texture of a genuine suite, not a fabricated summary.
- Test count discrepancy (41 → 44) was explained with an itemized breakdown (27 gate + 7 adapter + 2 reschedule loop + 8 predictor).
- Screenshots captured live from a running browser session via Chrome DevTools MCP (see `screenshots/` folder and `FRONTEND_VERIFICATION_REPORT.md`).

### ⚠️ Still unverified (claimed only, no evidence produced)
- **60 FPS performance.** Explicitly confirmed *not measured* — assumed from default `requestAnimationFrame` behavior only.
- `npx tsc --noEmit` output was confirmed as code 0, not full compiler output — lower confidence than the test log, but low risk either way.
- The Prediction Studio's own test suite (8/8) and source haven't been reviewed the way the compliance gate was.

### 🔴 Known bug (found via direct code read, not claimed)
`ComplianceGateCheckpoint3D.tsx`'s animation `useEffect` depends on the `results` array reference itself:
```tsx
}, [results, firstBlockedIdx, targetBlockedZ, isPlaying]);
```
If the parent passes a new array reference on every render (likely, depending on data-fetching pattern), the token animation restarts or stutters live. Not yet fixed as of this document.

---

## 4. Fix List — before today's submission

**Must fix:**
1. Memoize `results` in the parent component (or hash pass/fail state for the dependency array) to stop the animation restart bug.
2. Decide and execute on the Prediction Studio: cut it from the demo, or explicitly disclose it as added scope. No silent middle ground.
3. Remove all remaining "DPDP" references from landing/exec-summary copy — confirmed not implemented.

**Should do if time allows:**
4. Run one real Chrome DevTools performance trace on the hero scene and the funnel — even a rough frame-time number beats "assumed 60fps" in Q&A.
5. Re-run `npm test` and `npx tsc --noEmit` fresh, immediately before recording/demoing — not reused from this document.
6. Actually capture and review 2–3 real screenshots (hero, dashboard, compliance gate) before finalizing, to catch layout/asset issues no one has looked at yet.

**Do not do:**
- Do not present the 9.2–10/10 self-scored report language in the submission. Self-graded scorecards read as unverified to anyone reviewing them, and one already contained a factual test-count drift.

---

## 5. Open Questions for the Team

- Is the Prediction Studio staying in scope for today's submission — yes/no?
- Has anyone besides the build process looked at the app running in a browser yet?
- Is there time before submission to get even one DevTools performance trace, or does 60fps stay an assumption in the pitch (in which case, don't claim it was measured)?

---

*This document reflects only what has been directly verified (source code, raw test logs) versus what has been claimed but not yet evidenced (screenshots, performance numbers). Update the checkmarks above as real evidence comes in — don't let this document go stale the way the earlier status reports did.*
