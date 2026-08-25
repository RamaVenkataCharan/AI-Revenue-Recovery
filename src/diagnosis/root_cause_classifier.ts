import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export type RootCause = 
  | 'retry_later'
  | 'update_payment_method'
  | 'requires_new_mandate'
  | 'retry_immediate'
  | 'unknown';

export interface DiagnosisResult {
  subscription_id: string;
  root_cause: RootCause;
  confidence: number;
  explanation: string;
  is_recoverable_via_mandate_retry: boolean;
}

export class RootCauseClassifier {
  /**
   * Deterministic rule-based root cause classifier for subscription mandate failures.
   */
  public static diagnose(event: AtRiskSubscriptionEvent): DiagnosisResult {
    let rootCause: RootCause = 'unknown';
    let confidence = 1.0;
    let explanation = '';
    let isRecoverableViaRetry = false;

    switch (event.failure_reason_code) {
      case 'insufficient_funds':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Decline due to insufficient funds. Balance typically refreshes on salary cycles or subsequent calendar days. Optimal window is +24h retry.`;
        break;

      case 'card_expired':
        rootCause = 'update_payment_method';
        isRecoverableViaRetry = false;
        explanation = `Underlying payment card has expired. Automated retries against this card token will strictly fail. Customer must update payment details.`;
        break;

      case 'bank_declined':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Issuing bank declined the debit (temporary fraud check or network throttle). Safe to reattempt after cool-off window.`;
        break;

      case 'daily_limit_exceeded':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Customer exceeded per-day transaction or mandate limit. Limit resets midnight; schedule retry for next diurnal cycle.`;
        break;

      case 'mandate_revoked':
        rootCause = 'requires_new_mandate';
        isRecoverableViaRetry = false;
        explanation = `Customer or bank has explicitly cancelled/revoked the e-mandate registration. Automated retries are prohibited by RBI / NPCI rules; new authentication required.`;
        break;

      case 'technical_error':
        rootCause = 'retry_immediate';
        isRecoverableViaRetry = true;
        explanation = `Transient gateway or NPCI switch timeout. Mandate token is healthy; immediate retry has high probability of settlement.`;
        break;

      default:
        rootCause = 'unknown';
        confidence = 0.5;
        isRecoverableViaRetry = false;
        explanation = `Unrecognized failure code '${event.failure_reason_code}'. Requires manual inspection.`;
        break;
    }

    AuditLogger.log({
      event_type: 'DIAGNOSIS',
      subscription_id: event.subscription_id,
      decision: rootCause.toUpperCase(),
      reasoning: `Diagnosed failure_reason_code "${event.failure_reason_code}" as "${rootCause}" with confidence ${confidence}. ${explanation}`,
      action_taken: 'PROCEED_TO_DECISION',
      result: rootCause,
      metadata: {
        failure_reason_code: event.failure_reason_code,
        confidence,
        is_recoverable_via_mandate_retry: isRecoverableViaRetry
      }
    });

    return {
      subscription_id: event.subscription_id,
      root_cause: rootCause,
      confidence,
      explanation,
      is_recoverable_via_mandate_retry: isRecoverableViaRetry
    };
  }
}
