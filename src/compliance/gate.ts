/**
 * @module Regulatory Compliance Gate — Canonical Engine
 *
 * Enforces all RBI and TRAI regulatory directives:
 * 1. RBI Mandate Max Retries (RBI/2020-21/74 §5.2) — Max 3 automated retries
 * 2. TRAI Quiet Hours & DND (TRAI Telecom Commercial Communications Customer Preference Regs §12) — 21:00 to 09:00 IST
 * 3. RBI 24-Hour Pre-Debit Notification (RBI/2020-21/74 §3.1)
 * 4. Anti-Harassment Min Cooldown 48h (RBI Fair Practices Code §4.3) — Max 2 contacts in 48h
 * 5. TRAI DND Channel Blocking — Strictly blocks promotional/commercial channel pushes
 */
import {
  RecoveryCase,
  Subscription,
  Customer,
  FailureEvent
} from '../db/types';

export type ProposedAction =
  | 'retry_now'
  | 'retry_scheduled'
  | 'whatsapp_nudge'
  | 'voice_call'
  | 'email_notice'
  | 'human_escalation';

export type ProposedChannel =
  | 'gateway_retry'
  | 'whatsapp_nudge'
  | 'email_notice'
  | 'voice_call'
  | 'human_escalation';

export interface ComplianceGateInput {
  recoveryCase: RecoveryCase;
  subscription: Subscription;
  customer: Customer;
  latestFailureEvent: FailureEvent;
  proposedAction: ProposedAction;
  proposedChannel: ProposedChannel;
  proposedTime: Date;
}

