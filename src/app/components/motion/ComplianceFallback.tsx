'use client';

import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export function ComplianceFallback() {
  return (
    <div className="rounded-2xl glass-panel p-6 border border-white/10 bg-[#070b14]/90 min-h-[360px] flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-sm font-bold text-white">Initializing 3D Compliance Gate Checkpoint...</span>
        </div>
        <span className="text-xs font-mono text-slate-500">WebGL Hardware Renderer</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto py-6">
        {['RBI Max Retries', 'TRAI Quiet Hours', 'RBI 24h Notice', 'Anti-Harassment 48h'].map((rule, idx) => (
          <div key={idx} className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center space-y-2 animate-pulse">
            <div className="text-[10px] font-mono text-slate-400">CHECKPOINT 0{idx + 1}</div>
            <div className="text-xs font-semibold text-white">{rule}</div>
            <div className="h-4 w-16 mx-auto rounded bg-emerald-500/20" />
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-4 border-t border-white/5">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        <span>Loading 3D regulatory inspection tunnel...</span>
      </div>
    </div>
  );
}
