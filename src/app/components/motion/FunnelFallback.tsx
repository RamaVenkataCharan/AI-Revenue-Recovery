'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function FunnelFallback() {
  return (
    <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] min-h-[380px] flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#26262A] pb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#C8F000] animate-pulse" />
          <span className="text-sm font-bold text-white">Initializing 3D Perspective Funnel Engine...</span>
        </div>
        <span className="text-xs font-mono text-[#A1A1AA]">WebGL Canvas</span>
      </div>

      <div className="grid grid-cols-5 gap-3 my-auto py-8">
        {[
          { label: 'Detected' },
          { label: 'Diagnosed' },
          { label: 'Gated' },
          { label: 'Executed' },
          { label: 'Recovered' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-[#26262A] bg-[#1A1A1D] p-3 text-center space-y-2 animate-pulse">
            <div className="text-[10px] font-mono font-bold text-[#6B6B70] uppercase">Stage 0{i + 1}</div>
            <div className={`text-xs font-bold ${i === 4 ? 'text-[#C8F000]' : 'text-white'}`}>{s.label}</div>
            <div className={`h-4 w-12 mx-auto rounded ${i === 4 ? 'bg-[#C8F000]/20' : 'bg-white/10'}`} />
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-[#A1A1AA] flex items-center justify-center gap-1.5 pt-4 border-t border-[#26262A]">
        <Sparkles className="h-3.5 w-3.5 text-[#C8F000]" />
        <span>Loading React Three Fiber hardware-accelerated scene...</span>
      </div>
    </div>
  );
}
