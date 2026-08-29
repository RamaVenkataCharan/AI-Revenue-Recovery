'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  Phone, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle, 
  MessageSquare, 
  AlertCircle, 
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';
import { CaseTiltCard } from '@/app/components/motion/CaseTiltCard';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const url = `/api/cases?filter=${activeFilter}&q=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [activeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  const getStatusBadge = (item: any) => {
    if (item.status_category === 'RECOVERED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          {item.status_badge}
        </span>
      );
    } else if (item.status_category === 'BLOCKED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-400">
          <ShieldAlert className="h-3 w-3" />
          {item.status_badge}
        </span>
      );
    } else if (item.status_category === 'VOICE_ACTION') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-950/80 border border-purple-500/40 px-2.5 py-1 text-xs font-semibold text-purple-300">
          <Phone className="h-3 w-3" />
          {item.status_badge}
        </span>
      );
    } else if (item.status_category === 'DISPATCHED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 text-xs font-semibold text-cyan-300">
          <MessageSquare className="h-3 w-3" />
          {item.status_badge}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-3 w-3" />
          {item.status_badge}
        </span>
      );
    }
  };

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'high_value':
        return <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">HIGH VALUE</span>;
      case 'at_risk':
        return <span className="rounded bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">AT RISK</span>;
      default:
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">STANDARD</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Subscription Leak Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete registry of 50 failed subscriptions with active root causes, intervention actions, and explainability links.
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10">
          {[
            { id: 'all', label: 'All Cases (50)' },
            { id: 'recovered', label: 'Recovered' },
            { id: 'voice', label: 'Voice Outreach' },
            { id: 'blocked', label: 'Safety Blocked' },
            { id: 'exception', label: 'Exceptions' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner-card'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Box & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer or sub ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </form>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 border border-white/10 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner-card'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Interactive 3D Spring Tilt Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner-card'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dense Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cases View (Grid with 3D Spring Tilt or Dense Table) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl glass-panel border border-white/10 p-5 space-y-4">
              <div className="skeleton h-6 w-1/2" />
              <div className="skeleton h-10 w-3/4" />
              <div className="skeleton h-16 w-full" />
            </div>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl glass-panel border border-white/10 p-12 text-center text-slate-400">
          No cases match the selected filter or query.
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((item) => (
            <CaseTiltCard
              key={item.subscription_id}
              className="group rounded-2xl glass-panel border border-white/10 p-5 flex flex-col justify-between hover:border-emerald-500/40 bg-[#0d1322]/80"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-bold text-white text-sm group-hover:text-emerald-300 transition-colors">
                      {item.customer_name}
                    </div>
                    <div className="num-mono text-[11px] text-slate-400">
                      {item.subscription_id}
                    </div>
                  </div>
                  {getSegmentBadge(item.customer_segment)}
                </div>

                <div className="my-4 py-3 border-y border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Amount At Risk</span>
                    <div className="text-xl font-black text-emerald-400 num-mono">
                      {formatINR(item.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Attempt Count</span>
                    <div className="text-sm font-bold text-slate-200 num-mono">
                      {item.retry_count_so_far} <span className="text-xs text-slate-500">/ 3</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Decline Code:</span>
                    <span className="font-mono text-[11px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {item.failure_reason_code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Status:</span>
                    <div>{getStatusBadge(item)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <span>3D Cursor Tilt</span>
                </span>
                <Link
                  href={`/dashboard/cases/${item.subscription_id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-all"
                >
                  <span>Deep Dive</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </CaseTiltCard>
          ))}
        </div>
      ) : (
        /* Dense Table View */
        <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Subscription & Customer</th>
                  <th className="px-4 py-3.5">Segment</th>
                  <th className="px-4 py-3.5 text-right">Amount At Risk</th>
                  <th className="px-4 py-3.5">Decline Reason</th>
                  <th className="px-4 py-3.5">Retry Count</th>
                  <th className="px-4 py-3.5">Recovery Status</th>
                  <th className="px-5 py-3.5 text-right">Audit Trail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((item) => (
                  <tr key={item.subscription_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{item.customer_name}</div>
                      <div className="num-mono text-[11px] text-slate-400">{item.subscription_id}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {getSegmentBadge(item.customer_segment)}
                    </td>

                    <td className="px-4 py-3.5 text-right num-mono font-bold text-white text-sm">
                      {formatINR(item.amount)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {item.failure_reason_code}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 num-mono font-semibold text-slate-300">
                      {item.retry_count_so_far} / 3
                    </td>

                    <td className="px-4 py-3.5">
                      {getStatusBadge(item)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/cases/${item.subscription_id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        <span>Deep Dive</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
