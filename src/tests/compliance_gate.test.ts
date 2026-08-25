import assert from 'assert';
import { ComplianceGate } from '../decision/compliance_gate';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';

export function testComplianceGate() {
  console.log('--- Running Compliance Gate Tests ---');

  // Test 1: Excessive contact count (> 2 contacts in 48h) must be BLOCKED
  const spammedCustomerCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_sub_spammed',
    customer_id: 'cust_04',
    customer_name: 'Test Customer Spammed',
    amount: 3999,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'card_expired',
    retry_count_so_far: 1,
    last_attempt_timestamp: '2026-08-22T00:00:00Z',
    customer_segment: 'high_value',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 2 // Hard cap reached
  };

  const res1 = ComplianceGate.evaluate(spammedCustomerCase, 'SEND_PAYMENT_METHOD_UPDATE_NUDGE');
  assert.strictEqual(res1.passed, false, 'Customer with 2+ contacts in 48h must be blocked');
  assert.strictEqual(res1.compliance_rule, 'CONTACT_FREQUENCY_CAP_EXCEEDED');

  // Test 2: Quiet hours (e.g. 23:00 IST) must block customer outreach
  const nightTime = new Date('2026-08-24T17:30:00Z'); // 17:30 UTC = 23:00 IST (Quiet Hours)
  const regularCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_sub_night',
    customer_id: 'cust_05',
    customer_name: 'Test Customer Night',
    amount: 1499,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'card_expired',
    retry_count_so_far: 0,
    last_attempt_timestamp: '2026-08-22T00:00:00Z',
    customer_segment: 'standard',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const res2 = ComplianceGate.evaluate(regularCase, 'SEND_PAYMENT_METHOD_UPDATE_NUDGE', nightTime);
  assert.strictEqual(res2.passed, false, 'Outreach at 23:00 IST must be blocked by quiet hours');
  assert.strictEqual(res2.compliance_rule, 'QUIET_HOURS_DND_VIOLATION');

  // Test 3: Daytime outreach with 0 previous contacts must PASS
  const dayTime = new Date('2026-08-24T06:30:00Z'); // 06:30 UTC = 12:00 IST (Daytime)
  const res3 = ComplianceGate.evaluate(regularCase, 'SEND_PAYMENT_METHOD_UPDATE_NUDGE', dayTime);
  assert.strictEqual(res3.passed, true, 'Daytime outreach with 0 prior contacts must pass compliance');

  console.log('✓ Compliance gate tests passed (anti-harassment & quiet-hours DND verified).');
}

if (require.main === module) {
  testComplianceGate();
}
