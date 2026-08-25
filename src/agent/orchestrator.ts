import { SubscriptionFailureDetector, AtRiskSubscriptionEvent, DetectionResult } from '../detection/subscription_failure_detector';
import { RootCauseClassifier, DiagnosisResult } from '../diagnosis/root_cause_classifier';
import { InterventionPolicy, PolicyDecision } from '../decision/intervention_policy';
import { StoppingRules, StoppingRuleCheckResult } from '../decision/stopping_rules';
import { ComplianceGate, ComplianceCheckResult } from '../decision/compliance_gate';
import { MandateRetryExecutor, ExecutionResult } from '../execution/mandate_retry_executor';
import { HinglishVoiceAgent, VoiceCallExecutionResult } from '../execution/hinglish_voice_agent';
import { RetryScheduler, SchedulerResolutionSummary } from '../tracking/retry_scheduler';
import { AuditLogger } from '../audit/audit_logger';
import { getDatabase } from '../db/database';

export interface CaseProcessingSummary {
  subscription_id: string;
  customer_name: string;
  amount: number;
  failure_reason_code: string;
  diagnosis: DiagnosisResult;
  decision: PolicyDecision;
  stopping_rule_result: StoppingRuleCheckResult;
  compliance_gate_result: ComplianceCheckResult;
  execution_result?: ExecutionResult;
  voice_result?: VoiceCallExecutionResult;
  status: 
    | 'GATEWAY_RECOVERED' 
    | 'VOICE_RECOVERED' 
    | 'VOICE_PTP_COMMITTED'
    | 'DISPATCHED' 
    | 'BLOCKED_STOPPING_RULE' 
    | 'BLOCKED_COMPLIANCE' 
    | 'RETRY_FAILED' 
    | 'ESCALATED';
  summary_note: string;
}

export interface BatchRunReport {
  batch_id: string;
  total_events_detected: number;
  total_at_risk_amount: number;
  gateway_recovered_amount: number;
  voice_recovered_amount: number;
  total_recovered_amount: number;
  recovery_rate_pct: number;
  stopping_rule_triggers_count: number;
  compliance_gate_blocks_count: number;
  voice_calls_placed_count: number;
  promises_made_count: number;
  promises_kept_count: number;
  promises_broken_count: number;
  successful_recoveries_count: number;
  dispatched_nudges_count: number;
  failed_retries_count: number;
  unresolved_exceptions_count: number;
  cases: CaseProcessingSummary[];
  scheduler_summary?: SchedulerResolutionSummary;
  timestamp: string;
}

