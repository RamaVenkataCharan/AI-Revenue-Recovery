'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, Activity, ListChecks, FileText, Mic, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [lastBatchMessage, setLastBatchMessage] = useState<string | null>(null);

  const navLinks = [
    { href: '/dashboard', label: 'Console', icon: Activity },
    { href: '/dashboard/cases', label: 'Cases', icon: ListChecks },
    { href: '/dashboard/prediction', label: 'Decision Engine', icon: Sparkles },
    { href: '/dashboard/audit', label: 'Audit', icon: FileText },
    { href: '/dashboard/voice', label: 'Voice', icon: Mic },
  ];

  const handleRunBatch = async () => {
    try {
      setIsRunningBatch(true);
      setLastBatchMessage(null);
      
      const res = await fetch('/api/batch/run', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setLastBatchMessage(`Batch ${data.report?.batch_id?.substring(0, 10)} processed`);
        router.refresh();
        window.dispatchEvent(new CustomEvent('batch-run-completed', { detail: data.report }));
      } else {
        setLastBatchMessage('Batch issue');
      }
    } catch (err) {
      console.error(err);
      setLastBatchMessage('Trigger failed');
    } finally {
      setIsRunningBatch(false);
      setTimeout(() => setLastBatchMessage(null), 4000);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#26262A] bg-[#0A0A0B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141416] border border-[#26262A] text-[#C8F000]">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white">RECLAIM<span className="text-[#C8F000]">AI</span></span>
              <span className="rounded bg-[#1A1A1D] px-1.5 py-0.2 text-[9px] font-mono text-[#A1A1AA] border border-[#26262A]">
                v1.0
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs — Tightened, Essential Only */}
        <nav className="flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#C8F000]/10 text-[#C8F000] border border-[#C8F000]/30 font-semibold'
                    : 'text-[#A1A1AA] hover:bg-[#141416] hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-3 w-3 ${isActive ? 'text-[#C8F000]' : 'text-[#6B6B70]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live Batch Action */}
        <div className="flex items-center gap-2">
          {lastBatchMessage && (
            <div className="hidden lg:flex items-center gap-1 rounded bg-[#141416] border border-[#26262A] px-2 py-0.5 text-[10px] text-[#C8F000]">
              <CheckCircle2 className="h-3 w-3 text-[#C8F000]" />
              <span>{lastBatchMessage}</span>
            </div>
          )}
          <button
            onClick={handleRunBatch}
            disabled={isRunningBatch}
            className="flex items-center gap-1.5 rounded-lg bg-[#C8F000] px-3 py-1.5 text-xs font-bold text-[#0A0A0B] hover:bg-[#b8dd00] active:scale-95 disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-glow-accent"
          >
            <RefreshCw className={`h-3 w-3 ${isRunningBatch ? 'animate-spin' : ''}`} />
            <span>{isRunningBatch ? 'Running...' : 'Run Batch'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
