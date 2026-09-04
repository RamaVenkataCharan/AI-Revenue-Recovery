'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, FileText, ArrowUpRight, RefreshCw } from 'lucide-react';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('');

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
      return <span className="rounded bg-[#E5484D]/10 border border-[#E5484D]/30 px-2 py-0.5 text-[10px] font-bold font-mono text-[#E5484D]">STOPPED / BLOCKED</span>;
    }
    if (decision?.includes('SUCCESS') || decision?.includes('KEPT')) {
      return <span className="rounded bg-[#C8F000]/10 border border-[#C8F000]/30 px-2 py-0.5 text-[10px] font-bold font-mono text-[#C8F000]">SUCCESS</span>;
    }
    return <span className="rounded bg-[#1A1A1D] border border-[#26262A] px-2 py-0.5 text-[10px] font-mono text-white">{type}</span>;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#26262A] pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#C8F000]" />
            Immutable Audit Trail & Governance Log
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Tamper-evident, append-only SQLite log recording every detection, diagnosis, safety rule evaluation, and recovery action.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 rounded-lg border border-[#26262A] bg-[#141416] px-3 py-1.5 text-xs text-[#A1A1AA] hover:border-[#C8F000]/40 hover:text-white transition-colors duration-150 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#C8F000]' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Filter & Live Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#141416] border border-[#26262A]">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                eventType === f.id
                  ? 'bg-[#C8F000]/10 text-[#C8F000] border border-[#C8F000]/30 shadow-inner-card'
                  : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1D]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B70]" />
          <input
            type="text"
            placeholder="Live search by sub ID, reasoning, or decision..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#26262A] bg-[#141416] pl-9 pr-4 py-2 text-xs text-white placeholder-[#6B6B70] focus:border-[#C8F000] focus:outline-none"
          />
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#141416] border border-[#26262A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#26262A] bg-[#0A0A0B] text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Time & ID</th>
                <th className="px-4 py-3.5">Subscription</th>
                <th className="px-4 py-3.5">Event Type</th>
                <th className="px-4 py-3.5">Decision / Result</th>
                <th className="px-5 py-3.5">Explainability Rationale</th>
                <th className="px-4 py-3.5">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26262A]">
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
                  <td colSpan={6} className="px-5 py-8 text-center text-[#A1A1AA]">
                    No audit log records match the search filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A1A1D] transition-colors duration-150">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-white font-medium">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-[10px] text-[#6B6B70] font-mono">#{log.id}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Link
                        href={`/dashboard/cases/${log.subscription_id}`}
                        className="font-mono font-bold text-[#C8F000] hover:underline inline-flex items-center gap-1"
                      >
                        <span>{log.subscription_id}</span>
                        <ArrowUpRight className="h-2.5 w-2.5" />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getEventBadge(log.event_type, log.decision)}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-white font-semibold whitespace-nowrap">
                      {log.decision || log.result || '-'}
                    </td>

                    <td className="px-5 py-3.5 text-xs text-[#A1A1AA] max-w-md">
                      <p className="line-clamp-2 leading-relaxed">
                        {log.reasoning}
                      </p>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-[#A1A1AA] whitespace-nowrap">
                      {log.action_taken ? (
                        <span className="bg-[#1A1A1D] border border-[#26262A] px-2 py-0.5 rounded text-white">
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
