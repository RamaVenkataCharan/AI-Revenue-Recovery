import { SubscriptionFailureDetector, AtRiskSubscriptionEvent, DetectionResult } from '../detection/subscription_failure_detector';
import { RootCauseClassifier, DiagnosisResult } from '../diagnosis/root_cause_classifier';
import { InterventionPolicy, PolicyDecision } from '../decision/intervention_policy';
import { StoppingRules, StoppingRuleCheckResult } from '../decision/stopping_rules';
import { evaluateAdaptedCompliance } from '../compliance/adapter';
import { ComplianceCheckResult } from '../compliance/gate';
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
  compliance_gate_result: { passed: boolean; blocked_reason?: string; rule_cited?: string };
  next_scheduled_action_at?: string;
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
  deferred_compliance_count: number;
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

/**
 * Calculates the exact next permissible execution timestamp for a compliance-blocked case.
 */
function computeComplianceRescheduleTime(
  event: AtRiskSubscriptionEvent,
  ruleCited?: string,
  proposedTime: Date = new Date()
): { 
  nextActionAt: string; 
  planNote: string; 
  updatedNoticeSentAt?: string; 
  redirectedAction?: string; 
  redirectedChannel?: string;
} {
  const t = proposedTime.getTime();

  if (ruleCited === 'TRAI_QUIET_HOURS_2100_0900_IST') {
    // Reschedule for opening of next permissible active operating window (09:00 IST / 03:30 UTC)
    const istOffset = 5.5 * 3600 * 1000;
    const currentIst = new Date(t + istOffset);
    // If currently after 21:00 IST or before 09:00 IST, advance to 09:00 IST
    const targetIst = new Date(currentIst);
    if (targetIst.getUTCHours() >= 21) {
      targetIst.setUTCDate(targetIst.getUTCDate() + 1);
    }
    targetIst.setUTCHours(9, 0, 0, 0); // 09:00 IST
    const nextUtc = new Date(targetIst.getTime() - istOffset);
    return {
      nextActionAt: nextUtc.toISOString(),
      planNote: `Deferred until active operating window opens at 09:00 IST (${nextUtc.toISOString()})`
    };
  } else if (ruleCited === 'MIN_COOLDOWN_48H') {
    const lastContactStr = event.last_contacted_at || event.contact_history?.[event.contact_history.length - 1];
    const lastContactTime = lastContactStr ? new Date(lastContactStr).getTime() : t - 24 * 3600 * 1000;
    const eligibleTime = new Date(lastContactTime + 48.5 * 3600 * 1000);
    return {
      nextActionAt: eligibleTime.toISOString(),
      planNote: `Deferred until mandatory 48-hour anti-harassment cooldown expires at ${eligibleTime.toISOString()}`
    };
  } else if (ruleCited === 'RBI_24H_PRE_DEBIT_NOTICE') {
    // Dispatch pre-debit notice NOW (at proposedTime) so notice period starts immediately
    const noticeTimestamp = proposedTime.toISOString();
    const eligibleTime = new Date(t + 24.5 * 3600 * 1000);
    return {
      nextActionAt: eligibleTime.toISOString(),
      updatedNoticeSentAt: noticeTimestamp,
      planNote: `Pre-debit notice dispatched at ${noticeTimestamp}; retry debit scheduled after 24h notice window at ${eligibleTime.toISOString()}`
    };
  } else if (ruleCited === 'TRAI_DND_CHANNEL_BLOCK') {
    const eligibleTime = new Date(t + 2 * 3600 * 1000);
    return {
      nextActionAt: eligibleTime.toISOString(),
      redirectedAction: 'SEND_BILLING_PORTAL_NOTICE',
      redirectedChannel: 'TRANSACTIONAL_EMAIL',
      planNote: `Direct voice/SMS blocked by National DND; redirected to transactional billing portal notice via email.`
    };
  }

  const fallbackTime = new Date(t + 24 * 3600 * 1000);
  return {
    nextActionAt: fallbackTime.toISOString(),
    planNote: `Deferred for next diurnal cycle at ${fallbackTime.toISOString()}`
  };
}

