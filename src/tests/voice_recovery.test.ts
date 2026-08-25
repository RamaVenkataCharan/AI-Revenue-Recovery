import assert from 'assert';
import { InterventionPolicy } from '../decision/intervention_policy';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { HinglishVoiceAgent } from '../execution/hinglish_voice_agent';

export function testVoiceRecovery() {
  console.log('--- Running Voice Recovery Policy & Script Tests ---');

  // Test 1: High-value customer with retry_count >= 1 on retry_later MUST escalate to voice
  const eligibleHighValueCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_voice_01',
    customer_id: 'cust_v01',
    customer_name: 'Aditya Birla',
    amount: 15000,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 1, // Has 1 prior failure
    last_attempt_timestamp: '2026-08-23T00:00:00Z',
    customer_segment: 'high_value',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const decision1 = InterventionPolicy.decide('retry_later', eligibleHighValueCase);
  assert.strictEqual(decision1.action, 'HINGLISH_VOICE_RECOVERY', 'High value with retry_count>=1 must escalate to voice');
  assert.strictEqual(decision1.is_voice_escalation, true);
  assert.strictEqual(decision1.channel, 'HINGLISH_VOICE_CALL');

  // Test 2: Standard customer with retry_count = 0 on retry_later should NOT trigger voice (passive 24h retry first)
  const standardFreshCase: AtRiskSubscriptionEvent = {
    subscription_id: 'test_voice_02',
    customer_id: 'cust_v02',
    customer_name: 'Rahul Verma',
    amount: 999,
    currency: 'INR',
    mandate_status: 'failed',
    failure_reason_code: 'insufficient_funds',
    retry_count_so_far: 0, // Fresh failure
    last_attempt_timestamp: '2026-08-23T00:00:00Z',
    customer_segment: 'standard',
    previous_payment_history: 'on_time',
    recent_contact_count_48h: 0
  };

  const decision2 = InterventionPolicy.decide('retry_later', standardFreshCase);
  assert.strictEqual(decision2.action, 'SCHEDULE_RETRY_24H', 'Standard fresh case must schedule passive retry first, not voice');
  assert.strictEqual(decision2.is_voice_escalation, false);

  // Test 3: Script generation tone check
  const highValueScript = HinglishVoiceAgent.generateScript(eligibleHighValueCase);
  assert.strictEqual(highValueScript.tone, 'PREMIUM_DEFERENTIAL');
  assert.ok(highValueScript.script.includes('Namaste Aditya ji'), 'Script must code-switch and inject customer name');
  assert.ok(highValueScript.script.includes('₹15,000'), 'Script must include formatted INR amount');

  console.log('✓ Voice recovery policy & dynamic script tests passed.');
}

if (require.main === module) {
  testVoiceRecovery();
}