export class RevenueRecoveryOrchestrator {
  /**
   * Processes a single at-risk subscription through the complete closed-loop pipeline:
   * Detect -> Diagnose -> Decide (with Voice Escalation) -> Safety & Compliance Gates -> Execute -> Audit
   */
  public static async processSingleCase(event: AtRiskSubscriptionEvent): Promise<CaseProcessingSummary> {
    // 1. Diagnose
    const diagnosis = RootCauseClassifier.diagnose(event);

    // 2. Decide Policy (includes escalation to Hinglish Voice Recovery for high-value / repeat failure cases)
    const decision = InterventionPolicy.decide(diagnosis.root_cause, event);

    // 3. Evaluate Stopping Rules
    let intendedActionType: 'RETRY_NOW' | 'SCHEDULE_RETRY' | 'NUDGE' | 'NEW_MANDATE_REQUEST' = 'NUDGE';
    if (decision.action === 'RETRY_MANDATE_NOW') intendedActionType = 'RETRY_NOW';
    else if (decision.action === 'SCHEDULE_RETRY_24H') intendedActionType = 'SCHEDULE_RETRY';
    else if (decision.action === 'REQUEST_NEW_MANDATE') intendedActionType = 'NEW_MANDATE_REQUEST';

    const stoppingCheck = StoppingRules.evaluate(event, intendedActionType);

    if (!stoppingCheck.passed) {
      return {
        subscription_id: event.subscription_id,
        customer_name: event.customer_name,
        amount: event.amount,
        failure_reason_code: event.failure_reason_code,
        diagnosis,
        decision,
        stopping_rule_result: stoppingCheck,
        compliance_gate_result: { passed: false, blocked_reason: 'Skipped due to stopping rule trigger' },
        status: 'BLOCKED_STOPPING_RULE',
        summary_note: `Stopped by safety rule: ${stoppingCheck.reason}`
      };
    }

    // 4. Evaluate Compliance Gate (Quiet Hours & TRAI/RBI Anti-Harassment Frequency)
    const complianceCheck = ComplianceGate.evaluate(event, decision.action);

    if (!complianceCheck.passed) {
      return {
        subscription_id: event.subscription_id,
        customer_name: event.customer_name,
        amount: event.amount,
        failure_reason_code: event.failure_reason_code,
        diagnosis,
        decision,
        stopping_rule_result: stoppingCheck,
        compliance_gate_result: complianceCheck,
        status: 'BLOCKED_COMPLIANCE',
        summary_note: `Blocked by compliance gate: ${complianceCheck.blocked_reason}`
      };
    }

    // 5. Execute Action
    let executionResult: ExecutionResult | undefined;
    let voiceResult: VoiceCallExecutionResult | undefined;
    let finalStatus: CaseProcessingSummary['status'] = 'ESCALATED';
    let summaryNote = '';

    if (decision.action === 'HINGLISH_VOICE_RECOVERY') {
      voiceResult = await HinglishVoiceAgent.executeVoiceCall(event);
      if (voiceResult.outcome === 'AGREED_IMMEDIATE_RETRY') {
        if (voiceResult.mandate_execution?.success) {
          finalStatus = 'VOICE_RECOVERED';
          summaryNote = `Voice Call: Customer verbally authorized immediate retry. ₹${event.amount} recovered via gateway.`;
        } else {
          finalStatus = 'RETRY_FAILED';
          summaryNote = `Voice Call: Customer authorized retry, but gateway returned ${event.failure_reason_code}.`;
        }
      } else if (voiceResult.outcome === 'PROMISE_TO_PAY_COMMITTED') {
        finalStatus = 'VOICE_PTP_COMMITTED';
        summaryNote = `Voice Call: Customer committed to Promise-to-Pay on ${voiceResult.transcript.promised_date}.`;
      } else {
        finalStatus = 'ESCALATED';
        summaryNote = `Voice Call: Call unanswered/declined. Routed to manual finance queue.`;
      }
    } else if (decision.action === 'RETRY_MANDATE_NOW') {
      executionResult = await MandateRetryExecutor.executeMandateRetry(event, 'IMMEDIATE');
      finalStatus = executionResult.success ? 'GATEWAY_RECOVERED' : 'RETRY_FAILED';
      summaryNote = executionResult.execution_details;
    } else if (decision.action === 'SCHEDULE_RETRY_24H') {
      executionResult = await MandateRetryExecutor.executeMandateRetry(event, 'SCHEDULED_24H');
      finalStatus = executionResult.success ? 'GATEWAY_RECOVERED' : 'RETRY_FAILED';
      summaryNote = executionResult.execution_details;
    } else if (decision.action === 'SEND_PAYMENT_METHOD_UPDATE_NUDGE' || decision.action === 'REQUEST_NEW_MANDATE') {
      executionResult = await MandateRetryExecutor.dispatchCustomerNudge(
        event,
        decision.action,
        decision.channel as 'WHATSAPP_NUDGE' | 'SMS_NUDGE'
      );
      finalStatus = 'DISPATCHED';
      summaryNote = executionResult.execution_details;
    } else {
      AuditLogger.log({
        event_type: 'EXECUTION',
        subscription_id: event.subscription_id,
        decision: 'ESCALATE_TO_MANUAL_REVIEW',
        reasoning: `No automated action permissible. Case queued for manual finance intervention.`,
        action_taken: 'ENQUEUE_MANUAL_REVIEW',
        result: 'ESCALATED'
      });
      finalStatus = 'ESCALATED';
      summaryNote = 'Escalated to human finance ops review';
    }

    return {
      subscription_id: event.subscription_id,
      customer_name: event.customer_name,
      amount: event.amount,
      failure_reason_code: event.failure_reason_code,
      diagnosis,
      decision,
      stopping_rule_result: stoppingCheck,
      compliance_gate_result: complianceCheck,
      execution_result: executionResult,
      voice_result: voiceResult,
      status: finalStatus,
      summary_note: summaryNote
    };
  }

