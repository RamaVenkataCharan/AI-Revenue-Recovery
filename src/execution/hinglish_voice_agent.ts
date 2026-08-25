import fs from 'fs';
import path from 'path';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { MandateRetryExecutor, ExecutionResult } from './mandate_retry_executor';
import { PromiseToPayTracker, PromiseToPayRecord } from '../tracking/promise_to_pay_tracker';
import { AuditLogger } from '../audit/audit_logger';

export interface VoiceCallTranscript {
  call_id: string;
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  customer_segment: string;
  amount: number;
  failure_reason: string;
  tone: 'PREMIUM_DEFERENTIAL' | 'FRIENDLY_DIRECT' | 'FIRM_ACTION_ORIENTED';
  script_content: string;
  call_duration_seconds: number;
  simulated_outcome: 'AGREED_IMMEDIATE_RETRY' | 'PROMISE_TO_PAY_COMMITTED' | 'CALL_UNANSWERED_OR_DECLINED';
  promised_date?: string;
  timestamp: string;
  summary: string;
}

export interface VoiceCallExecutionResult {
  call_id: string;
  subscription_id: string;
  customer_name: string;
  outcome: 'AGREED_IMMEDIATE_RETRY' | 'PROMISE_TO_PAY_COMMITTED' | 'CALL_UNANSWERED_OR_DECLINED';
  transcript: VoiceCallTranscript;
  mandate_execution?: ExecutionResult;
  ptp_record?: PromiseToPayRecord;
  summary: string;
}

export class HinglishVoiceAgent {
  private static readonly TRANSCRIPTS_FILE = path.join(process.cwd(), 'data/synthetic/voice_call_transcripts.json');

  /**
   * Generates a code-switched Hinglish recovery script customized by segment and failure reason.
   */
  public static generateScript(event: AtRiskSubscriptionEvent): { script: string; tone: VoiceCallTranscript['tone'] } {
    const firstName = event.customer_name.split(' ')[0];
    const amountStr = new Intl.NumberFormat('en-IN').format(event.amount);

    let reasonHinglish = 'technical communication issue';
    switch (event.failure_reason_code) {
      case 'insufficient_funds':
        reasonHinglish = 'bank account mein balance update na hone ke wajah se';
        break;
      case 'card_expired':
        reasonHinglish = 'aapka linked debit/credit card expire hone ke wajah se';
        break;
      case 'daily_limit_exceeded':
        reasonHinglish = 'daily bank mandate transaction limit reach hone ke wajah se';
        break;
      case 'bank_declined':
        reasonHinglish = 'issuing bank ke temporary network decline ke wajah se';
        break;
      case 'technical_error':
        reasonHinglish = 'transient gateway switch timeout ke wajah se';
        break;
      default:
        reasonHinglish = 'mandate verification drop ke wajah se';
        break;
    }

    if (event.customer_segment === 'high_value') {
      return {
        tone: 'PREMIUM_DEFERENTIAL',
        script: `[Agent]: "Namaste ${firstName} ji! Main Razorpay Priority Desk se baat kar raha hoon. Hope you are having a wonderful day.\n` +
          `[Agent]: "${firstName} ji, aapka ₹${amountStr} ka premium recurring subscription renewal ${reasonHinglish} process nahi ho paya tha.\n` +
          `[Agent]: "Hum ensure karna chahte hain ki aapki uninterrupted VIP access continue rahe. Kya hum abhi ek instant secure retry initiate kar sakte hain, ya aap mujhe koi convenient date bata denge jab hum aapke liye debit re-schedule karein?"`
      };
    } else if (event.customer_segment === 'at_risk') {
      return {
        tone: 'FIRM_ACTION_ORIENTED',
        script: `[Agent]: "Namaste ${firstName} ji, main Razorpay account resolution team se urgent update ke liye call kar raha hoon.\n` +
          `[Agent]: "Aapka ₹${amountStr} ka overdue payment ${reasonHinglish} decline ho gaya hai aur previous notifications par koi action nahi mila.\n` +
          `[Agent]: "Service suspension aur late penalty se bachne ke liye, kya hum payment abhi process karein, ya aap ek specific Promise-to-Pay date commit karenge?"`
      };
    } else {
      return {
        tone: 'FRIENDLY_DIRECT',
        script: `[Agent]: "Hello ${firstName} ji, main Razorpay customer care team se connect kar raha hoon.\n` +
          `[Agent]: "Aapka monthly payment of ₹${amountStr}, ${reasonHinglish} complete nahi ho paya tha.\n` +
          `[Agent]: "Kya hum abhi isse auto-retry kar dein, ya fir aap 2-3 din baad ki koi date confirm karenge jab account mein funds available honge?"`
      };
    }
  }

