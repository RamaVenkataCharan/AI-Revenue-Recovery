import { RootCause } from '../diagnosis/root_cause_classifier';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export type PolicyAction = 
  | 'RETRY_MANDATE_NOW'
  | 'SCHEDULE_RETRY_24H'
  | 'SEND_PAYMENT_METHOD_UPDATE_NUDGE'
  | 'REQUEST_NEW_MANDATE'
  | 'HINGLISH_VOICE_RECOVERY'
  | 'ESCALATE_TO_MANUAL_REVIEW';

export interface PolicyDecision {
  action: PolicyAction;
  reasoning: string;
  channel: 'RAZORPAY_API' | 'WHATSAPP_NUDGE' | 'SMS_NUDGE' | 'HINGLISH_VOICE_CALL' | 'MANUAL_QUEUE';
  is_automated_retry: boolean;
  is_voice_escalation: boolean;
}

export class InterventionPolicy {
  /**
   * Deterministic decision matrix mapping (Root Cause + Customer Segment + Escalation State)
   * to a bounded, compliant recovery action.
   */
  public static decide(
    rootCause: RootCause,
    event: AtRiskSubscriptionEvent
  ): PolicyDecision {
    let action: PolicyAction;
    let channel: PolicyDecision['channel'];
    let isAutomatedRetry = false;
    let isVoiceEscalation = false;
    let reasoning = '';

    // Escalation Condition for Hinglish Voice Recovery:
    // High Value or At Risk customers with retry_count_so_far >= 1 on retry_later / update_payment_method
    const isEligibleForVoiceEscalation = 
      (event.customer_segment === 'high_value' || event.customer_segment === 'at_risk') &&
      event.retry_count_so_far >= 1 &&
      (rootCause === 'retry_later' || rootCause === 'update_payment_method');

    if (isEligibleForVoiceEscalation) {
      action = 'HINGLISH_VOICE_RECOVERY';
      channel = 'HINGLISH_VOICE_CALL';
      isAutomatedRetry = false;
      isVoiceEscalation = true;
      reasoning = `Tier-2 Escalation Triggered: Customer ${event.customer_name} (${event.customer_segment} segment, ₹${event.amount} at risk) already has ${event.retry_count_so_far} prior failed attempt(s). Policy escalates from passive digital nudge to proactive Hinglish Voice Agent outreach to secure immediate retry or a Promise-to-Pay (PTP) commitment.`;
    } else {
      switch (rootCause) {
        case 'retry_immediate':
          action = 'RETRY_MANDATE_NOW';
          channel = 'RAZORPAY_API';
          isAutomatedRetry = true;
          reasoning = `Transient technical error detected for ${event.customer_segment} segment customer. Policy authorizes immediate server-to-server mandate reattempt via Razorpay API.`;
          break;

        case 'retry_later':
          action = 'SCHEDULE_RETRY_24H';
          channel = 'RAZORPAY_API';
          isAutomatedRetry = true;
          reasoning = `Diagnosed soft failure (${event.failure_reason_code}). Policy schedules an automated mandate retry in 24h to coincide with balance replenishment.`;
          break;

        case 'update_payment_method':
          action = 'SEND_PAYMENT_METHOD_UPDATE_NUDGE';
          channel = event.customer_segment === 'high_value' ? 'WHATSAPP_NUDGE' : 'SMS_NUDGE';
          isAutomatedRetry = false;
          reasoning = `Card expired. Mandate retries are futile. Policy dispatches an automated secure payment link nudge via ${channel} for customer to update card details.`;
          break;

        case 'requires_new_mandate':
          action = 'REQUEST_NEW_MANDATE';
          channel = 'WHATSAPP_NUDGE';
          isAutomatedRetry = false;
          reasoning = `Mandate was revoked or cancelled. Automated retries are prohibited. Policy triggers an e-mandate re-registration authorization link.`;
          break;

        default:
          action = 'ESCALATE_TO_MANUAL_REVIEW';
          channel = 'MANUAL_QUEUE';
          isAutomatedRetry = false;
          reasoning = `Unknown or ambiguous failure pattern. Bounded safety policy directs this case to human finance ops queue.`;
          break;
      }
    }

    AuditLogger.log({
      event_type: 'DECISION',
      subscription_id: event.subscription_id,
      decision: action,
      reasoning: `Policy evaluation: [Cause: ${rootCause}, Segment: ${event.customer_segment}, Retries: ${event.retry_count_so_far}] -> Action: ${action} via ${channel}. ${reasoning}`,
      action_taken: 'DISPATCH_TO_EXECUTOR',
      result: action,
      metadata: {
        rootCause,
        customer_segment: event.customer_segment,
        retry_count_so_far: event.retry_count_so_far,
        channel,
        is_automated_retry: isAutomatedRetry,
        is_voice_escalation: isVoiceEscalation
      }
    });

    return {
      action,
      reasoning,
      channel,
      is_automated_retry: isAutomatedRetry,
      is_voice_escalation: isVoiceEscalation
    };
  }
}
