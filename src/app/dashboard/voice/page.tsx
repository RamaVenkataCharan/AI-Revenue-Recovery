'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, Volume2, VolumeX, ArrowUpRight, Calendar, RefreshCw } from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function VoiceAIPage() {
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/voice/transcripts');
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
      alert('Browser Speech Synthesis is not supported.');
      return;
    }

    if (playingId === callId) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanSpeech = scriptText
      .replace(/\[Agent\]:\s*"/g, '')
      .replace(/"/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hindiOrIndianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India'));
    if (hindiOrIndianVoice) {
      utterance.voice = hindiOrIndianVoice;
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
          badge: 'bg-[#C8F000]/10 text-[#C8F000] border-[#C8F000]/30',
          label: 'VIP Deferential & Courteous'
        };
      case 'FIRM_ACTION_ORIENTED':
        return {
          badge: 'bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/30',
          label: 'Firm Resolution & Action-Oriented'
        };
      default:
        return {
          badge: 'bg-[#1A1A1D] text-white border-[#26262A]',
          label: 'Friendly Direct & Collaborative'
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#26262A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-[#C8F000]" />
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Hinglish Voice Recovery AI Showcase
            </h1>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Dynamic code-switched Hindi-English speech generation with segment-tailored tone and Promise-to-Pay state capture.
          </p>
        </div>

        <button
          onClick={fetchTranscripts}
          className="flex items-center gap-1.5 rounded-lg border border-[#26262A] bg-[#141416] px-3 py-1.5 text-xs text-[#A1A1AA] hover:border-[#C8F000]/40 hover:text-white transition-colors duration-150 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#C8F000]' : ''}`} />
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
          <div className="col-span-2 rounded-2xl bg-[#141416] p-8 text-center border border-[#26262A]">
            <p className="text-sm text-[#A1A1AA]">No voice transcripts recorded in current batch. Click "Run Batch" to generate fresh calls.</p>
          </div>
        ) : (
          transcripts.map((t) => {
            const toneConfig = getToneStyle(t.tone);
            const isPlaying = playingId === t.call_id;

            return (
              <div 
                key={t.call_id}
                className="rounded-2xl p-6 border border-[#26262A] bg-[#141416] flex flex-col justify-between transition-colors duration-150"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#26262A] pb-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{t.customer_name}</span>
                        <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${toneConfig.badge}`}>
                          {t.customer_segment?.toUpperCase()}
                        </span>
                      </div>
                      <span className="num-mono text-[11px] text-[#A1A1AA]">
                        {t.subscription_id} • Amount: <strong className="text-[#C8F000] font-mono">{formatINR(t.amount)}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayVoiceTTS(t.call_id, t.script_content)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#C8F000]/10 hover:bg-[#C8F000]/20 border border-[#C8F000]/30 px-3 py-1.5 text-xs font-semibold text-[#C8F000] transition-colors duration-150 cursor-pointer active:scale-95"
                    >
                      {isPlaying ? (
                        <>
                          <VolumeX className="h-4 w-4 text-[#E5484D] animate-pulse" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4 text-[#C8F000]" />
                          <span>Play Hinglish TTS</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tone Label */}
                  <div className="mb-3 flex items-center justify-between text-[11px]">
                    <span className="text-[#A1A1AA]">Tone Persona: <strong className="text-white">{toneConfig.label}</strong></span>
                    <span className="font-mono text-[#6B6B70]">Duration: {t.call_duration_seconds}s</span>
                  </div>

                  {/* Generated Script Content */}
                  <div className="rounded-xl bg-[#1A1A1D] border border-[#26262A] p-4 space-y-2.5">
                    {t.script_content.split('\n').map((line: string, idx: number) => (
                      <p key={idx} className="text-xs text-white leading-relaxed">
                        <span className="font-bold text-[#C8F000] mr-1.5">[Agent]:</span>
                        {line.replace(/\[Agent\]:\s*"/g, '').replace(/"/g, '')}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Outcome & PTP Footer */}
                <div className="mt-4 pt-3 border-t border-[#26262A] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#A1A1AA]">Outcome:</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      t.simulated_outcome === 'AGREED_IMMEDIATE_RETRY' || t.simulated_outcome === 'PROMISE_TO_PAY_COMMITTED'
                        ? 'bg-[#C8F000]/10 text-[#C8F000] border-[#C8F000]/30'
                        : 'bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/30'
                    }`}>
                      {t.simulated_outcome}
                    </span>
                    {t.promised_date && (
                      <span className="text-[11px] font-mono text-[#C8F000] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {t.promised_date}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/cases/${t.subscription_id}`}
                    className="text-xs font-semibold text-[#C8F000] hover:underline inline-flex items-center gap-1"
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