export interface ComplianceCheckResult {
  passed: boolean;
  rule_cited: string;
  reason: string;
  context_snapshot: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Pure Rule Evaluation Functions
// ---------------------------------------------------------------------------

/**
 * 1. RBI_MANDATE_MAX_RETRIES_3
 * Blocks automated retry actions if retry_count >= max_retries_allowed (default 3).
 * Human escalation actions are exempt.
 */
export function checkRbiMaxRetries(
  recoveryCase: RecoveryCase,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isAutomatedRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  const maxAllowed = recoveryCase.max_retries_allowed ?? 3;
  const currentRetries = recoveryCase.retry_count ?? 0;

  if (!isAutomatedRetry) {
    return {
      passed: true,
      rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
      reason: `Action "${proposedAction}" is not an automated debit retry; RBI retry limit does not apply.`,
      context_snapshot: {
        retry_count: currentRetries,
        max_retries_allowed: maxAllowed,
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  if (currentRetries >= maxAllowed) {
    return {
      passed: false,
      rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
      reason: `Retry count ${currentRetries} has reached the maximum of ${maxAllowed} allowed under RBI e-mandate guidelines for subscription ${recoveryCase.subscription_id}.`,
      context_snapshot: {
        retry_count: currentRetries,
        max_retries_allowed: maxAllowed,
        subscription_id: recoveryCase.subscription_id,
        case_id: recoveryCase.id
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
    reason: `Retry count (${currentRetries}/${maxAllowed}) is within permissible limits under RBI e-mandate regulations.`,
    context_snapshot: {
      retry_count: currentRetries,
      max_retries_allowed: maxAllowed,
      subscription_id: recoveryCase.subscription_id
    }
  };
}

/**
 * 2. TRAI_QUIET_HOURS_2100_0900_IST
 * Blocks any customer-facing action or automated debit between 21:00 and 09:00 IST.
 * IST is UTC+5:30. Evaluated strictly without relying on pre-computed flags.
 */
export function checkTraiQuietHours(
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isHumanEscalation =
    proposedAction === 'human_escalation' ||
    proposedChannel === 'human_escalation';

  if (isHumanEscalation) {
    return {
      passed: true,
      rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
      reason: `Action "${proposedAction}" is an internal handoff to a human agent, not direct customer communication; TRAI quiet hours do not apply.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  // IST offset: UTC + 5h 30m
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(proposedTime.getTime() + istOffsetMs);

  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();
  const istSeconds = istDate.getUTCSeconds();
  const timeInMinutes = istHours * 60 + istMinutes;

  const formattedIstTime = `${String(istHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}:${String(istSeconds).padStart(2, '0')} IST`;

  // Quiet hours: [21:00, 09:00) IST
  // 21:00 = 1260 min, 09:00 = 540 min
  const isQuietHours = timeInMinutes >= 1260 || timeInMinutes < 540;

  if (isQuietHours) {
    return {
      passed: false,
      rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
      reason: `Proposed execution time ${formattedIstTime} falls inside TRAI/RBI mandatory quiet hours (21:00 – 09:00 IST). Customer communication and automated retries are prohibited during this period.`,
      context_snapshot: {
        proposed_utc_time: proposedTime.toISOString(),
        calculated_ist_time: formattedIstTime,
        ist_hours: istHours,
        ist_minutes: istMinutes,
        quiet_hours_window: '21:00 – 09:00 IST'
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
    reason: `Proposed execution time ${formattedIstTime} is within permitted active operating hours (09:00 – 21:00 IST).`,
    context_snapshot: {
      proposed_utc_time: proposedTime.toISOString(),
      calculated_ist_time: formattedIstTime,
      ist_hours: istHours,
      ist_minutes: istMinutes
    }
  };
}

/**
 * 3. RBI_24H_PRE_DEBIT_NOTICE
 * Blocks gateway_retry if failure_events.pre_debit_notice_sent_at is null
 * or less than 24 hours before proposed retry time.
 */
export function checkRbiPreDebitNotice(
  latestFailureEvent: FailureEvent,
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isDebitRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  if (!isDebitRetry) {
    return {
      passed: true,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Action "${proposedAction}" is not an autopay debit; 24-hour pre-debit notice requirement is not applicable.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  const noticeSentAtStr = latestFailureEvent.pre_debit_notice_sent_at;

  if (!noticeSentAtStr) {
    return {
      passed: false,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Mandatory pre-debit notice has not been sent for subscription ${latestFailureEvent.subscription_id}. RBI circular on e-mandates requires at least 24 hours prior intimation to the customer before debit.`,
      context_snapshot: {
        subscription_id: latestFailureEvent.subscription_id,
        failure_event_id: latestFailureEvent.id,
        pre_debit_notice_sent_at: null
      }
    };
  }

  const noticeSentAt = new Date(noticeSentAtStr);
  const diffHours = (proposedTime.getTime() - noticeSentAt.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return {
      passed: false,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Pre-debit notice was sent only ${diffHours.toFixed(1)} hours before proposed debit time (${noticeSentAt.toISOString()}). RBI rules mandate a strict minimum 24-hour notice window.`,
      context_snapshot: {
        subscription_id: latestFailureEvent.subscription_id,
        pre_debit_notice_sent_at: noticeSentAtStr,
        proposed_time: proposedTime.toISOString(),
        hours_elapsed: Number(diffHours.toFixed(2)),
        required_hours: 24
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
    reason: `Pre-debit notice was sent ${diffHours.toFixed(1)} hours prior to scheduled debit, satisfying the mandatory 24-hour notice requirement.`,
    context_snapshot: {
      subscription_id: latestFailureEvent.subscription_id,
      pre_debit_notice_sent_at: noticeSentAtStr,
      proposed_time: proposedTime.toISOString(),
      hours_elapsed: Number(diffHours.toFixed(2)),
      required_hours: 24
    }
  };
}

/**
 * 4. MIN_COOLDOWN_48H
 * Blocks customer-facing outreach if recovery_cases.last_contacted_at is within 48h.
 * If last_contacted_at is null, this rule passes.
 */
export function checkMinCooldown48h(
  recoveryCase: RecoveryCase,
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isCustomerFacing =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedAction === 'email_notice' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call' ||
    proposedChannel === 'email_notice';

  if (!isCustomerFacing) {
    return {
      passed: true,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Action "${proposedAction}" is not direct customer outreach; 48-hour customer cooldown does not apply.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  const lastContactStr = recoveryCase.last_contacted_at;

  if (!lastContactStr) {
    return {
      passed: true,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Customer has not been contacted previously for recovery case ${recoveryCase.id}; 48-hour cooldown is fully satisfied.`,
      context_snapshot: {
        last_contacted_at: null,
        case_id: recoveryCase.id
      }
    };
  }

  const lastContactDate = new Date(lastContactStr);
  const diffHours = (proposedTime.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60);

  if (diffHours >= 0 && diffHours < 48) {
    return {
      passed: false,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Customer was contacted ${diffHours.toFixed(1)} hours ago (${lastContactDate.toISOString()}). Anti-harassment policy enforces a mandatory 48-hour cooldown between outreach attempts.`,
      context_snapshot: {
        case_id: recoveryCase.id,
        last_contacted_at: lastContactStr,
        proposed_time: proposedTime.toISOString(),
        hours_since_last_contact: Number(diffHours.toFixed(2)),
        required_cooldown_hours: 48
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'MIN_COOLDOWN_48H',
    reason: `Last contact was ${diffHours.toFixed(1)} hours ago, satisfying the minimum 48-hour cooldown threshold.`,
    context_snapshot: {
      case_id: recoveryCase.id,
      last_contacted_at: lastContactStr,
      proposed_time: proposedTime.toISOString(),
      hours_since_last_contact: Number(diffHours.toFixed(2)),
      required_cooldown_hours: 48
    }
  };
}

/**
 * 5. TRAI_DND_CHANNEL_BLOCK
 * Blocks whatsapp_nudge and voice_call specifically (not gateway_retry, not email_notice)
 * if customer.dnd_registered is true.
 *
 * NOTE ON REGULATORY INDEPENDENCE:
 * TRAI DND governs CHANNEL ELIGIBILITY and consent (whether telemarketing / direct telephony
 * channels are legally permitted for this subscriber).
 * TRAI Quiet Hours governs DIURNAL TIMING (restricting contact hours regardless of DND status).
 * These two checks address distinct legal requirements and must remain independent.
 */
export function checkTraiDndChannel(
  customer: Customer,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isRestrictedDndChannel =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call';

  if (!isRestrictedDndChannel) {
    return {
      passed: true,
      rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
      reason: `Channel "${proposedChannel}" (${proposedAction}) is exempt from TRAI DND telemarketing restrictions (e.g. transactional email or backend retry).`,
      context_snapshot: {
        customer_id: customer.id,
        dnd_registered: customer.dnd_registered,
        proposedChannel,
        proposedAction,
        exempt: true
      }
    };
  }

  if (customer.dnd_registered) {
    return {
      passed: false,
      rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
      reason: `Customer ${customer.name} (${customer.phone}) is registered on the National DND Registry. Direct voice calls and promotional WhatsApp messages are prohibited under TRAI regulations.`,
      context_snapshot: {
        customer_id: customer.id,
        customer_name: customer.name,
        phone: customer.phone,
        dnd_registered: true,
        channel_blocked: proposedChannel
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
    reason: `Customer ${customer.name} is not registered on TRAI DND; channel "${proposedChannel}" is permitted for recovery outreach.`,
    context_snapshot: {
      customer_id: customer.id,
      customer_name: customer.name,
      dnd_registered: false,
      channel_allowed: proposedChannel
    }
  };
}

// ---------------------------------------------------------------------------
// Main Compliance Gate Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluates a proposed recovery action against all applicable regulatory rules.
 * Runs every relevant rule and returns a full array of check results for an exhaustive audit trail.
 */
export function evaluateComplianceGate(input: ComplianceGateInput): ComplianceCheckResult[] {
  const {
    recoveryCase,
    customer,
    latestFailureEvent,
    proposedAction,
    proposedChannel,
    proposedTime
  } = input;

  const results: ComplianceCheckResult[] = [];

  // Determine action category
  const isDebitRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  const isCustomerOutreach =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedAction === 'email_notice' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call' ||
    proposedChannel === 'email_notice';

  // Rule 1: RBI Max Retries (Applies to all actions; non-retries evaluate as exempt/passed)
  results.push(checkRbiMaxRetries(recoveryCase, proposedAction, proposedChannel));

  // Rule 2: TRAI Quiet Hours 21:00 - 09:00 IST (Applies to customer outreach and automated retries)
  results.push(checkTraiQuietHours(proposedTime, proposedAction, proposedChannel));

  // Rule 3: RBI 24h Pre-Debit Notice (Applies to debit retries; others evaluate as exempt/passed)
  if (isDebitRetry) {
    results.push(checkRbiPreDebitNotice(latestFailureEvent, proposedTime, proposedAction, proposedChannel));
  }

  // Rule 4: Min Cooldown 48h (Applies to direct customer outreach)
  if (isCustomerOutreach) {
    results.push(checkMinCooldown48h(recoveryCase, proposedTime, proposedAction, proposedChannel));
  }

  // Rule 5: TRAI DND Channel Block (Applies to WhatsApp / Voice)
  if (isCustomerOutreach) {
    results.push(checkTraiDndChannel(customer, proposedAction, proposedChannel));
  }

  return results;
}

/**
 * Returns true if ANY applicable rule produced a blocked/failed verdict.
 */
export function isActionBlocked(results: ComplianceCheckResult[]): boolean {
  return results.some((r) => !r.passed);
}
