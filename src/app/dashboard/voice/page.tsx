'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowUpRight, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function VoiceShowcasePage() {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/voice/samples');
      const data = await res.json();
      setTranscripts(data.transcripts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const handlePlayVoiceTTS = (callId: string, scriptText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Browser speech synthesis is not supported on this platform.');
      return;
    }

    if (playingId === callId) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean up transcript tags
    const cleanSpeech = scriptText
      .replace(/\[Agent\]:\s*"/g, '')
      .replace(/"/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;

    // Pick Indian voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(callId);
    window.speechSynthesis.speak(utterance);
  };

  const getToneStyle = (tone: string) => {
    switch (tone) {
      case 'PREMIUM_DEFERENTIAL':
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          card: 'border-amber-500/30 bg-gradient-to-br from-[#11192e] to-[#1a1730]',
          label: 'VIP Deferential & Courteous'
        };
      case 'FIRM_ACTION_ORIENTED':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          card: 'border-rose-500/30 bg-gradient-to-br from-[#1c1224] to-[#121628]',
          label: 'Firm Resolution & Action-Oriented'
        };
      default:
        return {
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          card: 'border-teal-500/30 bg-gradient-to-br from-[#0f1d2c] to-[#0d1626]',
          label: 'Friendly Direct & Collaborative'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Hinglish Voice Recovery AI Showcase
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic code-switched Hindi-English speech generation with segment-tailored tone and Promise-to-Pay state capture.
          </p>
        </div>

        <button
          onClick={fetchTranscripts}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Calls</span>
        </button>
      </div>

      {/* Showcase Grid of Voice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-80 w-full rounded-2xl" />
          ))
        ) : transcripts.length === 0 ? (
          <div className="col-span-2 rounded-2xl glass-panel p-8 text-center border border-white/10">
            <p className="text-sm text-slate-400">No voice transcripts recorded in current batch. Click "Run Live Batch" to generate fresh calls.</p>
          </div>
        ) : (
          transcripts.map((t) => {
            const toneConfig = getToneStyle(t.tone);
            const isPlaying = playingId === t.call_id;

            return (
              <div 
                key={t.call_id}
                className={`rounded-2xl p-6 border shadow-lg flex flex-col justify-between transition-all ${toneConfig.card}`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{t.customer_name}</span>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${toneConfig.badge}`}>
                          {t.customer_segment?.toUpperCase()}
                        </span>
                      </div>
                      <span className="num-mono text-[11px] text-slate-400">
                        {t.subscription_id} • Amount: <strong className="text-emerald-400 font-mono">{formatINR(t.amount)}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayVoiceTTS(t.call_id, t.script_content)}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="h-4 w-4 text-rose-400 animate-pulse" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 text-emerald-400" />
                          <span>Play Hinglish TTS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tone Label */}
                  <div className="mb-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tone Persona: <strong className="text-slate-200">{toneConfig.label}</strong></span>
                    <span className="font-mono text-slate-400">Call Duration: {t.call_duration_seconds}s</span>
                  </div>

                  {/* Generated Script Content */}
                  <div className="rounded-xl bg-slate-950/80 border border-white/10 p-4 space-y-2.5">
                    {t.script_content.split('\n').map((line: string, idx: number) => (
                      <p key={idx} className="text-xs text-slate-200 leading-relaxed">
                        <span className="font-bold text-amber-400 mr-1.5">[Agent]:</span>
                        {line.replace(/\[Agent\]:\s*"/g, '').replace(/"/g, '')}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Outcome & PTP Footer */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Outcome:</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      t.simulated_outcome === 'AGREED_IMMEDIATE_RETRY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : t.simulated_outcome === 'PROMISE_TO_PAY_COMMITTED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {t.simulated_outcome}
                    </span>
                    {t.promised_date && (
                      <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {t.promised_date}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/cases/${t.subscription_id}`}
                    className="text-xs font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Audit Trail</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