  /**
   * Runs the full batch across all at-risk subscriptions, advances scheduler for PTPs, and stores metrics.
   */
  public static async runBatch(): Promise<BatchRunReport> {
    const batchId = `batch_${Date.now()}`;
    HinglishVoiceAgent.clearTranscripts();
    const detection: DetectionResult = SubscriptionFailureDetector.detect();

    const caseSummaries: CaseProcessingSummary[] = [];
    let gatewayRecovered = 0;
    let voiceRecovered = 0;
    let stoppingRuleTriggersCount = 0;
    let complianceGateBlocksCount = 0;
    let voiceCallsPlacedCount = 0;
    let promisesMadeCount = 0;
    let dispatchedNudgesCount = 0;
    let failedRetriesCount = 0;
    let exceptionsCount = 0;

    for (const event of detection.events) {
      const summary = await RevenueRecoveryOrchestrator.processSingleCase(event);
      caseSummaries.push(summary);

      if (summary.decision.action === 'HINGLISH_VOICE_RECOVERY') {
        voiceCallsPlacedCount++;
      }

      if (summary.status === 'GATEWAY_RECOVERED') {
        gatewayRecovered += summary.amount;
      } else if (summary.status === 'VOICE_RECOVERED') {
        voiceRecovered += summary.amount;
      } else if (summary.status === 'VOICE_PTP_COMMITTED') {
        promisesMadeCount++;
      } else if (summary.status === 'BLOCKED_STOPPING_RULE') {
        stoppingRuleTriggersCount++;
        exceptionsCount++;
      } else if (summary.status === 'BLOCKED_COMPLIANCE') {
        complianceGateBlocksCount++;
        exceptionsCount++;
      } else if (summary.status === 'DISPATCHED') {
        dispatchedNudgesCount++;
      } else if (summary.status === 'RETRY_FAILED') {
        failedRetriesCount++;
        exceptionsCount++;
      } else {
        exceptionsCount++;
      }
    }

    // Advance simulated time through RetryScheduler to resolve all active Promise-to-Pay commitments
    const schedulerSummary = RetryScheduler.advanceAndResolvePromises();
    voiceRecovered += schedulerSummary.voice_recovered_amount;
    const promisesKeptCount = schedulerSummary.kept_count;
    const promisesBrokenCount = schedulerSummary.broken_count;

    const totalRecovered = gatewayRecovered + voiceRecovered;
    const successfulRecoveriesCount = 
      caseSummaries.filter(c => c.status === 'GATEWAY_RECOVERED' || c.status === 'VOICE_RECOVERED').length + 
      promisesKeptCount;

    const recoveryRatePct = detection.total_at_risk_amount > 0 
      ? Number(((totalRecovered / detection.total_at_risk_amount) * 100).toFixed(2)) 
      : 0;

    const report: BatchRunReport = {
      batch_id: batchId,
      total_events_detected: detection.total_count,
      total_at_risk_amount: detection.total_at_risk_amount,
      gateway_recovered_amount: gatewayRecovered,
      voice_recovered_amount: voiceRecovered,
      total_recovered_amount: totalRecovered,
      recovery_rate_pct: recoveryRatePct,
      stopping_rule_triggers_count: stoppingRuleTriggersCount,
      compliance_gate_blocks_count: complianceGateBlocksCount,
      voice_calls_placed_count: voiceCallsPlacedCount,
      promises_made_count: promisesMadeCount,
      promises_kept_count: promisesKeptCount,
      promises_broken_count: promisesBrokenCount,
      successful_recoveries_count: successfulRecoveriesCount,
      dispatched_nudges_count: dispatchedNudgesCount,
      failed_retries_count: failedRetriesCount,
      unresolved_exceptions_count: exceptionsCount + promisesBrokenCount,
      cases: caseSummaries,
      scheduler_summary: schedulerSummary,
      timestamp: new Date().toISOString()
    };

    // Persist recovery metrics into DB
    const db = getDatabase();
    db.prepare(`
      INSERT INTO recovery_metrics (
        batch_id, total_at_risk, total_recovered, recovery_rate_pct,
        stopping_rule_triggers_count, compliance_gate_blocks_count,
        exceptions_count, voice_calls_placed_count, promises_made_count,
        promises_kept_count, promises_broken_count, voice_recovered_amount,
        gateway_recovered_amount, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.batch_id,
      report.total_at_risk_amount,
      report.total_recovered_amount,
      report.recovery_rate_pct,
      report.stopping_rule_triggers_count,
      report.compliance_gate_blocks_count,
      report.unresolved_exceptions_count,
      report.voice_calls_placed_count,
      report.promises_made_count,
      report.promises_kept_count,
      report.promises_broken_count,
      report.voice_recovered_amount,
      report.gateway_recovered_amount,
      report.timestamp
    );

    return report;
  }
}
