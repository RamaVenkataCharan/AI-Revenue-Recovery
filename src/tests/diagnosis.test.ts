import assert from 'assert';
import { RootCauseClassifier, RootCause } from '../diagnosis/root_cause_classifier';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';

export function testRootCauseClassifier() {
  console.log('--- Running Root Cause Classifier Tests ---');

  const createEvent = (code: string): AtRiskSubscriptionEvent => ({
    subscription_id: `sub_test_${code}`,
    customer_id: 'cust_01',
    customer_name: 'Test Customer',
    amount: 2999,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: code,
    retry_count_so_far: 0,
    last_attempt_timestamp: '2026-08-25T10:00:00Z',
    customer_segment: 'standard',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  });

  const testCases: { code: string; expectedCause: RootCause; expectedRetryable: boolean }[] = [
    { code: 'insufficient_funds', expectedCause: 'retry_later', expectedRetryable: true },
    { code: 'card_expired', expectedCause: 'update_payment_method', expectedRetryable: false },
    { code: 'mandate_revoked', expectedCause: 'requires_new_mandate', expectedRetryable: false },
    { code: 'technical_error', expectedCause: 'retry_immediate', expectedRetryable: true },
    { code: 'daily_limit_exceeded', expectedCause: 'retry_later', expectedRetryable: true },
    { code: 'bank_declined', expectedCause: 'retry_later', expectedRetryable: true },
    { code: 'unknown_glitch_99', expectedCause: 'unknown', expectedRetryable: false }
  ];

  for (const tc of testCases) {
    const diag = RootCauseClassifier.diagnose(createEvent(tc.code));
    assert.strictEqual(diag.root_cause, tc.expectedCause, `Code "${tc.code}" must classify as "${tc.expectedCause}"`);
    assert.strictEqual(diag.is_recoverable_via_mandate_retry, tc.expectedRetryable, `Retryable flag mismatch for "${tc.code}"`);
    assert.ok(diag.explanation.length > 0, `Explanation must not be empty for "${tc.code}"`);
  }

  console.log(`✓ Root Cause Classifier tests passed (${testCases.length}/${testCases.length} decline codes verified).`);
}

if (require.main === module) {
  testRootCauseClassifier();
}
