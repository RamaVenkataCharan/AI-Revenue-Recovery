import assert from 'assert';
import { StoppingRules } from '../decision/stopping_rules';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';

export function testStoppingRules() {
  console.log('--- Running Stopping Rules Tests ---');

  // Test 1: Case already at max retries (3) must be BLOCKED
  const maxRetriedCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_sub_max',
    customer_id: 'cust_01',
    customer_name: 'Test Customer Max',
    amount: 5000,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 3,
    last_attempt_timestamp: '2026-08-20T00:00:00Z',
    customer_segment: 'high_value',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const res1 = StoppingRules.evaluate(maxRetriedCase, 'SCHEDULE_RETRY');
  assert.strictEqual(res1.passed, false, 'Max retries (3) must not pass stopping rules');
  assert.strictEqual(res1.rule_triggered, 'MAX_RETRIES_EXCEEDED');
  assert.strictEqual(res1.recommended_escalation, 'manual_review');

  // Test 2: Revoked mandate must NOT be retried
  const revokedMandateCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_sub_revoked',
    customer_id: 'cust_02',
    customer_name: 'Test Customer Revoked',
    amount: 1999,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'mandate_revoked',
    retry_count_so_far: 0,
    last_attempt_timestamp: '2026-08-20T00:00:00Z',
    customer_segment: 'standard',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const res2 = StoppingRules.evaluate(revokedMandateCase, 'RETRY_NOW');
  assert.strictEqual(res2.passed, false, 'Revoked mandate retry must be blocked');
  assert.strictEqual(res2.rule_triggered, 'REVOKED_MANDATE_BLOCK');

  // Test 3: Fresh case with 0 retries and valid cooldown should PASS
  const validCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_sub_valid',
    customer_id: 'cust_03',
    customer_name: 'Test Customer Valid',
    amount: 2499,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 1,
    last_attempt_timestamp: '2026-08-20T00:00:00Z',
    customer_segment: 'standard',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const res3 = StoppingRules.evaluate(validCase, 'SCHEDULE_RETRY');
  assert.strictEqual(res3.passed, true, 'Valid subscription within retry caps must pass');

  console.log('✓ Stopping rules tests passed (escalation caps & safety blocks verified).');
}

if (require.main === module) {
  testStoppingRules();
}
