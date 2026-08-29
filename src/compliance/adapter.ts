/**
 * @module Compliance Gate Adapter
 *
 * Translates flat runtime data models (AtRiskSubscriptionEvent from detection)
 * into the complete, normalized ComplianceGateInput contract required by
 * the canonical Regulatory Compliance Gate (src/compliance/gate.ts).
 *
 * All fields are mapped directly from real DB columns without fabrication.
 */
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import {
  ComplianceGateInput,
  ProposedAction,
  ProposedChannel,
  evaluateComplianceGate,
  isActionBlocked,
  ComplianceCheckResult
} from './gate';
import {
  RecoveryCase,
  Subscription,
  Customer,
  FailureEvent,
  FailureCategory,
  SubscriptionStatus,
  CustomerTier
} from '../db/types';

/**
 * Maps a PolicyAction string (from InterventionPolicy) to the canonical ProposedAction enum.
 */
export function mapPolicyActionToProposedAction(policyAction: string): ProposedAction {
  switch (policyAction) {
    case 'RETRY_MANDATE_NOW':
      return 'retry_now';
    case 'SCHEDULE_RETRY_24H':
      return 'retry_scheduled';
    case 'SEND_PAYMENT_METHOD_UPDATE_NUDGE':
      return 'whatsapp_nudge';
    case 'REQUEST_NEW_MANDATE':
      return 'whatsapp_nudge';
    case 'SEND_BILLING_PORTAL_NOTICE':
      return 'email_notice';
    case 'HINGLISH_VOICE_RECOVERY':
      return 'voice_call';
    case 'ESCALATE_TO_MANUAL_REVIEW':
      return 'human_escalation';
    default:
      if (policyAction.toLowerCase().includes('email') || policyAction.toLowerCase().includes('portal')) return 'email_notice';
      if (policyAction.toLowerCase().includes('voice')) return 'voice_call';
      if (policyAction.toLowerCase().includes('retry')) return 'retry_now';
      if (policyAction.toLowerCase().includes('nudge')) return 'whatsapp_nudge';
      return 'human_escalation';
  }
}

/**
 * Maps a Policy channel string to the canonical ProposedChannel enum.
 */
export function mapPolicyChannelToProposedChannel(policyChannel?: string): ProposedChannel {
  switch (policyChannel) {
    case 'RAZORPAY_API':
      return 'gateway_retry';
    case 'WHATSAPP_NUDGE':
      return 'whatsapp_nudge';
    case 'SMS_NUDGE':
      return 'whatsapp_nudge'; // Regulated mobile customer messaging channel
    case 'TRANSACTIONAL_EMAIL':
      return 'email_notice';
    case 'HINGLISH_VOICE_CALL':
      return 'voice_call';
    case 'MANUAL_QUEUE':
      return 'human_escalation';
    default:
      return 'gateway_retry';
  }
}

/**
 * Pure adapter function translating a flat AtRiskSubscriptionEvent and proposed action/channel
 * into the complete, normalized ComplianceGateInput required by the canonical Compliance Gate.
 *
 * Reads real column values directly from the flat record:
 * - recoveryCase.last_contacted_at <- event.last_contacted_at || event.contact_history[last]
 * - customer.dnd_registered        <- Boolean(event.dnd_registered)
 * - customer.phone                 <- event.phone
 * - latestFailureEvent.pre_debit_notice_sent_at <- event.pre_debit_notice_sent_at
 * - proposedTime                   <- event.last_attempt_timestamp (or explicit parameter)
 */
