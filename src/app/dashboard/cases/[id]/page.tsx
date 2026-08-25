'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  XCircle, 
  PhoneCall, 
  CreditCard, 
  Clock, 
  User, 
  Calendar,
  Volume2
} from 'lucide-react';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function CaseDeepDivePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const subscriptionId = resolvedParams.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    async function loadCase() {
      try {
        setLoading(true);
        const res = await fetch(`/api/cases/${subscriptionId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [subscriptionId]);

  const handleSpeakTranscript = (scriptText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    // Clean transcript dialogue prefixes for natural speech
    const cleanSpeech = scriptText
      .replace(/\[Agent\]:\s*"/g, '')
      .replace(/"/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    // Try to find an Indian English or Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hindiOrIndianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India'));
    if (hindiOrIndianVoice) {
      utterance.voice = hindiOrIndianVoice;
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const getStepIcon = (eventType: string, decision: string) => {
    switch (eventType) {
      case 'DETECTION':
        return <Search className="h-4 w-4 text-cyan-400" />;
      case 'DIAGNOSIS':
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case 'DECISION':
        return <Send className="h-4 w-4 text-emerald-400" />;
      case 'STOPPING_RULE_CHECK':
        return decision?.includes('BLOCKED') 
          ? <ShieldAlert className="h-4 w-4 text-amber-400" /> 
          : <ShieldCheck className="h-4 w-4 text-teal-400" />;
      case 'COMPLIANCE_GATE_CHECK':
        return decision?.includes('BLOCKED') 
          ? <ShieldAlert className="h-4 w-4 text-rose-400" /> 
          : <ShieldCheck className="h-4 w-4 text-cyan-400" />;
      case 'EXECUTION':
        return <PhoneCall className="h-4 w-4 text-amber-400" />;
      case 'OUTCOME':
        return decision?.includes('SUCCESS') || decision?.includes('KEPT')
          ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          : <XCircle className="h-4 w-4 text-rose-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStepBadgeColor = (eventType: string, decision: string) => {
    if (decision?.includes('BLOCKED')) {
      return 'bg-amber-950/80 border-amber-500/40 text-amber-400';
    }
    if (decision?.includes('SUCCESS') || decision?.includes('KEPT')) {
      return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400';
    }
    switch (eventType) {
      case 'DETECTION':
        return 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400';
      case 'DIAGNOSIS':
        return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
      case 'DECISION':
        return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400';
      default:
        return 'bg-slate-900 border-white/10 text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  if (!data?.subscription) {
    return (
      <div className="rounded-2xl glass-panel p-8 text-center border border-white/10">
        <h2 className="text-lg font-bold text-white">Case Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">Subscription ID {subscriptionId} does not exist in SQLite.</p>
        <Link href="/dashboard/cases" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Cases</span>
        </Link>
      </div>
    );
  }

  const sub = data.subscription;
  const logs = data.audit_logs || [];
  const voice = data.voice_transcript;
  const ptp = data.ptp;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <Link
          href="/dashboard/cases"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Case Portfolio</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Subscription ID:</span>
          <span className="num-mono text-xs font-bold text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
            {sub.subscription_id}
          </span>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-2xl glass-panel p-6 border border-white/10 shadow-glow-emerald relative overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Customer & Segment */}
          <div>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              Customer Profile
            </span>
            <div className="mt-1 text-lg font-bold text-white">{sub.customer_name}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                sub.customer_segment === 'high_value' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : sub.customer_segment === 'at_risk'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {sub.customer_segment?.toUpperCase()} SEGMENT
              </span>
              <span className="text-[11px] text-slate-400">
                History: {sub.previous_payment_history}
              </span>
            </div>
          </div>

          {/* Amount Due & Currency */}
          <div>
            <span className="text-xs font-semibold text-slate-400">Total Amount At Risk</span>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-emerald-400 num-mono">
              {formatINR(sub.amount)}
            </div>
            <span className="text-[11px] text-slate-400">
              Currency: {sub.currency} • Recurring Mandate
            </span>
          </div>

          {/* Decline Reason & Retry Counter */}
          <div>
            <span className="text-xs font-semibold text-slate-400">Decline Code & History</span>
            <div className="mt-1">
              <span className="font-mono text-xs bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-slate-200 font-semibold">
                {sub.failure_reason_code}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300">
              Retries so far: <span className="font-bold text-white num-mono">{sub.retry_count_so_far} / 3</span> (Cap)
            </div>
          </div>

          {/* Final Settlement Status */}
          <div>
            <span className="text-xs font-semibold text-slate-400">Current Recovery Status</span>
            <div className="mt-1">
              {sub.mandate_status === 'recovered' ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 shadow-glow-emerald">
                  <CheckCircle2 className="h-4 w-4" />
                  RECOVERED & SETTLED
                </span>
              ) : sub.retry_count_so_far >= 3 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-950/90 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300">
                  <ShieldAlert className="h-4 w-4" />
                  ESCALATED TO MANUAL OPS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-950/90 border border-cyan-500/40 px-3 py-1.5 text-xs font-bold text-cyan-300">
                  <Clock className="h-4 w-4" />
                  ACTIVE IN RECOVERY QUEUE
                </span>
              )}
            </div>
            {ptp && (
              <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>PTP State: <strong className="font-mono">{ptp.state}</strong> ({ptp.promised_date})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VERTICAL EXPLAINABILITY TIMELINE */}
      <div className="rounded-2xl glass-panel p-6 border border-white/10">
        <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Full Explainability Audit Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological immutable trace explaining every decision, safety check, and outcome.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {logs.length} Immutable Nodes Logged
          </span>
        </div>

        {/* Timeline Node Chain */}
        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-teal-500 before:to-slate-700">
          {logs.map((log: any, idx: number) => {
            const isVoiceStep = log.event_type === 'EXECUTION' && voice && log.action_taken?.includes('VOICE');

            return (
              <div key={log.id || idx} className="relative group">
                {/* Node Dot Icon */}
                <div className="absolute -left-[31px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-white/20 shadow-inner-card group-hover:scale-110 transition-transform">
                  {getStepIcon(log.event_type, log.decision)}
                </div>

                {/* Node Content Box */}
                <div className="rounded-xl border border-white/10 bg-slate-900/90 p-4 shadow-sm hover:border-white/20 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono text-slate-400">
                        STEP 0{idx + 1} • {log.event_type}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${getStepBadgeColor(log.event_type, log.decision)}`}>
                        {log.decision || log.result || 'INFO'}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Plain Language Explainability Reasoning */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-200 leading-relaxed">
                      <span className="text-emerald-400 font-semibold">AI Rationale: </span>
                      {log.reasoning}
                    </div>

                    {log.action_taken && (
                      <div className="text-[11px] font-mono text-slate-400 bg-slate-950/70 border border-white/5 px-2.5 py-1 rounded inline-block">
                        Action: <span className="text-slate-200">{log.action_taken}</span>
                      </div>
                    )}
                  </div>

                  {/* EMBEDDED HINGLISH VOICE TRANSCRIPT CHAT BUBBLE (If applicable) */}
                  {isVoiceStep && voice && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-[#12192e] to-[#1c1830] p-4 shadow-glow-amber">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-amber-400 animate-pulse" />
                          <span className="text-xs font-bold text-amber-300">
                            Hinglish Recovery Voice Call Transcript
                          </span>
                          <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            {voice.tone}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSpeakTranscript(voice.script_content)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer"
                          title="Listen to browser TTS Hinglish voice synthesis"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio ? 'animate-bounce text-amber-400' : ''}`} />
                          <span>{isPlayingAudio ? 'Stop Audio' : 'Play Voice TTS'}</span>
                        </button>
                      </div>

                      {/* Code-switched Dialogue Bubbles */}
                      <div className="space-y-2 text-xs">
                        {voice.script_content.split('\n').map((dialogue: string, dIdx: number) => (
                          <div 
                            key={dIdx} 
                            className="rounded-lg bg-slate-900/90 border border-amber-500/20 p-2.5 text-amber-100 font-sans leading-relaxed"
                          >
                            <span className="font-bold text-amber-400 mr-1.5">[AI Agent]:</span>
                            {dialogue.replace(/\[Agent\]:\s*"/g, '').replace(/"/g, '')}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-amber-200/80 pt-2 border-t border-amber-500/10">
                        <span>Duration: <strong>{voice.call_duration_seconds}s</strong></span>
                        <span>Outcome: <strong className="font-mono text-amber-300">{voice.simulated_outcome}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
