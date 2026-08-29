'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  Lock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { RevenueFlowFallback } from './components/marketing/RevenueFlowFallback';

// Dynamically load the 3D revenue-flow scene (Milestone 5) with zero SSR flash
const RevenueFlow3D = dynamic(
  () => import('./components/marketing/RevenueFlow3D'),
  {
    ssr: false,
    loading: () => <RevenueFlowFallback />
  }
);

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function MarketingLandingPage() {
  const [activeTab, setActiveTab] = useState<'tier1' | 'tier2'>('tier2');

  return (
    <div className="min-h-screen bg-[#F7F7F3] text-[#111111] font-sans antialiased selection:bg-[#C8F000] selection:text-[#111111]">
      {/* ========================================================================= */}
      {/* SECTION 1: NAVIGATION BAR                                                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-[#E5E5DF] bg-[#F7F7F3]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo & Category */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111111] text-[#C8F000]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-[#111111]">
                  RECOVER<span className="text-[#686862]">AI</span>
                </span>
                <span className="rounded bg-[#FFFFFF] border border-[#E5E5DF] px-2 py-0.5 text-[10px] font-mono font-bold text-[#111111]">
                  TRACK 03
                </span>
              </div>
              <p className="text-[11px] text-[#686862]">Razorpay Autonomous Revenue Recovery</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#686862]">
            <a href="#why-now" className="hover:text-[#111111] transition-colors">Why Now</a>
            <a href="#engine" className="hover:text-[#111111] transition-colors">Recovery Engine</a>
            <a href="#workflows" className="hover:text-[#111111] transition-colors">Workflows</a>
            <a href="#stopping-rules" className="hover:text-[#111111] transition-colors">Stopping Rules</a>
            <a href="#metrics" className="hover:text-[#111111] transition-colors">Batch Proof</a>
            <a href="#architecture" className="hover:text-[#111111] transition-colors">Architecture</a>
          </nav>

          {/* Primary CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-4 py-2 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#222222] transition-all"
            >
              <span>Open Executive Console</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#C8F000]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SECTION 2: HERO SECTION WITH 3D REVENUE FLOW SCENE                        */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-14">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FFFFFF] border border-[#E5E5DF] px-3.5 py-1 text-xs font-mono font-semibold text-[#111111] mb-6 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-[#C8F000] border border-[#111111]" />
          <span>RAZORPAY HACKATHON 2026 • AUTONOMOUS REVENUE RECOVERY</span>
        </div>

        {/* Display H1 Typography */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#111111] leading-[1.03] max-w-5xl">
          Recover Indian Recurring Subscriptions. Bounded by Law.
        </h1>

        {/* Lead Paragraph */}
        <p className="mt-6 text-lg sm:text-xl text-[#686862] max-w-3xl leading-relaxed">
          An autonomous, explainable closed-loop engine for <strong className="text-[#111111]">UPI Autopay</strong>, <strong className="text-[#111111]">e-Mandates</strong>, and recurring cards. Pairs zero-touch smart gateway retries with hyper-personalized <strong className="text-[#111111]">Hinglish Voice Recovery</strong>—strictly governed by RBI 3-retry ceilings and TRAI quiet hours.
        </p>

        {/* Action Button Row */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#111111] px-6 py-3.5 text-sm font-bold text-[#FFFFFF] shadow-sm hover:bg-[#222222] transition-all"
          >
            <span>Launch Live Executive Dashboard</span>
            <ArrowRight className="h-4 w-4 text-[#C8F000]" />
          </Link>
          <Link
            href="/dashboard/cases"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FFFFFF] border border-[#E5E5DF] px-6 py-3.5 text-sm font-bold text-[#111111] hover:bg-[#F0F0EB] transition-all"
          >
            <Activity className="h-4 w-4 text-[#686862]" />
            <span>Explore 50 At-Risk Cases</span>
          </Link>
        </div>

        {/* Milestone 5: 3D Revenue-Flow Hero Canvas */}
        <div className="mt-12">
          <RevenueFlow3D />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WHY NOW — THE INDIAN RECURRING CRISIS                          */}
      {/* ========================================================================= */}
      <section id="why-now" className="border-t border-[#E5E5DF] bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              01 • Market Context
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              Why Involuntary Churn Breaks Indian Subscription Businesses
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              In India's recurring payments ecosystem, <strong className="text-[#111111]">15% to 35% of failed debits are not intentional cancellations</strong>—they are friction events caused by CBS downtime, balance timing, daily UPI limits, and strict regulatory directives.
            </p>
          </div>

          {/* Three Macro Friction Factors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="h-10 w-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5DF] flex items-center justify-center text-[#111111] mb-4 font-mono font-bold">
                01
              </div>
              <h3 className="text-lg font-bold text-[#111111]">RBI Mandate Master Directions</h3>
              <p className="mt-2 text-sm text-[#686862] leading-relaxed">
                Circular RBI/2020-21/74 enforces mandatory 24-hour pre-debit SMS/email notifications and strictly caps automated retry frequency. Blind retries trigger bank blacklisting and mandate revocation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="h-10 w-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5DF] flex items-center justify-center text-[#111111] mb-4 font-mono font-bold">
                02
              </div>
              <h3 className="text-lg font-bold text-[#111111]">TRAI Anti-Harassment Directives</h3>
              <p className="mt-2 text-sm text-[#686862] leading-relaxed">
                TCCCPR regulations mandate strict Quiet Hours between 21:00 and 09:00 IST and national DND registry compliance. Aggressive collection spamming results in heavy telecom penalties.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="h-10 w-10 rounded-xl bg-[#FFFFFF] border border-[#E5E5DF] flex items-center justify-center text-[#111111] mb-4 font-mono font-bold">
                03
              </div>
              <h3 className="text-lg font-bold text-[#111111]">UPI Limit & Payday Desynchronization</h3>
              <p className="mt-2 text-sm text-[#686862] leading-relaxed">
                Subscribers frequently hit per-day ₹1,00,000 UPI ceilings or fail debits 2 days before monthly salary deposit. Recovery requires dynamic diurnal scheduling rather than immediate retry storms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: THE 4-STAGE AUTONOMOUS RECOVERY ENGINE                         */}
      {/* ========================================================================= */}
      <section id="engine" className="border-t border-[#E5E5DF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              02 • Core Closed Loop
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              The 4-Stage Autonomous Closed Loop
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              A continuous, deterministic pipeline from webhook failure ingestion to confirmed bank settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
            {[
              {
                step: '01',
                title: 'Detect',
                file: 'subscription_failure_detector.ts',
                desc: 'Scans merchant subscriptions, flags failed mandates in real time, and computes total revenue at risk across active billing cycles.',
                badge: 'Real-time Ingestion',
              },
              {
                step: '02',
                title: 'Diagnose',
                file: 'root_cause_classifier.ts',
                desc: 'Maps raw decline codes (insufficient_funds, daily_limit_exceeded, bank_declined, card_expired) into actionable root causes with confidence ratings.',
                badge: 'Deterministic Cause',
              },
              {
                step: '03',
                title: 'Decide',
                file: 'intervention_policy.ts',
                desc: 'Cross-evaluates root cause, customer segment (VIP, standard, at-risk), and retry history to assign the optimal recovery channel.',
                badge: 'Multi-Tier Policy',
              },
              {
                step: '04',
                title: 'Execute',
                file: 'mandate_retry_executor.ts',
                desc: 'Dispatches Razorpay API debit retries, sends WhatsApp/SMS update links, or triggers personalized Hinglish Voice Agent outreach.',
                badge: 'Bounded Action',
              },
            ].map((s) => (
              <div key={s.step} className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#111111] bg-[#C8F000] px-2 py-0.5 rounded">
                      STAGE {s.step}
                    </span>
                    <span className="text-[11px] font-mono text-[#686862]">{s.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#111111]">{s.title}</h3>
                  <p className="mt-2 text-xs text-[#686862] font-mono bg-[#F7F7F3] p-1.5 rounded border border-[#E5E5DF] truncate">
                    {s.file}
                  </p>
                  <p className="mt-3 text-xs text-[#686862] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: LIVE RECOVERY SIMULATOR PREVIEW                                */}
      {/* ========================================================================= */}
      <section className="border-t border-[#E5E5DF] bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl bg-[#111111] text-[#FFFFFF] p-8 sm:p-12 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-mono font-bold text-[#C8F000] uppercase tracking-wider">
                03 • Live Simulation Engine
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-white">
                Deterministic Execution Against 50 Synthetic Indian Cases
              </h2>
              <p className="mt-4 text-sm text-[#94a3b8] leading-relaxed">
                Experience the full closed loop in action: 50 realistic accounts with varying amounts (₹999 to ₹32,000), actual bank decline reasons, TRAI DND registrations, and Promise-to-Pay verbal commitments.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#C8F000] px-5 py-3 text-xs font-bold text-[#111111] hover:bg-[#d8ff1a] transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span>Run Batch Evaluation in Console</span>
                </Link>
                <Link
                  href="/dashboard/cases/sub_1045"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-xs font-bold text-white hover:bg-white/10 transition-all"
                >
                  <span>Inspect Case sub_1045 (₹32,000)</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Spec List */}
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono relative z-10">
              <div>
                <span className="text-[#94a3b8]">PORTFOLIO SIZE</span>
                <div className="text-base font-bold text-white mt-0.5">50 Accounts</div>
              </div>
              <div>
                <span className="text-[#94a3b8]">TOTAL AT RISK</span>
                <div className="text-base font-bold text-white mt-0.5">₹3,42,850</div>
              </div>
              <div>
                <span className="text-[#94a3b8]">AVG RECOVERY RATE</span>
                <div className="text-base font-bold text-[#C8F000] mt-0.5">43.16% Settled</div>
              </div>
              <div>
                <span className="text-[#94a3b8]">AUDIT INTEGRITY</span>
                <div className="text-base font-bold text-white mt-0.5">100% Append-Only</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: RECOVERY WORKFLOWS — DUAL-TIER ARCHITECTURE                    */}
      {/* ========================================================================= */}
      <section id="workflows" className="border-t border-[#E5E5DF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              04 • Recovery Strategy
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              Dual-Tier Recovery Workflows
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              Not all failures warrant expensive telecom outreach. The policy engine intelligently separates fresh transient glitches from high-value repeat mandate failures.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Tier 1 Card */}
            <div className="p-8 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-[#F7F7F3] border border-[#E5E5DF] text-[#111111] px-2.5 py-1 rounded">
                  TIER 1 INTERVENTION
                </span>
                <span className="text-xs text-[#686862]">Fresh Failures (0–1 Retries)</span>
              </div>
              <h3 className="text-2xl font-black text-[#111111] mt-4">
                Zero-Touch Gateway Retries & Nudges
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-[#686862] leading-relaxed">
                Automated background reattempts scheduled at optimal settlement windows (e.g. +24h diurnal limit resets, post-salary credit dates). Paired with WhatsApp/SMS payment update links for expired cards.
              </p>
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#111111]">
                  <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                  <span>Immediate server retry for transient network timeouts</span>
                </div>
                <div className="flex items-center gap-2 text-[#111111]">
                  <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                  <span>24-hour diurnal scheduling for UPI daily limit exceedances</span>
                </div>
                <div className="flex items-center gap-2 text-[#111111]">
                  <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                  <span>Hosted Razorpay payment links dispatched via WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Tier 2 Card (Differentiator) */}
            <div className="p-8 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-sm relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-[#C8F000] border border-[#111111] text-[#111111] px-2.5 py-1 rounded">
                  TIER 2 • HACKATHON DIFFERENTIATOR
                </span>
                <span className="text-xs text-[#686862]">High-Value & Repeat Failures</span>
              </div>
              <h3 className="text-2xl font-black text-[#111111] mt-4">
                Hinglish Voice Recovery Agent
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-[#686862] leading-relaxed">
                Automated conversational voice outreach using natural Hindi-English code-switching. Modulates tone dynamically based on customer segment and explains the exact decline reason in plain language.
              </p>
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#111111]">
                  <PhoneCall className="h-4 w-4 text-[#111111]" />
                  <span><strong>VIP / High-Value:</strong> Deferential, concierge tone protecting status</span>
                </div>
                <div className="flex items-center gap-2 text-[#111111]">
                  <PhoneCall className="h-4 w-4 text-[#111111]" />
                  <span><strong>Standard:</strong> Friendly, direct assistance verifying authorization</span>
                </div>
                <div className="flex items-center gap-2 text-[#111111]">
                  <PhoneCall className="h-4 w-4 text-[#111111]" />
                  <span><strong>At-Risk:</strong> Firm, action-oriented outreach securing Promise-to-Pay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: BOUNDED AUTONOMY & PROMISE-TO-PAY (PTP) STATE MACHINE          */}
      {/* ========================================================================= */}
      <section className="border-t border-[#E5E5DF] bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              05 • Commitment Tracking
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              Promise-to-Pay (PTP) State Machine & Anti-Gaming Policy
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              When customers verbally commit to settle on a future date, the agent captures the commitment into a deterministic state machine: <span className="font-mono font-bold text-[#111111]">PROMISED ➔ KEPT / BROKEN</span>.
            </p>
          </div>

          <div className="mt-12 p-8 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-[#111111] text-[#C8F000] flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111111]">
                  Architectural Decision: "Does a broken promise count toward the retry cap?"
                </h3>
                <div className="mt-2 text-sm font-bold text-[#111111]">
                  YES. A broken promise increments <code className="bg-[#FFFFFF] border border-[#E5E5DF] px-2 py-0.5 rounded font-mono">retry_count_so_far</code>.
                </div>
                <p className="mt-2 text-xs sm:text-sm text-[#686862] leading-relaxed">
                  Allowing unpenalized broken promises would create an infinite deferral exploit, defeating the hard stopping-rule guarantees required by merchant finance teams and regulators. When a customer breaks a commitment and reaches 3 total attempts, the agent permanently halts automated outreach and routes the case to human finance review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: STOPPING RULES & SAFETY THRESHOLDS                             */}
      {/* ========================================================================= */}
      <section id="stopping-rules" className="border-t border-[#E5E5DF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              06 • Regulatory Restraints
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              Deterministic Stopping Rules
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              Safety rules are compiled into deterministic code—never delegated to LLM hallucination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#D94A4A]">RULE 01 • RBI §5.2</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">Max 3 Retries Ever</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Absolute lifetime cap of 3 debit attempts per failed subscription. Once breached, automated attempts permanently freeze and route to manual ops.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#F2A900]">RULE 02 • RBI §3.1</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">24h Pre-Debit Window</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Scheduled e-mandate retries require prior notification. If pre-debit notice was sent &lt; 24h prior, automated debit execution is strictly blocked.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#D94A4A]">RULE 03 • RBI ZERO TOLERANCE</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">Zero Retries on Revocation</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Upon decline code <code className="font-mono text-[11px] bg-[#F7F7F3] px-1 py-0.5 rounded">mandate_revoked</code>, zero retries are attempted. Instant escalation to billing portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: STATUTORY COMPLIANCE & TRAI DND GATING                         */}
      {/* ========================================================================= */}
      <section className="border-t border-[#E5E5DF] bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              07 • Telecom Directives
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              TRAI Quiet Hours & DND Registry Compliance
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              Customer-facing voice calls and messages pass through statutory telecommunication gates before dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#111111]">TRAI TCCCPR §12</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">Quiet Hours (21:00–09:00 IST)</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Strict curfew on outbound customer outreach during late evening and night. Evaluates UTC timestamps converted to IST (+05:30).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#111111]">RBI FAIR PRACTICES §4.3</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">Anti-Harassment 48h Cooldown</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Maximum 1 outbound contact across all channels in any rolling 48-hour window, preventing customer fatigue and harassment claims.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <div className="text-xs font-mono font-bold text-[#111111]">NATIONAL DND REGISTRY</div>
              <h3 className="text-lg font-bold text-[#111111] mt-2">Channel Redirection</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                DND-registered phone numbers are automatically blocked from voice calls and promotional WhatsApp nudges, redirecting outreach to transactional email notices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: PROOF & SIMULATED BATCH METRICS                               */}
      {/* ========================================================================= */}
      <section id="metrics" className="border-t border-[#E5E5DF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
                08 • Performance Verification
              </span>
              <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
                Simulated Batch Benchmark Results
              </h2>
            </div>
            <span className="text-xs font-mono text-[#686862] bg-[#FFFFFF] border border-[#E5E5DF] px-3 py-1.5 rounded-lg">
              Benchmark Dataset: 50 Subscriptions
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono text-[#686862]">TOTAL AT RISK</div>
              <div className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 num-mono">₹3,42,850</div>
              <p className="text-[11px] text-[#686862] mt-1">Across 50 failed subscriptions</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono text-[#686862]">RECOVERED REVENUE</div>
              <div className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 num-mono">₹1,47,984</div>
              <p className="text-[11px] text-[#111111] font-bold mt-1">43.16% Overall Recovery</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono text-[#686862]">GATEWAY API RETRIES</div>
              <div className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 num-mono">₹1,18,487</div>
              <p className="text-[11px] text-[#686862] mt-1">Zero-touch transient clears</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF]">
              <div className="text-xs font-mono text-[#686862]">HINGLISH VOICE PTP</div>
              <div className="text-3xl sm:text-4xl font-black text-[#111111] mt-2 num-mono">₹29,497</div>
              <p className="text-[11px] text-[#686862] mt-1">Verbal commitments kept</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11: SYSTEM ARCHITECTURE & DUAL-SERVER STACK                       */}
      {/* ========================================================================= */}
      <section id="architecture" className="border-t border-[#E5E5DF] bg-[#FFFFFF] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#686862]">
              09 • Production Foundation
            </span>
            <h2 className="mt-2 text-3xl sm:text-5xl font-black text-[#111111] tracking-tight">
              Dual-Server Production Stack
            </h2>
            <p className="mt-4 text-base text-[#686862]">
              Engineered for extreme reliability: Next.js 16 App Router on Port 3000 paired with a lightweight Express 5 fallback daemon on Port 3001.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <h3 className="text-base font-bold text-[#111111]">Next.js 16 + React 19</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                App Router with server-rendered dynamic endpoints (/api/dashboard, /api/cases, /api/batch) and hardware-accelerated 3D WebGL motion moments.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <h3 className="text-base font-bold text-[#111111]">SQLite WAL Persistence</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Real database (better-sqlite3) running Write-Ahead Logging with database triggers enforcing strictly append-only audit trail logs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7F7F3] border border-[#E5E5DF]">
              <h3 className="text-base font-bold text-[#111111]">Express 5 Fallback Server</h3>
              <p className="mt-2 text-xs text-[#686862] leading-relaxed">
                Dedicated headless background process for automated cron execution, microservice batch runs, and health monitoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12: FINAL CALL-TO-ACTION & FOOTER                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E5E5DF] py-20 bg-[#F7F7F3]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="p-12 rounded-3xl bg-[#111111] text-[#FFFFFF] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Enter the Live Executive Control Center
              </h2>
              <p className="mt-3 text-sm text-[#94a3b8]">
                Explore the 3D funnel flow, test interactive case card cursor tilts, inspect the 3D compliance gate checkpoints, and test Hinglish voice audio synthesis.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C8F000] px-8 py-4 text-sm font-black text-[#111111] shadow-lg hover:bg-[#d8ff1a] transition-all shrink-0"
            >
              <span>Launch Dashboard Console</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#686862] pt-8 border-t border-[#E5E5DF]">
            <p>© 2026 AI Revenue Recovery Agent • Razorpay Hackathon (Track 03)</p>
            <div className="flex items-center gap-6 font-mono text-[11px]">
              <Link href="/dashboard/cases" className="hover:text-[#111111]">Case Portfolio</Link>
              <Link href="/dashboard/audit" className="hover:text-[#111111]">Audit Ledger</Link>
              <Link href="/dashboard/voice" className="hover:text-[#111111]">Voice AI Studio</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
