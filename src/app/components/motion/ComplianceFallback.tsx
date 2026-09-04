'use client';

import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export function ComplianceFallback() {
  return (
    <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] min-h-[360px] flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#26262A] pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#C8F000] animate-pulse" />
          <span className="text-sm font-bold text-white">Initializing 3D Compliance Gate Checkpoint...</span>
        </div>
        <span className="text-xs font-mono text-[#A1A1AA]">WebGL Hardware Renderer</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-auto py-6">
        {['RBI Max Retries', 'TRAI Quiet Hours', 'RBI 24h Notice', 'Anti-Harassment 48h'].map((rule, idx) => (
          <div key={idx} className="rounded-xl border border-[#26262A] bg-[#1A1A1D] p-4 text-center space-y-2 animate-pulse">
            <div className="text-[10px] font-mono text-[#6B6B70]">CHECKPOINT 0{idx + 1}</div>
            <div className="text-xs font-semibold text-white">{rule}</div>
            <div className="h-3 w-16 mx-auto rounded bg-[#C8F000]/20" />
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-[#A1A1AA] flex items-center justify-center gap-1.5 pt-4 border-t border-[#26262A]">
        <Sparkles className="h-3.5 w-3.5 text-[#C8F000]" />
        <span>Loading 3D regulatory inspection tunnel...</span>
      </div>
    </div>
  );
}