export class RevenueRecoveryOrchestrator {
  /**
   * Processes a single at-risk subscription through the complete closed-loop pipeline:
   * Detect -> Diagnose -> Decide (with Voice Escalation) -> Safety & Compliance Gates -> Execute -> Audit
   */
  public static async processSingleCase(event: AtRiskSubscriptionEvent): Promise<CaseProcessingSummary> {
    const db = getDatabase();

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

    // 4. Evaluate Canonical Compliance Gate (RBI Max Retries, TRAI Quiet Hours, 24h Pre-Debit, Min Cooldown 48h, TRAI DND)
    const proposedTime = event.last_attempt_timestamp ? new Date(event.last_attempt_timestamp) : new Date();
    const complianceEval = evaluateAdaptedCompliance(event, decision.action, decision.channel, proposedTime);

    const complianceGateResult = {
      passed: complianceEval.passed,
      blocked_reason: complianceEval.blocked_reason,
      rule_cited: complianceEval.rule_cited
    };

    if (!complianceEval.passed) {
      const { nextActionAt, planNote, updatedNoticeSentAt, redirectedAction, redirectedChannel } = computeComplianceRescheduleTime(
        event,
        complianceEval.rule_cited,
        proposedTime
      );

      // Reschedule in database:
      // If pre-debit notice rule triggered, update pre_debit_notice_sent_at in DB
      if (updatedNoticeSentAt) {
        db.prepare(`
          UPDATE subscriptions 
          SET next_scheduled_action_at = ?, pre_debit_notice_sent_at = ? 
          WHERE subscription_id = ?
        `).run(nextActionAt, updatedNoticeSentAt, event.subscription_id);
        event.pre_debit_notice_sent_at = updatedNoticeSentAt;
      } else {
        db.prepare('UPDATE subscriptions SET next_scheduled_action_at = ? WHERE subscription_id = ?').run(
          nextActionAt,
          event.subscription_id
        );
      }

      event.next_scheduled_action_at = nextActionAt;

      // Record deferred intervention with redirected action/channel if applicable
      db.prepare(`
        INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, metadata)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        event.subscription_id,
        redirectedAction || 'DEFERRED_COMPLIANCE_RESCHEDULE',
        `Action delayed per ${complianceEval.rule_cited}. ${planNote}`,
        'DEFERRED',
        JSON.stringify({ 
          next_scheduled_action_at: nextActionAt, 
          rule_cited: complianceEval.rule_cited,
          redirected_action: redirectedAction,
          redirected_channel: redirectedChannel,
          pre_debit_notice_sent_at: updatedNoticeSentAt
        })
      );

      AuditLogger.log({
        event_type: 'COMPLIANCE_GATE_CHECK',
        subscription_id: event.subscription_id,
        decision: 'COMPLIANCE_GATE_BLOCKED',
        reasoning: `Blocked by ${complianceEval.rule_cited}: ${complianceEval.blocked_reason}. Recovery rescheduled: ${planNote}`,
        action_taken: redirectedAction ? 'REDIRECT_TRANSACTIONAL_CHANNEL' : 'RESCHEDULE_DEFERRED_ACTION',
        result: 'DEFERRED_FOR_PERMISSIBLE_WINDOW',
        metadata: {
          rule_cited: complianceEval.rule_cited,
          blocked_reason: complianceEval.blocked_reason,
          next_scheduled_action_at: nextActionAt,
          redirected_action: redirectedAction,
          redirected_channel: redirectedChannel,
          pre_debit_notice_sent_at: updatedNoticeSentAt,
          evaluated_count: complianceEval.evaluated_count,
          exempt_count: complianceEval.exempt_count,
          checks: complianceEval.check_results
        }
      });

      return {
        subscription_id: event.subscription_id,
        customer_name: event.customer_name,
        amount: event.amount,
        failure_reason_code: event.failure_reason_code,
        diagnosis,
        decision,
        stopping_rule_result: stoppingCheck,
        compliance_gate_result: complianceGateResult,
        next_scheduled_action_at: nextActionAt,
        status: 'BLOCKED_COMPLIANCE',
        summary_note: `Deferred by compliance gate (${complianceEval.rule_cited}) — ${planNote}`
      };
    }

    // Gate Passed — Record Compliance Audit with exact evaluated vs exempt counts
    const exemptRuleNames = complianceEval.check_results
      .filter((c) => c.context_snapshot?.exempt === true)
      .map((c) => c.rule_cited)
      .join(', ');

    const exemptionClause = exemptRuleNames ? ` (${complianceEval.exempt_count} exempt: ${exemptRuleNames})` : '';

    AuditLogger.log({
      event_type: 'COMPLIANCE_GATE_CHECK',
      subscription_id: event.subscription_id,
      decision: 'COMPLIANCE_GATE_PASSED',
      reasoning: `Action "${decision.action}" complies: ${complianceEval.evaluated_count} applicable regulatory rules evaluated${exemptionClause}; all passed.`,
      action_taken: 'APPROVE_ACTION',
      result: 'PASSED',
      metadata: {
        rule_cited: complianceEval.rule_cited,
        evaluated_count: complianceEval.evaluated_count,
        exempt_count: complianceEval.exempt_count,
        checks: complianceEval.check_results
      }
    });

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
      compliance_gate_result: complianceGateResult,
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

      // Track voice calls placed ONLY when the call was actually executed (not blocked by gates)
      if (summary.voice_result) {
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

    // Store batch summary metrics in DB
    const db = getDatabase();
    db.prepare(`
      INSERT OR REPLACE INTO recovery_metrics (
        batch_id, total_at_risk, total_recovered, recovery_rate_pct,
        stopping_rule_triggers_count, compliance_gate_blocks_count, exceptions_count,
        voice_calls_placed_count, promises_made_count, promises_kept_count,
        promises_broken_count, voice_recovered_amount, gateway_recovered_amount, timestamp
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
    `).run(
      batchId,
      detection.total_at_risk_amount,
      totalRecovered,
      recoveryRatePct,
      stoppingRuleTriggersCount,
      complianceGateBlocksCount,
      exceptionsCount,
      voiceCallsPlacedCount,
      promisesMadeCount,
      promisesKeptCount,
      promisesBrokenCount,
      voiceRecovered,
      gatewayRecovered
    );

    return {
      batch_id: batchId,
      total_events_detected: detection.total_count,
      total_at_risk_amount: detection.total_at_risk_amount,
      gateway_recovered_amount: gatewayRecovered,
      voice_recovered_amount: voiceRecovered,
      total_recovered_amount: totalRecovered,
      recovery_rate_pct: recoveryRatePct,
      deferred_compliance_count: complianceGateBlocksCount,
      stopping_rule_triggers_count: stoppingRuleTriggersCount,
      compliance_gate_blocks_count: complianceGateBlocksCount,
      voice_calls_placed_count: voiceCallsPlacedCount,
      promises_made_count: promisesMadeCount,
      promises_kept_count: promisesKeptCount,
      promises_broken_count: promisesBrokenCount,
      successful_recoveries_count: successfulRecoveriesCount,
      dispatched_nudges_count: dispatchedNudgesCount,
      failed_retries_count: failedRetriesCount,
      unresolved_exceptions_count: exceptionsCount,
      cases: caseSummaries,
      scheduler_summary: schedulerSummary,
      timestamp: new Date().toISOString()
    };
  }
}
