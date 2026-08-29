'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function RevenueFlowFallback() {
  return (
    <div className="w-full h-[460px] rounded-2xl bg-[#FFFFFF] border border-[#E5E5DF] p-6 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#C8F000] border border-[#111111] animate-pulse" />
          <span className="text-xs font-mono font-semibold text-[#111111] uppercase tracking-wider">
            3D Revenue Flow Pipeline
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#686862] bg-[#F7F7F3] border border-[#E5E5DF] px-2 py-0.5 rounded">
          WebGL Architecture Primitives
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 my-auto py-8">
        {[
          { label: 'Customer / Mandate', color: '#111111' },
          { label: 'UPI / Card Gateway', color: '#686862' },
          { label: 'At-Risk Deflection', color: '#D94A4A' },
          { label: 'AI Recovery Settled', color: '#111111' },
        ].map((node, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#F7F7F3] border border-[#E5E5DF] text-center space-y-2">
            <div className="text-[10px] font-mono text-[#686862]">NODE 0{i + 1}</div>
            <div className="text-xs font-bold text-[#111111]">{node.label}</div>
            <div className="h-3 w-12 mx-auto rounded-full bg-[#E5E5DF]" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#E5E5DF] text-[11px] text-[#686862] font-mono">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
          <span>Interactive 8-node revenue stream renderer</span>
        </div>
        <span>Illustrative Demo • 60 FPS Target</span>
      </div>
    </div>
  );
}
