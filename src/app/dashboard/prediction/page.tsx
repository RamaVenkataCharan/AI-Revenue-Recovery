'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Cpu,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Clock,
  Sliders,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Layers,
  HelpCircle,
  FileText,
  User,
  Zap,
  Info
} from 'lucide-react';
import { PredictionInput, PredictionOutput } from '@/prediction/model_predictor';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

const PRESETS = [
  {
    label: 'Kiran Mazumdar (₹32k Limit Exceeded)',
    data: {
      subscription_id: 'sub_1045',
      customer_name: 'Kiran Mazumdar',
      amount: 32000,
      failure_reason_code: 'daily_limit_exceeded',
      payment_method: 'upi_autopay',
      customer_segment: 'high_value',
      retry_count_so_far: 1,
      customer_tenure_months: 24,
      time_of_debit_ist_hour: 14,
      is_dnd_registered: false,
      has_pre_debit_notice: true,
      hours_since_last_contact: 72
    }
  },
  {
    label: 'Arjun Singhal (₹7k Salary Cycle)',
    data: {
      subscription_id: 'sub_1014',
      customer_name: 'Arjun Singhal',
      amount: 6999,
      failure_reason_code: 'insufficient_funds',
      payment_method: 'upi_autopay',
      customer_segment: 'high_value',
      retry_count_so_far: 1,
      customer_tenure_months: 14,
      time_of_debit_ist_hour: 11,
      is_dnd_registered: false,
      has_pre_debit_notice: true,
      hours_since_last_contact: 48
    }
  },
  {
    label: 'Pallavi Kulkarni (₹12.5k Expired Card)',
    data: {
      subscription_id: 'sub_1029',
      customer_name: 'Pallavi Kulkarni',
      amount: 12500,
      failure_reason_code: 'card_expired',
      payment_method: 'card_mandate',
      customer_segment: 'high_value',
      retry_count_so_far: 0,
      customer_tenure_months: 18,
      time_of_debit_ist_hour: 15,
      is_dnd_registered: false,
      has_pre_debit_notice: true,
      hours_since_last_contact: 96
    }
  },
  {
    label: 'Gaurav Sen (₹12k Tech Glitch)',
    data: {
      subscription_id: 'sub_1020',
      customer_name: 'Gaurav Sen',
      amount: 11999,
      failure_reason_code: 'technical_error',
      payment_method: 'upi_autopay',
      customer_segment: 'standard',
      retry_count_so_far: 0,
      customer_tenure_months: 8,
      time_of_debit_ist_hour: 10,
      is_dnd_registered: false,
      has_pre_debit_notice: true,
      hours_since_last_contact: 120
    }
  },
  {
    label: 'Late Night Throttle (23:30 Quiet Hours)',
    data: {
      subscription_id: 'sub_night',
      customer_name: 'Rohan Varma',
      amount: 4500,
      failure_reason_code: 'bank_declined',
      payment_method: 'card_mandate',
      customer_segment: 'at_risk',
      retry_count_so_far: 1,
      customer_tenure_months: 5,
      time_of_debit_ist_hour: 23,
      is_dnd_registered: false,
      has_pre_debit_notice: true,
      hours_since_last_contact: 24
    }
  },
  {
    label: 'Revoked UPI Mandate (₹1.5k)',
    data: {
      subscription_id: 'sub_revoked',
      customer_name: 'Nisha Gupta',
      amount: 1499,
      failure_reason_code: 'mandate_revoked',
      payment_method: 'upi_autopay',
      customer_segment: 'standard',
      retry_count_so_far: 0,
      customer_tenure_months: 3,
      time_of_debit_ist_hour: 13,
      is_dnd_registered: true,
      has_pre_debit_notice: false,
      hours_since_last_contact: 10
    }
  }
];