  /**
   * Executes a simulated Hinglish recovery voice call, records transcripts, and triggers downstream actions.
   */
  public static async executeVoiceCall(event: AtRiskSubscriptionEvent): Promise<VoiceCallExecutionResult> {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const { script, tone } = HinglishVoiceAgent.generateScript(event);
    const nowIso = new Date().toISOString();

    // Weighted simulated customer reaction:
    // 50% Agree to immediate retry
    // 35% Commit to Promise-to-Pay date (2-7 days in future)
    // 15% No answer / Declined
    const roll = Math.random();
    let outcome: VoiceCallTranscript['simulated_outcome'];
    let promisedDate: string | undefined;
    let duration = 45;
    let summary = '';

    if (roll < 0.50) {
      outcome = 'AGREED_IMMEDIATE_RETRY';
      duration = 58;
      summary = `Customer ${event.customer_name} verified identity and verbally authorized immediate mandate retry.`;
    } else if (roll < 0.85) {
      outcome = 'PROMISE_TO_PAY_COMMITTED';
      duration = 76;
      const daysAhead = Math.floor(Math.random() * 5) + 2; // 2 to 6 days
      const pDate = new Date();
      pDate.setDate(pDate.getDate() + daysAhead);
      promisedDate = pDate.toISOString().split('T')[0];
      summary = `Customer ${event.customer_name} agreed to settle balance and committed to a Promise-to-Pay (PTP) on ${promisedDate}.`;
    } else {
      outcome = 'CALL_UNANSWERED_OR_DECLINED';
      duration = 18;
      summary = `Customer ${event.customer_name} disconnected call after greeting or declined to make payment commitment.`;
    }

    const transcriptRecord: VoiceCallTranscript = {
      call_id: callId,
      subscription_id: event.subscription_id,
      customer_id: event.customer_id,
      customer_name: event.customer_name,
      customer_segment: event.customer_segment,
      amount: event.amount,
      failure_reason: event.failure_reason_code,
      tone,
      script_content: script,
      call_duration_seconds: duration,
      simulated_outcome: outcome,
      promised_date: promisedDate,
      timestamp: nowIso,
      summary
    };

    // Save transcript to synthetic file
    HinglishVoiceAgent.saveTranscript(transcriptRecord);

    // Audit Log the voice interaction
    AuditLogger.log({
      event_type: 'EXECUTION',
      subscription_id: event.subscription_id,
      decision: 'VOICE_CALL_COMPLETED',
      reasoning: `Hinglish Voice Agent placed call (${duration}s duration, tone: ${tone}). Customer outcome: ${outcome}. Summary: ${summary}`,
      action_taken: 'SIMULATED_VOICE_OUTREACH',
      result: outcome,
      metadata: {
        call_id: callId,
        tone,
        duration_seconds: duration,
        outcome,
        promised_date: promisedDate
      }
    });

    let mandateExecution: ExecutionResult | undefined;
    let ptpRecord: PromiseToPayRecord | undefined;

    // Follow-up on voice outcome
    if (outcome === 'AGREED_IMMEDIATE_RETRY') {
      mandateExecution = await MandateRetryExecutor.executeMandateRetry(event, 'IMMEDIATE');
    } else if (outcome === 'PROMISE_TO_PAY_COMMITTED' && promisedDate) {
      ptpRecord = PromiseToPayTracker.createPromise(event, promisedDate);
    } else {
      // Escalated to manual queue
      AuditLogger.log({
        event_type: 'OUTCOME',
        subscription_id: event.subscription_id,
        decision: 'VOICE_CALL_ESCALATED',
        reasoning: `Voice call did not yield recovery or promise. Case routed to human collections specialist.`,
        action_taken: 'ESCALATE_TO_MANUAL_REVIEW',
        result: 'UNRESOLVED_CALL'
      });
    }

    return {
      call_id: callId,
      subscription_id: event.subscription_id,
      customer_name: event.customer_name,
      outcome,
      transcript: transcriptRecord,
      mandate_execution: mandateExecution,
      ptp_record: ptpRecord,
      summary
    };
  }

  private static saveTranscript(transcript: VoiceCallTranscript): void {
    let list: VoiceCallTranscript[] = [];
    if (fs.existsSync(HinglishVoiceAgent.TRANSCRIPTS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(HinglishVoiceAgent.TRANSCRIPTS_FILE, 'utf-8'));
      } catch {
        list = [];
      }
    }
    list.push(transcript);
    fs.writeFileSync(HinglishVoiceAgent.TRANSCRIPTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  }

  public static clearTranscripts(): void {
    fs.writeFileSync(HinglishVoiceAgent.TRANSCRIPTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}
