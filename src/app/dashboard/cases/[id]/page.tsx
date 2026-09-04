'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  ArrowLeft, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  PhoneCall, 
  Send, 
  User, 
  Calendar,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ComplianceFallback } from '@/app/components/motion/ComplianceFallback';

const ComplianceGateCheckpoint3D = dynamic(
  () => import('@/app/components/motion/ComplianceGateCheckpoint3D'),
  {
    ssr: false,
    loading: () => <ComplianceFallback />
  }
);

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

  // Memoize compliance_results BEFORE any early returns to satisfy React rules of hooks.
  const complianceResults = useMemo(
    () => data?.compliance_results ?? [],
    [data]
  );

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

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const getStepIcon = (eventType: string, decision: string) => {
    if (decision?.includes('BLOCKED')) {
      return <ShieldAlert className="h-4 w-4 text-[#E5484D]" />;
    }
    if (decision?.includes('SUCCESS') || decision?.includes('KEPT')) {
      return <CheckCircle2 className="h-4 w-4 text-[#C8F000]" />;
    }
    switch (eventType) {
      case 'DETECTION':
        return <Search className="h-4 w-4 text-[#A1A1AA]" />;
      case 'DIAGNOSIS':
        return <Sparkles className="h-4 w-4 text-[#C8F000]" />;
      case 'DECISION':
        return <Send className="h-4 w-4 text-white" />;
      case 'STOPPING_RULE_CHECK':
      case 'COMPLIANCE_GATE_CHECK':
        return <ShieldCheck className="h-4 w-4 text-[#C8F000]" />;
      case 'EXECUTION':
        return <PhoneCall className="h-4 w-4 text-white" />;
      default:
        return <Clock className="h-4 w-4 text-[#6B6B70]" />;
    }
  };

  const getStepBadgeColor = (eventType: string, decision: string) => {
    if (decision?.includes('BLOCKED')) {
      return 'bg-[#E5484D]/10 border-[#E5484D]/30 text-[#E5484D]';
    }
    if (decision?.includes('SUCCESS') || decision?.includes('KEPT')) {
      return 'bg-[#C8F000]/10 border-[#C8F000]/30 text-[#C8F000]';
    }
    return 'bg-[#1A1A1D] border-[#26262A] text-white';
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
      <div className="rounded-2xl bg-[#141416] p-8 text-center border border-[#26262A]">
        <h2 className="text-lg font-bold text-white">Case Not Found</h2>
        <p className="text-xs text-[#A1A1AA] mt-2">Subscription ID {subscriptionId} does not exist in SQLite.</p>
        <Link href="/dashboard/cases" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#C8F000] px-4 py-2 text-xs font-bold text-[#0A0A0B]">
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
      <div className="flex items-center justify-between border-b border-[#26262A] pb-4">
        <Link
          href="/dashboard/cases"
          className="inline-flex items-center gap-2 rounded-lg border border-[#26262A] bg-[#141416] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors duration-150"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Case Portfolio</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#A1A1AA]">Subscription ID:</span>
          <span className="num-mono text-xs font-bold text-white bg-[#1A1A1D] border border-[#26262A] px-2 py-0.5 rounded">
            {sub.subscription_id}
          </span>
        </div>
      </div>

      {/* Case Header Card */}
      <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] relative overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Customer & Segment */}
          <div>
            <span className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#6B6B70]" />
              Customer Profile
            </span>
            <div className="mt-1 text-lg font-bold text-white">{sub.customer_name}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                sub.customer_segment === 'high_value' 
                  ? 'bg-[#C8F000]/10 text-[#C8F000] border-[#C8F000]/30' 
                  : sub.customer_segment === 'at_risk'
                  ? 'bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/30'
                  : 'bg-[#1A1A1D] text-[#A1A1AA] border-[#26262A]'
              }`}>
                {sub.customer_segment?.toUpperCase()} SEGMENT
              </span>
              <span className="text-[11px] text-[#A1A1AA]">
                History: {sub.previous_payment_history}
              </span>
            </div>
          </div>

          {/* Amount Due */}
          <div>
            <span className="text-xs font-semibold text-[#A1A1AA]">Total Amount At Risk</span>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-[#C8F000] num-mono">
              {formatINR(sub.amount)}
            </div>
            <span className="text-[11px] text-[#A1A1AA]">
              Currency: {sub.currency} • Recurring Mandate
            </span>
          </div>

          {/* Decline Reason */}
          <div>
            <span className="text-xs font-semibold text-[#A1A1AA]">Decline Code & History</span>
            <div className="mt-1">
              <span className="font-mono text-xs bg-[#1A1A1D] border border-[#26262A] px-2.5 py-1 rounded text-white font-semibold">
                {sub.failure_reason_code}
              </span>
            </div>
            <div className="mt-2 text-xs text-[#A1A1AA]">
              Retries so far: <span className="font-bold text-white num-mono">{sub.retry_count_so_far} / 3</span> (Cap)
            </div>
          </div>

          {/* Current Recovery Status */}
          <div>
            <span className="text-xs font-semibold text-[#A1A1AA]">Current Recovery Status</span>
            <div className="mt-1">
              {sub.mandate_status === 'recovered' ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#C8F000]/10 border border-[#C8F000]/30 px-3 py-1.5 text-xs font-bold text-[#C8F000]">
                  <CheckCircle2 className="h-4 w-4" />
                  RECOVERED & SETTLED
                </span>
              ) : sub.retry_count_so_far >= 3 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#E5484D]/10 border border-[#E5484D]/30 px-3 py-1.5 text-xs font-bold text-[#E5484D]">
                  <ShieldAlert className="h-4 w-4" />
                  ESCALATED TO MANUAL OPS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1D] border border-[#26262A] px-3 py-1.5 text-xs font-bold text-white">
                  <Clock className="h-4 w-4 text-[#C8F000]" />
                  ACTIVE IN RECOVERY QUEUE
                </span>
              )}
            </div>
            {ptp && (
              <div className="mt-2 text-[11px] text-[#C8F000] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>PTP State: <strong className="font-mono">{ptp.state}</strong> ({ptp.promised_date})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOMENT 1: 3D LITERAL COMPLIANCE GATE CHECKPOINT */}
      {complianceResults.length > 0 && (
        <ComplianceGateCheckpoint3D 
          results={complianceResults}
          proposedActionName={data?.policy_decision?.action || 'PROPOSED_RECOVERY_ACTION'}
          proposedChannelName={data?.policy_decision?.channel || 'OUTREACH_CHANNEL'}
        />
      )}

      {/* VERTICAL EXPLAINABILITY TIMELINE */}
      <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A]">
        <div className="border-b border-[#26262A] pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C8F000]" />
              Full Explainability Audit Timeline
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Chronological immutable trace explaining every decision, safety check, and outcome.
            </p>
          </div>
          <span className="text-xs font-mono text-[#A1A1AA]">
            {logs.length} Immutable Nodes Logged
          </span>
        </div>

        {/* Timeline Node Chain */}
        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#26262A]">
          {logs.map((log: any, idx: number) => {
            const isVoiceStep = log.event_type === 'EXECUTION' && voice && log.action_taken?.includes('VOICE');

            return (
              <div key={log.id || idx} className="relative group">
                {/* Node Dot Icon */}
                <div className="absolute -left-[31px] top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#141416] border border-[#26262A] shadow-inner-card group-hover:scale-110 transition-transform duration-150">
                  {getStepIcon(log.event_type, log.decision)}
                </div>

                {/* Node Content Box */}
                <div className="rounded-xl border border-[#26262A] bg-[#1A1A1D] p-4 shadow-sm hover:border-[#C8F000]/30 transition-colors duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#26262A] pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold font-mono text-[#A1A1AA]">
                        STEP 0{idx + 1} • {log.event_type}
                      </span>
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono ${getStepBadgeColor(log.event_type, log.decision)}`}>
                        {log.decision || log.result || 'INFO'}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-[#6B6B70]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Explainability Reasoning */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-200 leading-relaxed">
                      <span className="text-[#C8F000] font-semibold">AI Rationale: </span>
                      {log.reasoning}
                    </div>

                    {log.action_taken && (
                      <div className="text-[11px] font-mono text-[#A1A1AA] bg-[#141416] border border-[#26262A] px-2.5 py-1 rounded inline-block">
                        Action: <span className="text-white">{log.action_taken}</span>
                      </div>
                    )}
                  </div>

                  {/* EMBEDDED HINGLISH VOICE TRANSCRIPT */}
                  {isVoiceStep && voice && (
                    <div className="mt-4 rounded-xl border border-[#26262A] bg-[#141416] p-4">
                      <div className="flex items-center justify-between border-b border-[#26262A] pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-[#C8F000] animate-pulse" />
                          <span className="text-xs font-bold text-white">
                            Hinglish Recovery Voice Call Transcript
                          </span>
                          <span className="rounded bg-[#1A1A1D] border border-[#26262A] px-2 py-0.5 text-[10px] font-bold text-[#A1A1AA]">
                            {voice.tone}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSpeakTranscript(voice.script_content)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#C8F000]/10 border border-[#C8F000]/30 px-2.5 py-1 text-xs font-semibold text-[#C8F000] hover:bg-[#C8F000]/20 transition-colors duration-150 cursor-pointer"
                          title="Listen to browser TTS Hinglish voice synthesis"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${isPlayingAudio ? 'animate-bounce text-[#C8F000]' : ''}`} />
                          <span>{isPlayingAudio ? 'Stop Audio' : 'Play Voice TTS'}</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        {voice.script_content.split('\n').map((dialogue: string, dIdx: number) => (
                          <div 
                            key={dIdx} 
                            className="rounded-lg bg-[#1A1A1D] border border-[#26262A] p-2.5 text-[#A1A1AA] font-sans leading-relaxed"
                          >
                            <span className="font-bold text-[#C8F000] mr-1.5">[AI Agent]:</span>
                            {dialogue.replace(/\[Agent\]:\s*"/g, '').replace(/"/g, '')}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-[#A1A1AA] pt-2 border-t border-[#26262A]">
                        <span>Duration: <strong className="text-white">{voice.call_duration_seconds}s</strong></span>
                        <span>Outcome: <strong className="font-mono text-[#C8F000]">{voice.simulated_outcome}</strong></span>
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