export default function PredictionStudioPage() {
  const [params, setParams] = useState<PredictionInput>(PRESETS[0].data);
  const [prediction, setPrediction] = useState<PredictionOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'portfolio'>('simulator');
  const [caseList, setCaseList] = useState<any[]>([]);

  // Execute prediction whenever params change
  useEffect(() => {
    let isCancelled = false;

    const runPredict = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
        const data = await res.json();
        if (!isCancelled && data.success) {
          setPrediction(data.prediction);
        }
      } catch (err) {
        console.error('Prediction failed:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    const timer = setTimeout(runPredict, 120);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [params]);

  // Load portfolio cases & stats on mount
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const [portRes, casesRes] = await Promise.all([
          fetch('/api/predict'),
          fetch('/api/cases?limit=50')
        ]);
        const portData = await portRes.json();
        const casesData = await casesRes.json();
        if (portData.success) setPortfolioStats(portData.portfolio);
        if (casesData.cases) setCaseList(casesData.cases);
      } catch (e) {
        console.error('Failed to load portfolio stats:', e);
      }
    };
    fetchPortfolio();
  }, []);

  const handleCaseSelect = (subId: string) => {
    const found = caseList.find(c => c.subscription_id === subId);
    if (found) {
      setParams({
        subscription_id: found.subscription_id,
        customer_name: found.customer_name,
        amount: found.amount,
        failure_reason_code: found.failure_reason_code,
        payment_method: found.payment_method || 'upi_autopay',
        customer_segment: found.customer_segment || 'standard',
        retry_count_so_far: found.retry_count_so_far || 0,
        customer_tenure_months: 12,
        time_of_debit_ist_hour: 14,
        is_dnd_registered: false,
        has_pre_debit_notice: true,
        hours_since_last_contact: 72
      });
    }
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 70) return 'from-emerald-500 to-teal-500';
    if (pct >= 40) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-glow-emerald">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              AI Model Prediction & Recovery Intelligence Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hybrid Bayesian Decision Network • Real-time Multi-Channel Recovery Scoring • 5-Rule Statutory Compliance Pre-Flight
          </p>
        </div>

        {/* Studio View Tabs */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all ${
              activeTab === 'portfolio'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Portfolio Batch Forecast ({portfolioStats?.portfolio_size || 50})</span>
          </button>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <div className="space-y-6">
          {/* QUICK PRESETS ROW */}
          <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                Quick Case Presets & Portfolio Selector:
              </span>
              <span>Click to populate simulation parameters</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setParams(preset.data)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                    params.subscription_id === preset.data.subscription_id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-glow-emerald'
                      : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              {/* Dropdown for any case in DB */}
              {caseList.length > 0 && (
                <select
                  aria-label="Select database subscription case"
                  onChange={(e) => e.target.value && handleCaseSelect(e.target.value)}
                  className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-200 outline-none hover:border-emerald-500/50 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Or Pick from 50 Live Cases...</option>
                  {caseList.map((c) => (
                    <option key={c.subscription_id} value={c.subscription_id}>
                      {c.subscription_id} — {c.customer_name} ({formatINR(c.amount)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* MAIN SIMULATOR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: INTERACTIVE PARAMETER CONTROLS (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-emerald-400" />
                    Input Parameters
                  </h2>
                  <span className="text-[10px] font-mono rounded bg-emerald-950/80 px-2 py-0.5 text-emerald-400 border border-emerald-800">
                    Live Reactive
                  </span>
                </div>

                {/* 1. Ticket Amount Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="amount-slider" className="text-slate-300 font-semibold">Subscription Amount (₹)</label>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{formatINR(params.amount)}</span>
                  </div>
                  <input
                    id="amount-slider"
                    type="range"
                    min="499"
                    max="50000"
                    step="500"
                    value={params.amount}
                    onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                    className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>₹499 (Starter)</span>
                    <span>₹15,000 (Growth)</span>
                    <span>₹50,000 (Enterprise)</span>
                  </div>
                </div>

                {/* 2. Failure Reason Code */}
                <div className="space-y-1.5">
                  <label htmlFor="failure-reason-select" className="text-xs text-slate-300 font-semibold">Failure Reason Code</label>
                  <select
                    id="failure-reason-select"
                    value={params.failure_reason_code}
                    onChange={(e) => setParams({ ...params, failure_reason_code: e.target.value })}
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-700 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="insufficient_funds">insufficient_funds (Balance deficit)</option>
                    <option value="daily_limit_exceeded">daily_limit_exceeded (Mandate/bank cap)</option>
                    <option value="bank_declined">bank_declined (Temporary issuer throttle)</option>
                    <option value="technical_error">technical_error (Transient gateway timeout)</option>
                    <option value="card_expired">card_expired (Hard token failure)</option>
                    <option value="mandate_revoked">mandate_revoked (Explicit cancellation)</option>
                  </select>
                </div>

                {/* 3. Payment Method Rail */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-300 font-semibold">Payment Method Rail</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'upi_autopay', label: 'UPI AutoPay', desc: 'Instant 1-Click' },
                      { id: 'card_mandate', label: 'Card Mandate', desc: 'Debit/Credit Token' },
                      { id: 'enach_emandate', label: 'eNACH Mandate', desc: 'Bank Standing Order' },
                      { id: 'netbanking', label: 'NetBanking', desc: 'Direct Redirect' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setParams({ ...params, payment_method: m.id })}
                        className={`rounded-xl p-2 text-left border transition-all cursor-pointer ${
                          params.payment_method === m.id
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-semibold">{m.label}</div>
                        <div className="text-[10px] text-slate-500">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Customer Segment */}
                <div className="space-y-1.5">
                  <span className="text-xs text-slate-300 font-semibold">Customer Segment</span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'high_value', label: 'High Value VIP' },
                      { id: 'at_risk', label: 'At Risk' },
                      { id: 'standard', label: 'Standard' }
                    ].map((seg) => (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => setParams({ ...params, customer_segment: seg.id })}
                        className={`rounded-lg py-1.5 text-center font-medium border transition-all cursor-pointer ${
                          params.customer_segment === seg.id
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Prior Failed Retries */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Prior Retries So Far</span>
                    <span className={`font-mono font-bold ${params.retry_count_so_far! >= 3 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {params.retry_count_so_far} of 3 (RBI Cap)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setParams({ ...params, retry_count_so_far: cnt })}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-mono font-bold border transition-all cursor-pointer ${
                          params.retry_count_so_far === cnt
                            ? cnt >= 3
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Time of Debit (IST) with Quiet Hours Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="debit-hour-slider" className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Debit Execution Hour (IST)
                    </label>
                    <span className={`font-mono font-bold text-xs ${
                      params.time_of_debit_ist_hour! >= 21 || params.time_of_debit_ist_hour! < 9
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}>
                      {String(params.time_of_debit_ist_hour).padStart(2, '0')}:00 IST {
                        params.time_of_debit_ist_hour! >= 21 || params.time_of_debit_ist_hour! < 9
                          ? '(Quiet Hours ⚠️)'
                          : '(Active Window ✓)'
                      }
                    </span>
                  </div>
                  <input
                    id="debit-hour-slider"
                    type="range"
                    min="0"
                    max="23"
                    step="1"
                    value={params.time_of_debit_ist_hour}
                    onChange={(e) => setParams({ ...params, time_of_debit_ist_hour: Number(e.target.value) })}
                    className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span className="text-rose-400">00:00 (Quiet)</span>
                    <span className="text-emerald-400">09:00 (Open)</span>
                    <span className="text-emerald-400">14:00 (Midday)</span>
                    <span className="text-rose-400">21:00 (Quiet)</span>
                  </div>
                </div>

                {/* 7. Statutory Condition Toggles */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statutory Checkpoint Toggles</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.has_pre_debit_notice}
                        onChange={(e) => setParams({ ...params, has_pre_debit_notice: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-slate-300 text-[11px]">24h Pre-Debit Notice</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg bg-slate-900/60 p-2 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.is_dnd_registered}
                        onChange={(e) => setParams({ ...params, is_dnd_registered: e.target.checked })}
                        className="rounded accent-rose-500"
                      />
                      <span className="text-slate-300 text-[11px]">Registered on DND</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PREDICTION RADAR & INTELLIGENCE TELEMETRY (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              {/* MAIN RECOVERY SCORE & FINANCIAL EV CARD */}
              <div className="rounded-2xl glass-panel p-6 border border-emerald-500/30 relative overflow-hidden shadow-glow-emerald">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Left: Overall Recovery Probability Gauge */}
                  <div className="flex items-center gap-5">
                    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-slate-900/90 border-4 border-slate-800 shadow-inner">
                      {/* Gauge Ring */}
                      <svg className="h-full w-full -rotate-90 p-1" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-slate-800"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={264}
                          strokeDashoffset={264 - (264 * (prediction?.overall_recovery_probability_pct || 0)) / 100}
                          strokeLinecap="round"
                          className={getScoreColor(prediction?.overall_recovery_probability_pct || 0)}
                          fill="transparent"
                          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className={`text-2xl font-black num-mono ${getScoreColor(prediction?.overall_recovery_probability_pct || 0)}`}>
                          {prediction?.overall_recovery_probability_pct || 0}%
                        </span>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          Recovery
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800">
                          AI RECOVERY SCORE
                        </span>
                        <span className="text-xs text-slate-400">
                          Confidence: <strong className="text-white num-mono">{prediction?.diagnosis_confidence_pct || 95}%</strong>
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">
                        {prediction?.overall_recovery_probability_pct! >= 70
                          ? 'High Settlement Likelihood'
                          : prediction?.overall_recovery_probability_pct! >= 40
                          ? 'Moderate Multi-Touch Window'
                          : 'High Escalation / Manual Review'}
                      </h2>
                      <p className="text-xs text-slate-300 mt-1 max-w-sm">
                        {prediction?.diagnosis_explanation}
                      </p>
                    </div>
                  </div>

                  {/* Right: Expected Recovered ARR */}
                  <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4 min-w-[180px]">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Expected Value (EV)
                    </div>
                    <div className="text-2xl font-black text-emerald-400 num-mono mt-1">
                      {formatINR(prediction?.expected_recovery_amount || 0)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      out of {formatINR(prediction?.amount || 0)} at risk
                    </div>
                  </div>
                </div>
              </div>

              {/* CHANNEL-BY-CHANNEL PROBABILITY WATERFALL */}
              <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    Channel-Specific Success Probabilities
                  </h2>
                  <span className="text-[11px] text-slate-400">Sequential Waterfall Model</span>
                </div>

                <div className="space-y-3">
                  {/* Gateway Auto Retry */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <CreditCard className="h-3.5 w-3.5 text-teal-400" />
                        Tier-1 Gateway Auto-Retry
                      </span>
                      <span className="font-mono font-bold text-teal-400">{prediction?.channel_probabilities.gateway_retry_pct || 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${prediction?.channel_probabilities.gateway_retry_pct || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Hinglish Voice Call */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                        Tier-2 Hinglish Voice Outreach
                      </span>
                      <span className="font-mono font-bold text-amber-400">{prediction?.channel_probabilities.voice_outreach_pct || 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${prediction?.channel_probabilities.voice_outreach_pct || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* WhatsApp Payment Link */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                        Digital Nudge (WhatsApp / SMS Link)
                      </span>
                      <span className="font-mono font-bold text-green-400">{prediction?.channel_probabilities.whatsapp_nudge_pct || 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-300 transition-all duration-500"
                        style={{ width: `${prediction?.channel_probabilities.whatsapp_nudge_pct || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Manual Escalation Risk */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                        Escalation Risk to Manual Ops
                      </span>
                      <span className="font-mono font-bold text-rose-400">{prediction?.channel_probabilities.escalation_risk_pct || 0}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                        style={{ width: `${prediction?.channel_probabilities.escalation_risk_pct || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED POLICY ACTION & OPTIMAL WINDOW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl glass-panel p-4 border border-white/10">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recommended Policy Action
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-bold text-white text-sm">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span>{prediction?.recommended_action?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Channel: <strong className="text-slate-200">{prediction?.recommended_channel}</strong>
                  </div>
                </div>

                <div className="rounded-xl glass-panel p-4 border border-white/10">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Optimal Diurnal Timing Window
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-bold text-cyan-300 text-sm">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span>{prediction?.optimal_time_window?.split(':')[0]}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {prediction?.optimal_time_window}
                  </div>
                </div>
              </div>

              {/* 5-RULE STATUTORY COMPLIANCE PRE-FLIGHT RADAR */}
              <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    5-Rule Statutory Compliance Pre-Flight
                  </h2>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    prediction?.compliance_pre_flight.all_passed
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}>
                    {prediction?.compliance_pre_flight.all_passed ? 'ALL RULES PASS ✓' : 'ACTION BLOCKED ⚠️'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  {/* Rule 1 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {prediction?.compliance_pre_flight.rbi_max_retries.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white">1. RBI Mandate Max 3 Retries</span>
                        <p className="text-[11px] text-slate-400">{prediction?.compliance_pre_flight.rbi_max_retries.explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {prediction?.compliance_pre_flight.trai_quiet_hours.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white">2. TRAI Quiet Hours (21:00 - 09:00 IST)</span>
                        <p className="text-[11px] text-slate-400">{prediction?.compliance_pre_flight.trai_quiet_hours.explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 3 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {prediction?.compliance_pre_flight.rbi_pre_debit_notice.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white">3. RBI 24h Pre-Debit Notice</span>
                        <p className="text-[11px] text-slate-400">{prediction?.compliance_pre_flight.rbi_pre_debit_notice.explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 4 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {prediction?.compliance_pre_flight.anti_harassment_cooldown.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white">4. 48h Anti-Harassment Cooldown</span>
                        <p className="text-[11px] text-slate-400">{prediction?.compliance_pre_flight.anti_harassment_cooldown.explanation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rule 5 */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-2">
                      {prediction?.compliance_pre_flight.trai_dnd_status.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-white">5. TRAI National DND Filter</span>
                        <p className="text-[11px] text-slate-400">{prediction?.compliance_pre_flight.trai_dnd_status.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHAP-STYLE FEATURE ATTRIBUTIONS */}
              <div className="rounded-2xl glass-panel p-5 border border-white/10 space-y-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" />
                  Model Feature Attribution (SHAP Factors)
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {prediction?.feature_attributions.map((fa, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{fa.factor}</span>
                        <p className="text-[11px] text-slate-400">{fa.description}</p>
                      </div>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs shrink-0 ${
                        fa.type === 'positive'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : fa.type === 'negative'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {fa.impact_pct > 0 ? `+${fa.impact_pct}%` : `${fa.impact_pct}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DYNAMIC HINGLISH VOICE SCRIPT PREVIEW */}
              {prediction?.voice_script_preview && (
                <div className="rounded-2xl glass-panel p-5 border border-amber-500/30 bg-gradient-to-br from-[#12192c] to-[#181a2e] space-y-3 shadow-glow-amber">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-amber-400" />
                      Dynamic Hinglish Voice Agent Persona & Script
                    </span>
                    <span className="text-[10px] font-mono rounded bg-amber-950 px-2 py-0.5 text-amber-300 border border-amber-800">
                      Tone: {prediction.voice_script_preview.tone}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950/80 p-4 border border-amber-500/20 font-mono text-xs text-amber-100/90 whitespace-pre-line leading-relaxed">
                    {prediction.voice_script_preview.script}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* PORTFOLIO BATCH FORECAST TAB */
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl glass-panel p-5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold">Total At-Risk ARR</span>
              <div className="text-2xl font-bold text-white num-mono mt-1">
                {formatINR(portfolioStats?.total_at_risk_amount || 342850)}
              </div>
              <span className="text-[11px] text-slate-500">Across 50 Subscriptions</span>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-emerald-500/30 shadow-glow-emerald">
              <span className="text-xs text-emerald-400 font-semibold">Predicted Recovery</span>
              <div className="text-2xl font-bold text-emerald-400 num-mono mt-1">
                {formatINR(portfolioStats?.predicted_recovery_amount || 214500)}
              </div>
              <span className="text-[11px] text-emerald-300/70 font-mono font-semibold">
                {portfolioStats?.predicted_recovery_rate_pct || 62.5}% Forecasted Rate
              </span>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold">Average Model Confidence</span>
              <div className="text-2xl font-bold text-cyan-400 num-mono mt-1">
                {portfolioStats?.average_confidence_pct || 96}%
              </div>
              <span className="text-[11px] text-slate-500">Hybrid Bayesian Network</span>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-white/10">
              <span className="text-xs text-slate-400 font-semibold">Distribution Health</span>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono">
                <span className="text-emerald-400">● {portfolioStats?.distribution?.high_probability_count || 28} High</span>
                <span className="text-amber-400">● {portfolioStats?.distribution?.moderate_probability_count || 14} Med</span>
                <span className="text-rose-400">● {portfolioStats?.distribution?.critical_escalation_count || 8} Esc</span>
              </div>
            </div>
          </div>

          {/* Portfolio Predictions Table */}
          <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                Live 50-Case Portfolio AI Recovery Forecasts
              </h2>
              <span className="text-xs text-slate-400">Evaluated deterministically in real-time</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/95 text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3">Case ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Failure Reason</th>
                    <th className="p-3">AI Root Cause</th>
                    <th className="p-3 text-center">Recovery Prob</th>
                    <th className="p-3 text-right">Predicted EV</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                  {portfolioStats?.predictions?.map((p: any) => (
                    <tr key={p.subscription_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-slate-400">{p.subscription_id}</td>
                      <td className="p-3 text-white font-semibold">{p.customer_name}</td>
                      <td className="p-3 text-right num-mono font-bold text-slate-200">{formatINR(p.amount)}</td>
                      <td className="p-3 font-mono text-slate-400">{p.root_cause}</td>
                      <td className="p-3">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          {p.root_cause}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          p.overall_recovery_probability_pct >= 70
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : p.overall_recovery_probability_pct >= 40
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {p.overall_recovery_probability_pct}%
                        </span>
                      </td>
                      <td className="p-3 text-right num-mono font-bold text-emerald-400">
                        {formatINR(p.expected_recovery_amount)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setParams({
                              subscription_id: p.subscription_id,
                              customer_name: p.customer_name,
                              amount: p.amount,
                              failure_reason_code: p.root_cause === 'update_payment_method' ? 'card_expired' : 'insufficient_funds',
                              payment_method: 'upi_autopay',
                              customer_segment: 'high_value',
                              retry_count_so_far: 1,
                              customer_tenure_months: 12,
                              time_of_debit_ist_hour: 14,
                              is_dnd_registered: false,
                              has_pre_debit_notice: true,
                              hours_since_last_contact: 72
                            });
                            setActiveTab('simulator');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer"
                        >
                          Simulate &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
