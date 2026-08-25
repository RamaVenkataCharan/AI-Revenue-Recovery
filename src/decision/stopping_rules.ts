import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export interface StoppingRuleCheckResult {
  passed: boolean;
  rule_triggered?: 'MAX_RETRIES_EXCEEDED' | 'COOLDOWN_ACTIVE' | 'REVOKED_MANDATE_BLOCK';
  reason: string;
  recommended_escalation?: 'manual_review' | 'wait_for_cooldown' | 'close_case';
}

export class StoppingRules {
  public static readonly MAX_RETRY_ATTEMPTS = 3;
  public static readonly MIN_COOLDOWN_HOURS = 24;

  /**
   * Evaluates hard safety bounds to prevent infinite loops, customer harassment, or invalid retries.
   */
  public static evaluate(
    event: AtRiskSubscriptionEvent, 
    intendedAction: 'RETRY_NOW' | 'SCHEDULE_RETRY' | 'NUDGE' | 'NEW_MANDATE_REQUEST'
  ): StoppingRuleCheckResult {
    // Rule 1: Max 3 retry attempts per subscription, ever
    if (event.retry_count_so_far >= StoppingRules.MAX_RETRY_ATTEMPTS) {
      const reason = `Max retry limit reached (${event.retry_count_so_far}/${StoppingRules.MAX_RETRY_ATTEMPTS}). Escalating to manual finance review to prevent merchant fee waste and customer friction.`;
      
      AuditLogger.log({
        event_type: 'STOPPING_RULE_CHECK',
        subscription_id: event.subscription_id,
        decision: 'BLOCKED_BY_STOPPING_RULE',
        reasoning: reason,
        action_taken: 'ESCALATE_TO_MANUAL_REVIEW',
        result: 'RULE_TRIGGERED_MAX_RETRIES',
        metadata: {
          retry_count_so_far: event.retry_count_so_far,
          max_allowed: StoppingRules.MAX_RETRY_ATTEMPTS
        }
      });

      return {
        passed: false,
        rule_triggered: 'MAX_RETRIES_EXCEEDED',
        reason,
        recommended_escalation: 'manual_review'
      };
    }

    // Rule 2: Mandate revoked cannot be retried
    if (event.failure_reason_code === 'mandate_revoked' && (intendedAction === 'RETRY_NOW' || intendedAction === 'SCHEDULE_RETRY')) {
      const reason = `Mandate token has been explicitly revoked by issuing bank or customer. Automated retry attempt is strictly forbidden under RBI e-mandate rules.`;

      AuditLogger.log({
        event_type: 'STOPPING_RULE_CHECK',
        subscription_id: event.subscription_id,
        decision: 'BLOCKED_BY_STOPPING_RULE',
        reasoning: reason,
        action_taken: 'BLOCK_RETRY',
        result: 'RULE_TRIGGERED_REVOKED_MANDATE',
        metadata: { failure_reason_code: event.failure_reason_code }
      });

      return {
        passed: false,
        rule_triggered: 'REVOKED_MANDATE_BLOCK',
        reason,
        recommended_escalation: 'manual_review'
      };
    }

    // Rule 3: 24h Cooldown enforcement for non-immediate retries
    if (intendedAction === 'RETRY_NOW' && event.failure_reason_code !== 'technical_error') {
      const lastAttempt = new Date(event.last_attempt_timestamp).getTime();
      const now = new Date().getTime();
      const hoursSinceLastAttempt = (now - lastAttempt) / (1000 * 60 * 60);

      if (hoursSinceLastAttempt < StoppingRules.MIN_COOLDOWN_HOURS) {
        const reason = `Cooldown active: Only ${hoursSinceLastAttempt.toFixed(1)}h elapsed since last attempt at ${event.last_attempt_timestamp}. Minimum cooldown is ${StoppingRules.MIN_COOLDOWN_HOURS}h.`;

        AuditLogger.log({
          event_type: 'STOPPING_RULE_CHECK',
          subscription_id: event.subscription_id,
          decision: 'BLOCKED_BY_COOLDOWN',
          reasoning: reason,
          action_taken: 'HOLD_FOR_COOLDOWN',
          result: 'RULE_TRIGGERED_COOLDOWN',
          metadata: {
            hoursSinceLastAttempt,
            minRequiredHours: StoppingRules.MIN_COOLDOWN_HOURS
          }
        });

        return {
          passed: false,
          rule_triggered: 'COOLDOWN_ACTIVE',
          reason,
          recommended_escalation: 'wait_for_cooldown'
        };
      }
    }

    // All stopping rules passed
    AuditLogger.log({
      event_type: 'STOPPING_RULE_CHECK',
      subscription_id: event.subscription_id,
      decision: 'STOPPING_RULES_PASSED',
      reasoning: `Subscription is within safety bounds: retry_count (${event.retry_count_so_far}/${StoppingRules.MAX_RETRY_ATTEMPTS}), mandate token valid, cooldown requirements met.`,
      action_taken: 'ALLOW_PROCEED',
      result: 'PASSED'
    });

    return {
      passed: true,
      reason: 'All stopping rule safety thresholds satisfied.'
    };
  }
}
