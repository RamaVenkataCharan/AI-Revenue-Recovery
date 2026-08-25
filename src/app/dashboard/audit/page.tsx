'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Shield, FileText, ArrowUpRight, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');
  const [selectedMeta, setSelectedMeta] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = `/api/audit/search?q=${encodeURIComponent(search)}&event_type=${encodeURIComponent(eventType)}&limit=150`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [eventType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getEventBadge = (type: string, decision: string) => {
    if (decision?.includes('BLOCKED')) {
      return <span className="rounded bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-amber-400">STOPPED / BLOCKED</span>;
    }
    if (decision?.includes('SUCCESS') || decision?.includes('KEPT')) {
      return <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-400">SUCCESS</span>;
    }
    switch (type) {
      case 'DETECTION':
        return <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-cyan-400">DETECTION</span>;
      case 'DIAGNOSIS':
        return <span className="rounded bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-purple-300">DIAGNOSIS</span>;
      case 'DECISION':
        return <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-400">POLICY</span>;
      case 'STOPPING_RULE_CHECK':
        return <span className="rounded bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-teal-300">SAFETY CAP</span>;
      case 'COMPLIANCE_GATE_CHECK':
        return <span className="rounded bg-blue-950/80 border border-blue-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-blue-300">COMPLIANCE</span>;
      case 'EXECUTION':
        return <span className="rounded bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold font-mono text-amber-300">EXECUTION</span>;
      case 'OUTCOME':
        return <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold font-mono text-slate-300">OUTCOME</span>;
      default:
        return <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">{type}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            Immutable Audit Trail & Governance Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident, append-only SQLite log recording every detection, diagnosis, safety rule evaluation, and recovery action.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter & Live Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/10">
          {[
            { id: '', label: 'All Events' },
            { id: 'STOPPING_RULE_CHECK', label: 'Stopping Rules' },
            { id: 'COMPLIANCE_GATE_CHECK', label: 'Compliance Gates' },
            { id: 'EXECUTION', label: 'Executions' },
            { id: 'OUTCOME', label: 'Outcomes' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setEventType(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                eventType === f.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-inner-card'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Live search by sub ID, reasoning, or decision..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl glass-panel border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Time & ID</th>
                <th className="px-4 py-3.5">Subscription</th>
                <th className="px-4 py-3.5">Event Type</th>
                <th className="px-4 py-3.5">Decision / Result</th>
                <th className="px-5 py-3.5">Explainability Rationale</th>
                <th className="px-4 py-3.5">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="skeleton h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No audit log records match the search filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-300 font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">#{log.id}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/dashboard/cases/${log.subscription_id}`}
                        className="font-mono font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{log.subscription_id}</span>
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getEventBadge(log.event_type, log.decision)}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-200 font-semibold whitespace-nowrap">
                      {log.decision || log.result || '-'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-slate-300 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">
                        {log.reasoning}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.action_taken ? (
                        <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-slate-300">
                          {log.action_taken}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
