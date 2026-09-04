'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function RevenueFlowFallback() {
  return (
    <div className="w-full h-[460px] rounded-2xl bg-[#141416] border border-[#26262A] p-6 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between border-b border-[#26262A] pb-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#C8F000] animate-pulse" />
          <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
            3D Revenue Flow Pipeline
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#A1A1AA] bg-[#1A1A1D] border border-[#26262A] px-2 py-0.5 rounded">
          WebGL Architecture
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 my-auto py-8">
        {[
          { label: 'Customer / Mandate', color: '#FFFFFF' },
          { label: 'UPI / Card Gateway', color: '#A1A1AA' },
          { label: 'At-Risk Deflection', color: '#E5484D' },
          { label: 'AI Recovery Settled', color: '#C8F000' },
        ].map((node, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#1A1A1D] border border-[#26262A] text-center space-y-2">
            <div className="text-[10px] font-mono text-[#6B6B70]">NODE 0{i + 1}</div>
            <div className="text-xs font-bold text-white">{node.label}</div>
            <div className="h-2 w-12 mx-auto rounded-full bg-[#26262A]" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#26262A] text-[11px] text-[#A1A1AA] font-mono">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#C8F000]" />
          <span>Interactive 8-node revenue stream renderer</span>
        </div>
        <span>Native Three.js</span>
      </div>
    </div>
  );
}
