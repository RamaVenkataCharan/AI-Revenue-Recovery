import assert from 'assert';
import { seedDatabase } from '../db/seed';
import { SubscriptionFailureDetector } from '../detection/subscription_failure_detector';

export function testDetection() {
  console.log('--- Running Detection Tests ---');
  seedDatabase();
  const result = SubscriptionFailureDetector.detect();

  assert.strictEqual(result.total_count, 50, 'Must detect all 50 failed subscriptions');
  assert.ok(result.total_at_risk_amount > 0, 'Total at-risk amount must be > 0');
  assert.strictEqual(result.currency, 'INR');

  // Verify all detected events have failed status
  for (const ev of result.events) {
    assert.strictEqual(ev.mandate_status, 'failed', 'All detected events must have mandate_status = failed');
  }

  console.log('✓ Detection tests passed (50/50 events detected, total at risk computed).');
}

if (require.main === module) {
  testDetection();
}
