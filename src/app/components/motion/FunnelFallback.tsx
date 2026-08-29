'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export function FunnelFallback() {
  return (
    <div className="rounded-2xl glass-panel p-6 border border-white/10 bg-[#070b14]/90 min-h-[380px] flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-emerald-400/30 animate-pulse" />
          <span className="text-sm font-bold text-white">Initializing 3D Perspective Funnel Engine...</span>
        </div>
        <span className="text-xs font-mono text-slate-500">WebGL Canvas</span>
      </div>

      <div className="grid grid-cols-5 gap-3 my-auto py-8">
        {[
          { label: 'Detected', color: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' },
          { label: 'Diagnosed', color: 'bg-purple-500/20 border-purple-500/30 text-purple-400' },
          { label: 'Gated', color: 'bg-amber-500/20 border-amber-500/30 text-amber-400' },
          { label: 'Executed', color: 'bg-teal-500/20 border-teal-500/30 text-teal-400' },
          { label: 'Recovered', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.color} p-4 text-center space-y-2 animate-pulse`}>
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Stage 0{i + 1}</div>
            <div className="text-xs font-bold">{s.label}</div>
            <div className="h-6 w-12 mx-auto rounded bg-white/10" />
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-4 border-t border-white/5">
        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
        <span>Loading React Three Fiber hardware-accelerated scene...</span>
      </div>
    </div>
  );
}
