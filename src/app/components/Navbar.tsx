'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Play, Activity, ListChecks, FileText, Mic, CheckCircle2, RefreshCw } from 'lucide-react';

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
        // Refresh active page data
        router.refresh();
        // Dispatch custom event for client components
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
                Track 03
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Razorpay Autonomous Revenue Recovery</p>
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
            title="Execute detection, diagnosis, safety gates, voice escalation and PTP settlement on 50 synthetic records"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunningBatch ? 'animate-spin' : ''}`} />
            <span>{isRunningBatch ? 'Simulating Batch...' : 'Run Live Batch'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
