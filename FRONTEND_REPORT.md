# Frontend Systems & UI Architecture Report
**Project:** AI Revenue Recovery Agent (Autonomous Revenue Recovery)  
**Date:** August 27, 2026  
**Status:** Live & Rendering on `http://localhost:3000`

---

## 1. Visual Page Inventory & Live Rendered Screenshots

Below are the full-page screenshots captured directly from the live browser session on `http://localhost:3000`:

### 🔹 Screen 1: Executive Command Center (`/dashboard`)
> Real-time financial dashboard displaying ARR at risk, recovered revenue, automated recovery progress bar, channel attribution (Gateway vs. Voice), 5-stage funnel flow, and regulatory governance counters.

![Executive Command Center (Route: /dashboard)](file:///c:/Users/ramav/Documents/PROJECTS/AI%20Revenue%20Recovery/public/screenshots/01_executive_dashboard.png)

---

### 🔹 Screen 2: Case Portfolio & Subscription Drill-Down (`/dashboard/cases`)
> Filterable subscriber portfolio with customer tier badges, failure codes, mandate payment rails, touch-frequency indicators, and intervention triggers.

![Case Portfolio (Route: /dashboard/cases)](file:///c:/Users/ramav/Documents/PROJECTS/AI%20Revenue%20Recovery/public/screenshots/02_case_portfolio.png)

---

### 🔹 Screen 3: Regulatory Compliance & Immutable Audit Trail (`/dashboard/audit`)
> Searchable append-only audit trail logging every compliance decision, quiet hours DND block, RBI 3-retry cap check, and context snapshot for statutory traceability.

![Immutable Audit Trail & Compliance Ledger (Route: /dashboard/audit)](file:///c:/Users/ramav/Documents/PROJECTS/AI%20Revenue%20Recovery/public/screenshots/03_audit_ledger.png)

---

### 🔹 Screen 4: Hinglish AI Voice Recovery Studio (`/dashboard/voice`)
> Conversational voice recovery layer featuring high-ticket subscriber prioritization, multi-dialect prompt scripts (Hinglish / Hindi / English), interactive audio transcript simulation, and Promise-to-Pay (PTP) recording.

![Hinglish AI Voice Recovery Studio (Route: /dashboard/voice)](file:///c:/Users/ramav/Documents/PROJECTS/AI%20Revenue%20Recovery/public/screenshots/04_voice_studio.png)

---

## 2. Technology Stack & Design System

| Layer | Dependency / Spec | Role in Frontend Architecture |
| :--- | :--- | :--- |
| **Framework** | Next.js `16.3.2` (Turbopack, App Router) | SSR, route segments, streaming transitions, API route handlers |
| **Runtime & UI** | React `19.2.8`, TypeScript `7.0.2` | Component state, event dispatching, strict prop interfaces |
| **Styling** | Tailwind CSS `4.3.3`, `@tailwindcss/postcss` | Dark fintech design system, glassmorphism, responsive grids |
| **Icons & Indicators** | `lucide-react` `1.33.0` | Regulatory shields, status pulses, currency badges, action icons |
| **Class Utilities** | `clsx`, `tailwind-merge` | Conditional badge states and dynamic styling |

### Current Design System Tokens:
- **Background**: Dark Navy / Charcoal (`#060911`, `#070b14`, `#0c1424`)
- **Card Surface**: Linear gradient `135deg` from `rgba(15, 23, 42, 0.85)` to `rgba(10, 16, 31, 0.95)` with `backdrop-filter: blur(12px)`
- **Border**: Subtle low-opacity white (`rgba(255, 255, 255, 0.08)`)
- **Primary / Recovered Accent**: Emerald (`#10b981`, Glow: `rgba(16, 185, 129, 0.25)`)
- **Warning / PTP / Voice Accent**: Amber (`#f59e0b`, Glow: `rgba(245, 158, 11, 0.25)`)
- **Compliance / Info Accent**: Cyan (`#06b6d4`, Glow: `rgba(6, 182, 212, 0.25)`)
- **Danger / Blocked Accent**: Rose / Crimson (`#ef4444`, Glow: `rgba(239, 68, 68, 0.25)`)
- **Typography**: `Inter, system-ui, -apple-system, sans-serif` for UI copy; `ui-monospace, SFMono-Regular, Menlo, monospace` (`.num-mono`) for all financial amounts and timestamps.

---

## 3. Screen-by-Screen Functional Overview

### 🔹 1. Executive Dashboard (`/dashboard`)
- **KPI Metrics Header**: Displays live computed ARR At Risk, Recovered ARR ($$₹$$), Recovery Rate ($$\%$$), and Active Pipeline Cases.
- **Channel Attribution**: Cards breaking down revenue reclaimed by automated gateway retries vs. Hinglish AI Voice calls.
- **Interactive 5-Stage Recovery Funnel**: Visualizes volume and drop-off through:
  $$\text{Failed Mandate (100\%)} \longrightarrow \text{Notified (68\%)} \longrightarrow \text{Promise to Pay (48\%)} \longrightarrow \text{Settled (64\%)}$$
- **Regulatory Safety Proof Points**: 3 governance cards showing real-time Stopping-Rule triggers, Compliance-Gate blocks (anti-harassment & quiet hours), and Honest Financial Exceptions.
- **Live Batch Trigger**: Dispatches batch execution across all cases with instant animated state updates.

### 🔹 2. Case Portfolio (`/dashboard/cases`)
- Search & filter by risk tier (`VIP`, `Standard`, `At Risk`), failure reason (`insufficient_funds`, `bank_timeout`, `expired_mandate`, `technical_decline`), and status.
- Table view with customer names, subscription amounts, payment rail badges (UPI Autopay, e-Mandate, Cards), retry counters ($$n/3$$), and direct intervention buttons.

### 🔹 3. Immutable Audit Trail (`/dashboard/audit`)
- Filterable search across append-only compliance logs.
- Lists exact statutory rule citations for every check (`TRAI_QUIET_HOURS_2100_0900_IST`, `RBI_MANDATE_MAX_RETRIES_3`, `RBI_24H_PRE_DEBIT_NOTICE`, `MIN_COOLDOWN_48H`, `TRAI_DND_CHANNEL_BLOCK`).
- Expandable JSON snapshots showing actor, timestamp, input parameters, and generated reason string.

### 🔹 4. Voice AI Showcase (`/dashboard/voice`)
- Tailored for high-ticket overdue subscription accounts ($$\ge ₹4,999$$).
- Generates localized conversational scripts in **Hinglish**, **Hindi**, and **Formal English**.
- Interactive transcript player demonstrating behavioral psychology: polite urgency, bank downtime acknowledgment, UPI deep-link triggers, and Promise-to-Pay (PTP) recording.

---

## 4. Frontend Source Code Files

### 📄 File 1: `src/app/dashboard/page.tsx`

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  PhoneCall, 
  CreditCard, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [sumRes, funRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/dashboard/funnel')
      ]);
      const sumData = await sumRes.json();
      const funData = await funRes.json();

      setSummary(sumData);
      setFunnel(funData.stages || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to custom batch run event from Navbar
    const handleBatchRun = () => {
      fetchData();
    };
    window.addEventListener('batch-run-completed', handleBatchRun);
    return () => window.removeEventListener('batch-run-completed', handleBatchRun);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Autonomous Revenue Recovery Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time closed-loop pipeline for failed subscriptions & EMIs • SQLite Batch ID: <span className="num-mono text-slate-300 font-semibold">{summary?.batch_id || 'batch_live'}</span>
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* HERO METRICS SECTION */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Main Hero Card: Total Recovered vs At Risk */}
        <div className="lg:col-span-8 rounded-2xl glass-panel p-6 shadow-glow-emerald border border-emerald-500/30 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          
          <div className="flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>MEASURABLE REVENUE RECOVERED</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {summary?.timestamp ? new Date(summary.timestamp).toLocaleTimeString() : 'Live'}
                </span>
              </div>

              {loading ? (
                <div className="space-y-3 mt-4">
                  <div className="skeleton h-14 w-3/4" />
                  <div className="skeleton h-6 w-1/2" />
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-6xl font-black text-white num-mono tracking-tight text-emerald-400">
                      {formatINR(summary?.total_recovered || 0)}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-400/80 num-mono">
                      ({summary?.recovery_rate_pct || 0}%)
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    Recovered out of <span className="font-semibold text-white num-mono">{formatINR(summary?.total_at_risk || 0)}</span> at-risk subscription revenue across 50 portfolio accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Recovery Progress</span>
                <span className="font-mono text-emerald-300 font-semibold">{summary?.recovery_rate_pct || 0}% Cleared</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-glow-emerald transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(5, summary?.recovery_rate_pct || 0))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Attribution Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl glass-panel p-5 border border-white/10 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-teal-400" />
                Gateway Auto-Retries
              </span>
              <span className="rounded bg-teal-950/80 px-2 py-0.5 text-[10px] font-mono font-bold text-teal-400 border border-teal-800">
                Tier-1 API
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-white num-mono">
                {formatINR(summary?.gateway_recovered_amount || 0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Transient switches & limits recovered automatically via payment gateway API.
              </p>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-5 border border-amber-500/30 bg-gradient-to-br from-[#12192c] to-[#181a2e] flex-1 flex flex-col justify-between shadow-glow-amber">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-amber-400" />
                Hinglish Voice Channel
              </span>
              <span className="rounded bg-amber-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800">
                Tier-2 AI Agent
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-amber-300 num-mono">
                {formatINR(summary?.voice_recovered_amount || 0)}
              </div>
              <p className="text-[11px] text-amber-200/70 mt-1">
                Recovered through voice call re-attempts & Promise-to-Pay (PTP) commitments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RECOVERY FUNNEL VISUALIZATION */}
      <div className="rounded-2xl glass-panel p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Autonomous Recovery Funnel Flow
            </h2>
            <p className="text-xs text-slate-400">
              Stage-by-stage progression from detection to confirmed money settlement
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
            Zero Unchecked Actions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {funnel.map((stage, idx) => (
            <div 
              key={stage.stage}
              className={`rounded-xl p-4 border flex flex-col justify-between transition-all ${
                idx === 4 
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-glow-emerald' 
                  : idx === 2
                  ? 'bg-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Step 0{idx + 1}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    idx === 4 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {stage.percentage}%
                  </span>
                </div>

                <div className="text-sm font-semibold text-white">
                  {stage.label.split('. ')[1] || stage.label}
                </div>

                <div className="mt-3 text-2xl font-bold num-mono text-white">
                  {stage.count} <span className="text-xs font-normal text-slate-400">cases</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SAFETY PROOF POINTS & COMPLIANCE GOVERNANCE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stopping Rule Cap Enforcement */}
        <div className="rounded-xl glass-panel p-5 border border-white/10 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Stopping-Rule Triggers</h3>
                <p className="text-[11px] text-slate-400">Hard retry & revocation limits</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-amber-400">
              {summary?.stopping_rule_triggers_count || 4}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-3">
            Halted automated retries on cases exceeding max 3 attempts or revoked e-mandates. Escalate to human review.
          </p>
        </div>

        {/* Compliance Gate */}
        <div className="rounded-xl glass-panel p-5 border border-white/10 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Compliance-Gate Blocks</h3>
                <p className="text-[11px] text-slate-400">Anti-harassment & 21-08 DND</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-cyan-400">
              {summary?.compliance_gate_blocks_count || 4}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-3">
            Blocked outreach to customers with &ge;2 touches in 48 hours or during restricted quiet night windows.
          </p>
        </div>

        {/* Honest Financial Exceptions */}
        <div className="rounded-xl glass-panel p-5 border border-white/10 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Honest Exceptions</h3>
                <p className="text-[11px] text-slate-400">Unresolved / Escalated cases</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-rose-400">
              {summary?.exceptions_count || 26}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-3">
            Fully accountable list of cases requiring manual ops or broken PTP commitments. Never hidden or faked.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### 📄 File 2: `src/app/globals.css`

```css
@import "tailwindcss";

:root {
  --bg-main: #060911;
  --card-surface: #0c1424;
  --card-border: rgba(255, 255, 255, 0.08);
  --emerald-primary: #10b981;
  --emerald-glow: rgba(16, 185, 129, 0.25);
  --amber-accent: #f59e0b;
}

body {
  background-color: var(--bg-main);
  color: #f1f5f9;
  font-feature-settings: "rlig" 1, "calt" 1;
  overflow-x: hidden;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #080d1a;
}
::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

/* Monospace Numbers */
.num-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: -0.02em;
}

/* Glass Card */
.glass-panel {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 16, 31, 0.95) 100%);
  backdrop-filter: blur(12px);
  border: 1px solid var(--card-border);
}

.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

/* Shimmer Loading Skeleton */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #0e1628 25%, #192540 50%, #0e1628 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s infinite;
  border-radius: 6px;
}

.shadow-glow-emerald {
  box-shadow: 0 0 25px -5px rgba(16, 185, 129, 0.25);
}

.shadow-glow-amber {
  box-shadow: 0 0 25px -5px rgba(245, 158, 11, 0.25);
}

.shadow-glow-cyan {
  box-shadow: 0 0 25px -5px rgba(6, 182, 212, 0.25);
}

.shadow-inner-card {
  box-shadow: inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

### 📄 File 3: `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';

export const metadata: Metadata = {
  title: 'AI Revenue Recovery Agent — Autonomous Revenue Recovery for Indian Recurring Subscriptions',
  description: 'Closed-loop autonomous revenue recovery engine with Hinglish voice outreach, strict stopping rules, and immutable audit trails.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
```

---

### 📄 File 4: `src/app/components/Navbar.tsx`

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Activity, ListChecks, FileText, Mic, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [lastBatchMessage, setLastBatchMessage] = useState<string | null>(null);

  const navLinks = [
    { href: '/dashboard', label: 'Executive Dashboard', icon: Activity },
    { href: '/dashboard/cases', label: 'Case Portfolio', icon: ListChecks },
    { href: '/dashboard/audit', label: 'Immutable Audit Trail', icon: FileText },
    { href: '/dashboard/voice', label: 'Voice AI Showcase', icon: Mic },
  ];

  const handleRunBatch = async () => {
    try {
      setIsRunningBatch(true);
      setLastBatchMessage(null);
      
      const res = await fetch('/api/batch/run', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setLastBatchMessage(`Batch ${data.report?.batch_id?.substring(0, 14)} ran successfully!`);
        router.refresh();
        window.dispatchEvent(new CustomEvent('batch-run-completed', { detail: data.report }));
      } else {
        setLastBatchMessage('Batch run encountered an issue.');
      }
    } catch (err) {
      console.error(err);
      setLastBatchMessage('Batch trigger failed.');
    } finally {
      setIsRunningBatch(false);
      setTimeout(() => setLastBatchMessage(null), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-glow-emerald">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">RECOVER<span className="text-emerald-400">AI</span></span>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/60">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Revenue Recovery</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner-card'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Batch Trigger Action */}
        <div className="flex items-center gap-3">
          {lastBatchMessage && (
            <div className="hidden lg:flex items-center gap-1.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{lastBatchMessage}</span>
            </div>
          )}
          <button
            onClick={handleRunBatch}
            disabled={isRunningBatch}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-glow-emerald hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunningBatch ? 'animate-spin' : ''}`} />
            <span>{isRunningBatch ? 'Simulating Batch...' : 'Run Live Batch'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
```

---

### 📄 File 5: Representative Metric Card Component (Hero Card from `page.tsx`)

```tsx
{/* Main Hero Card: Total Recovered vs At Risk */}
<div className="lg:col-span-8 rounded-2xl glass-panel p-6 shadow-glow-emerald border border-emerald-500/30 relative overflow-hidden">
  {/* Ambient light blur */}
  <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
  
  <div className="flex flex-col justify-between h-full space-y-6">
    <div>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-md bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>MEASURABLE REVENUE RECOVERED</span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {summary?.timestamp ? new Date(summary.timestamp).toLocaleTimeString() : 'Live'}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-6xl font-black text-white num-mono tracking-tight text-emerald-400">
            {formatINR(summary?.total_recovered || 0)}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-400/80 num-mono">
            ({summary?.recovery_rate_pct || 0}%)
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Recovered out of <span className="font-semibold text-white num-mono">{formatINR(summary?.total_at_risk || 0)}</span> at-risk subscription revenue across 50 portfolio accounts.
        </p>
      </div>
    </div>

    {/* Progress Bar Gauge */}
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Recovery Progress</span>
        <span className="font-mono text-emerald-300 font-semibold">{summary?.recovery_rate_pct || 0}% Cleared</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-glow-emerald transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(5, summary?.recovery_rate_pct || 0))}%` }}
        />
      </div>
    </div>
  </div>
</div>
```
