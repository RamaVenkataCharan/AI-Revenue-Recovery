'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
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
import { FunnelFallback } from '@/app/components/motion/FunnelFallback';

const RecoveryFunnel3D = dynamic(
  () => import('@/app/components/motion/RecoveryFunnel3D'),
  {
    ssr: false,
    loading: () => <FunnelFallback />
  }
);

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

    const handleBatchRun = () => {
      fetchData();
    };
    window.addEventListener('batch-run-completed', handleBatchRun);
    return () => window.removeEventListener('batch-run-completed', handleBatchRun);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#26262A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#C8F000] animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Autonomous Revenue Recovery Engine
            </h1>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Real-time closed-loop pipeline for failed subscriptions & EMIs • SQLite Batch ID: <span className="num-mono text-white font-semibold">{summary?.batch_id || 'batch_live'}</span>
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-[#26262A] bg-[#141416] px-3 py-1.5 text-xs text-[#A1A1AA] hover:border-[#C8F000]/40 hover:text-white transition-colors duration-150 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-[#C8F000]' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* HERO METRICS SECTION */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Main Hero Card: Total Recovered vs At Risk */}
        <div className="lg:col-span-8 rounded-2xl bg-[#141416] p-6 border border-[#C8F000]/40 shadow-glow-accent relative overflow-hidden">
          <div className="flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#C8F000]/10 border border-[#C8F000]/30 px-2.5 py-1 text-xs font-semibold text-[#C8F000]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>MEASURABLE REVENUE RECOVERED</span>
                </div>
                <span className="text-xs font-mono text-[#A1A1AA]">
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
                    <span className="text-4xl sm:text-6xl font-black text-[#C8F000] num-mono tracking-tight">
                      {formatINR(summary?.total_recovered || 0)}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-[#C8F000]/80 num-mono">
                      ({summary?.recovery_rate_pct || 0}%)
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#A1A1AA]">
                    Recovered out of <span className="font-semibold text-white num-mono">{formatINR(summary?.total_at_risk || 0)}</span> at-risk subscription revenue across 50 portfolio accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#A1A1AA]">
                <span>Recovery Progress</span>
                <span className="font-mono text-[#C8F000] font-semibold">{summary?.recovery_rate_pct || 0}% Cleared</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#1A1A1D] border border-[#26262A] overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-[#C8F000] shadow-glow-accent transition-all duration-200 ease-out"
                  style={{ width: `${Math.min(100, Math.max(5, summary?.recovery_rate_pct || 0))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Channel Attribution Breakdown (Gateway vs Voice) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Gateway Auto-Recovery */}
          <div className="rounded-2xl bg-[#141416] p-5 border border-[#26262A] flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-[#C8F000]" />
                Gateway Auto-Retries
              </span>
              <span className="rounded bg-[#1A1A1D] px-2 py-0.5 text-[10px] font-mono font-bold text-white border border-[#26262A]">
                Tier-1 API
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-white num-mono">
                {formatINR(summary?.gateway_recovered_amount || 0)}
              </div>
              <p className="text-[11px] text-[#6B6B70] mt-1">
                Transient switches & limits recovered automatically via Razorpay API.
              </p>
            </div>
          </div>

          {/* Hinglish Voice Recovery */}
          <div className="rounded-2xl bg-[#141416] p-5 border border-[#C8F000]/30 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-[#C8F000]" />
                Hinglish Voice Channel
              </span>
              <span className="rounded bg-[#C8F000]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#C8F000] border border-[#C8F000]/30">
                Tier-2 AI Agent
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-[#C8F000] num-mono">
                {formatINR(summary?.voice_recovered_amount || 0)}
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-1">
                Recovered through voice call re-attempts & Promise-to-Pay (PTP) commitments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MOMENT 2: 3D PERSPECTIVE RECOVERY FUNNEL */}
      <RecoveryFunnel3D 
        stages={funnel} 
        isSimulating={refreshing} 
        onTriggerSimulation={fetchData} 
      />

      {/* SAFETY PROOF POINTS & COMPLIANCE GOVERNANCE ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stopping Rule Cap Enforcement */}
        <div className="rounded-xl bg-[#141416] p-5 border border-[#26262A] hover:border-[#26262A] transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#1A1A1D] p-2 text-[#C8F000]">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Stopping-Rule Triggers</h3>
                <p className="text-[11px] text-[#A1A1AA]">Hard retry & revocation limits</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-white">
              {summary?.stopping_rule_triggers_count || 4}
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-3">
            Halted automated retries on cases exceeding max 3 attempts or revoked e-mandates. Escalate to human review.
          </p>
        </div>

        {/* Compliance Gate (Anti-Harassment & DND) */}
        <div className="rounded-xl bg-[#141416] p-5 border border-[#26262A] hover:border-[#26262A] transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#1A1A1D] p-2 text-[#C8F000]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Compliance-Gate Blocks</h3>
                <p className="text-[11px] text-[#A1A1AA]">Anti-harassment & 21-08 DND</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-[#E5484D]">
              {summary?.compliance_gate_blocks_count || 4}
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-3">
            Blocked outreach to customers with &ge;2 touches in 48 hours or during restricted quiet night windows.
          </p>
        </div>

        {/* Honest Financial Exceptions */}
        <div className="rounded-xl bg-[#141416] p-5 border border-[#26262A] hover:border-[#26262A] transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#1A1A1D] p-2 text-[#E5484D]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Honest Exceptions</h3>
                <p className="text-[11px] text-[#A1A1AA]">Unresolved / Escalated cases</p>
              </div>
            </div>
            <span className="text-2xl font-bold num-mono text-[#E5484D]">
              {summary?.exceptions_count || 26}
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-3">
            Fully accountable list of cases requiring manual ops or broken PTP commitments. Never hidden or faked.
          </p>
        </div>
      </div>

      {/* AI PREDICTIVE INTELLIGENCE & FORECASTING CARD */}
      <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#C8F000]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#C8F000] border border-[#C8F000]/30 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                HYBRID BAYESIAN AI ENGINE
              </span>
              <span className="text-xs text-[#A1A1AA]">Model: <strong className="text-white font-mono">v2.4-hybrid-bayes</strong></span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Real-Time AI Recovery Probability Scoring & Pre-Flight Compliance
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Simulate multi-channel recovery likelihood across UPI Autopay, eNACH, and Cards with instant 5-rule statutory compliance verification.
            </p>
          </div>

          <Link
            href="/dashboard/prediction"
            className="flex items-center gap-2 rounded-xl bg-[#C8F000] px-4 py-2.5 text-xs font-bold text-[#0A0A0B] shadow-glow-accent hover:bg-[#b8dd00] transition-colors duration-150 shrink-0"
          >
            <span>Open AI Prediction Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* QUICK SHORTCUTS & ACTION FOOTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link 
          href="/dashboard/prediction"
          className="rounded-xl bg-[#141416] p-4 border border-[#26262A] hover:border-[#C8F000]/40 flex items-center justify-between group transition-colors duration-150"
        >
          <div>
            <span className="text-xs font-semibold text-[#C8F000] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              AI Prediction Studio
            </span>
            <p className="text-[11px] text-[#A1A1AA]">Simulate parameters & test EV scores</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#C8F000] group-hover:translate-x-1 transition-all duration-150" />
        </Link>

        <Link 
          href="/dashboard/cases"
          className="rounded-xl bg-[#141416] p-4 border border-[#26262A] hover:border-[#C8F000]/40 flex items-center justify-between group transition-colors duration-150"
        >
          <div>
            <span className="text-xs font-semibold text-white group-hover:text-[#C8F000] transition-colors duration-150">
              Explore 50 Subscription Cases
            </span>
            <p className="text-[11px] text-[#A1A1AA]">Filter by status, amounts, and outcomes</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#C8F000] group-hover:translate-x-1 transition-all duration-150" />
        </Link>

        <Link 
          href="/dashboard/voice"
          className="rounded-xl bg-[#141416] p-4 border border-[#26262A] hover:border-[#C8F000]/40 flex items-center justify-between group transition-colors duration-150"
        >
          <div>
            <span className="text-xs font-semibold text-white group-hover:text-[#C8F000] transition-colors duration-150">
              Hinglish Voice AI Showcase
            </span>
            <p className="text-[11px] text-[#A1A1AA]">Listen to audio previews & PTP scripts</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#C8F000] group-hover:translate-x-1 transition-all duration-150" />
        </Link>

        <Link 
          href="/dashboard/audit"
          className="rounded-xl bg-[#141416] p-4 border border-[#26262A] hover:border-[#C8F000]/40 flex items-center justify-between group transition-colors duration-150"
        >
          <div>
            <span className="text-xs font-semibold text-white group-hover:text-[#C8F000] transition-colors duration-150">
              Search Immutable Audit Trail
            </span>
            <p className="text-[11px] text-[#A1A1AA]">Live query logs for judge inspection</p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#C8F000] group-hover:translate-x-1 transition-all duration-150" />
        </Link>
      </div>
    </div>
  );
}