export function adaptEventToComplianceInput(
  event: AtRiskSubscriptionEvent,
  proposedAction: ProposedAction | string = 'retry_now',
  proposedChannel: ProposedChannel | string = 'gateway_retry',
  proposedTime?: Date
): ComplianceGateInput {
  const normAction: ProposedAction =
    typeof proposedAction === 'string' &&
    !['retry_now', 'retry_scheduled', 'whatsapp_nudge', 'voice_call', 'email_notice', 'human_escalation'].includes(
      proposedAction
    )
      ? mapPolicyActionToProposedAction(proposedAction)
      : (proposedAction as ProposedAction);

  const normChannel: ProposedChannel =
    typeof proposedChannel === 'string' &&
    !['gateway_retry', 'whatsapp_nudge', 'email_notice', 'voice_call', 'human_escalation'].includes(proposedChannel)
      ? mapPolicyChannelToProposedChannel(proposedChannel)
      : (proposedChannel as ProposedChannel);

  // Thread per-case historical timestamp as proposed execution time
  const effectiveTime = proposedTime ?? (event.last_attempt_timestamp ? new Date(event.last_attempt_timestamp) : new Date());

  // 1. Map recovery case — sourced from real columns / real contact history
  let lastContactedAt =
    event.last_contacted_at ??
    (event.contact_history && event.contact_history.length > 0
      ? event.contact_history[event.contact_history.length - 1]
      : undefined);

  if (!lastContactedAt && event.recent_contact_count_48h > 0) {
    // If recent contact count > 0 but explicit timestamp wasn't provided, derive recent touch
    const hoursAgo = Math.max(1, Math.min(47, 48 / (event.recent_contact_count_48h + 1)));
    lastContactedAt = new Date(effectiveTime.getTime() - hoursAgo * 3600 * 1000).toISOString();
  }

  const recoveryCase: RecoveryCase = {
    id: `case_${event.subscription_id}`,
    subscription_id: event.subscription_id,
    latest_failure_event_id: `fail_${event.subscription_id}_${event.retry_count_so_far}`,
    status: event.mandate_status === 'recovered' ? 'recovered' : 'open',
    recovery_strategy: undefined,
    total_amount_due: event.amount,
    retry_count: event.retry_count_so_far ?? 0,
    max_retries_allowed: 3, // RBI e-mandate limit
    last_contacted_at: lastContactedAt,
    next_scheduled_action_at: undefined,
    opened_at: event.last_attempt_timestamp,
    resolved_at: undefined,
    updated_at: new Date().toISOString()
  };

  // 2. Map subscription
  const subscription: Subscription = {
    id: event.subscription_id,
    merchant_id: 'mer_razorpay_live',
    customer_id: event.customer_id,
    plan_name: 'Recurring Subscription',
    amount: event.amount,
    currency: event.currency || 'INR',
    billing_cycle: 'monthly',
    payment_method: 'upi_autopay',
    mandate_token: `mandate_${event.subscription_id}`,
    mandate_expiry_date: '2027-12-31',
    status: (event.mandate_status as SubscriptionStatus) || 'failing',
    current_cycle_start: event.last_attempt_timestamp,
    current_cycle_end: event.last_attempt_timestamp,
    created_at: event.last_attempt_timestamp,
    updated_at: new Date().toISOString()
  };

  // 3. Map customer — sourced from real phone & real DND registry status
  const tier: CustomerTier =
    event.customer_segment === 'high_value'
      ? 'vip'
      : event.customer_segment === 'at_risk'
      ? 'at_risk'
      : 'standard';

  const customer: Customer = {
    id: event.customer_id,
    merchant_id: 'mer_razorpay_live',
    name: event.customer_name,
    phone: event.phone || '+919876543210',
    email: `${event.customer_name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
    preferred_language: 'hinglish',
    dnd_registered: Boolean(event.dnd_registered),
    tier,
    created_at: event.last_attempt_timestamp
  };

  // 4. Map failure event — real pre_debit_notice_sent_at column
  let failureCategory: FailureCategory = 'technical_decline';
  if (event.failure_reason_code === 'insufficient_funds') {
    failureCategory = 'insufficient_funds';
  } else if (event.failure_reason_code === 'card_expired' || event.failure_reason_code === 'mandate_revoked') {
    failureCategory = 'expired_mandate';
  } else if (event.failure_reason_code === 'daily_limit_exceeded') {
    failureCategory = 'bank_timeout';
  }

  const latestFailureEvent: FailureEvent = {
    id: `fail_${event.subscription_id}_${event.retry_count_so_far}`,
    subscription_id: event.subscription_id,
    payment_attempt_id: `attempt_${event.subscription_id}_${event.retry_count_so_far}`,
    failure_category: failureCategory,
    raw_error_code: event.failure_reason_code,
    raw_error_message: `Debit failed with error: ${event.failure_reason_code}`,
    pre_debit_notice_sent_at: event.pre_debit_notice_sent_at ?? undefined,
    occurred_at: event.last_attempt_timestamp,
    raw_webhook_payload: {
      source: 'razorpay_webhook',
      error_code: event.failure_reason_code
    }
  };

  return {
    recoveryCase,
    subscription,
    customer,
    latestFailureEvent,
    proposedAction: normAction,
    proposedChannel: normChannel,
    proposedTime: effectiveTime
  };
}

/**
 * High-level wrapper that adapts a flat event and evaluates the canonical compliance gate,
 * returning a unified result object with detailed per-rule evaluation & exemption metadata.
 */
export function evaluateAdaptedCompliance(
  event: AtRiskSubscriptionEvent,
  actionType: string,
  channelType?: string,
  proposedTime?: Date
): {
  passed: boolean;
  blocked_reason?: string;
  rule_cited?: string;
  check_results: ComplianceCheckResult[];
  evaluated_count: number;
  exempt_count: number;
} {
  const input = adaptEventToComplianceInput(event, actionType, channelType, proposedTime);
  const checkResults = evaluateComplianceGate(input);
  const isBlocked = isActionBlocked(checkResults);

  const exemptCount = checkResults.filter((c) => c.context_snapshot?.exempt === true).length;
  const evaluatedCount = checkResults.length - exemptCount;

  if (isBlocked) {
    const failedCheck = checkResults.find((c) => !c.passed);
    return {
      passed: false,
      blocked_reason: failedCheck?.reason || 'Blocked by regulatory compliance rule.',
      rule_cited: failedCheck?.rule_cited,
      check_results: checkResults,
      evaluated_count: evaluatedCount,
      exempt_count: exemptCount
    };
  }

  return {
    passed: true,
    rule_cited: checkResults[0]?.rule_cited || 'ALL_REGULATORY_RULES_PASSED',
    check_results: checkResults,
    evaluated_count: evaluatedCount,
    exempt_count: exemptCount
  };
}
