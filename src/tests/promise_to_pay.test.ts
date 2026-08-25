import assert from 'assert';
import { getDatabase } from '../db/database';
import { PromiseToPayTracker } from '../tracking/promise_to_pay_tracker';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export function testPromiseToPay() {
  console.log('--- Running Promise-to-Pay State Machine & Cap Enforcement Tests ---');
  const db = getDatabase();

  // Seed dummy subscription
  const testSubId = 'sub_test_ptp_01';
  db.prepare(`
    INSERT OR REPLACE INTO subscriptions (
      subscription_id, customer_id, customer_name, amount, currency,
      mandate_status, failure_reason_code, retry_count_so_far,
      last_attempt_timestamp, customer_segment, previous_payment_history,
      recent_contact_count_48h
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testSubId, 'cust_ptp_01', 'Sunil Gavaskar', 9999, 'INR',
    'failed', 'insufficient_funds', 1,
    '2026-08-23T00:00:00Z', 'high_value', 'on_time', 0
  );

  const event: AtRiskSubscriptionEvent = {
    subscription_id: testSubId,
    customer_id: 'cust_ptp_01',
    customer_name: 'Sunil Gavaskar',
    amount: 9999,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 1,
    last_attempt_timestamp: '2026-08-23T00:00:00Z',
    customer_segment: 'high_value',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  // 1. Create Promise
  const ptp = PromiseToPayTracker.createPromise(event, '2026-08-28');
  assert.strictEqual(ptp.state, 'PROMISED');
  assert.strictEqual(ptp.amount, 9999);
  assert.ok(ptp.id, 'PTP ID must be assigned');

  // 2. Resolve to KEPT test
  const keptResult = PromiseToPayTracker.resolvePromise(ptp.id!, 'KEPT', 'pay_mock_test_123');
  assert.strictEqual(keptResult.status, 'KEPT');
  assert.strictEqual(keptResult.amount_recovered, 9999);

  const subRowAfterKept = db.prepare('SELECT mandate_status FROM subscriptions WHERE subscription_id = ?').get(testSubId) as any;
  assert.strictEqual(subRowAfterKept.mandate_status, 'recovered');

  // 3. Test Broken Promise Retry Cap Enforcement
  const testSubBrokenId = 'sub_test_ptp_broken';
  db.prepare(`
    INSERT OR REPLACE INTO subscriptions (
      subscription_id, customer_id, customer_name, amount, currency,
      mandate_status, failure_reason_code, retry_count_so_far,
      last_attempt_timestamp, customer_segment, previous_payment_history,
      recent_contact_count_48h
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    testSubBrokenId, 'cust_ptp_02', 'Kapil Dev', 5000, 'INR',
    'failed', 'insufficient_funds', 2, // Already at 2 retries
    '2026-08-23T00:00:00Z', 'high_value', 'on_time', 0
  );

  const eventBroken: AtRiskSubscriptionEvent = {
    subscription_id: testSubBrokenId,
    customer_id: 'cust_ptp_02',
    customer_name: 'Kapil Dev',
    amount: 5000,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 2,
    last_attempt_timestamp: '2026-08-23T00:00:00Z',
    customer_segment: 'high_value',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const ptpBroken = PromiseToPayTracker.createPromise(eventBroken, '2026-08-29');
  const brokenResult = PromiseToPayTracker.resolvePromise(ptpBroken.id!, 'BROKEN');

  // Must increment retry_count to 3 and escalate to manual review
  assert.strictEqual(brokenResult.status, 'BROKEN_AND_ESCALATED');

  const subRowAfterBroken = db.prepare('SELECT retry_count_so_far FROM subscriptions WHERE subscription_id = ?').get(testSubBrokenId) as any;
  assert.strictEqual(subRowAfterBroken.retry_count_so_far, 3, 'Broken promise MUST increment retry count to prevent gaming');

  // Verify Audit Log entry exists
  const logs = AuditLogger.getLogsBySubscription(testSubBrokenId);
  const brokenLog = logs.find(l => l.decision === 'PROMISE_TO_PAY_BROKEN');
  assert.ok(brokenLog, 'Broken promise must have an explicit audit trail entry');

  console.log('✓ Promise-to-Pay state machine & stopping-rule penalty tests passed.');
}

if (require.main === module) {
  testPromiseToPay();
}
