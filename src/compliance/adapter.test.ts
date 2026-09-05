import assert from 'assert';
import { adaptEventToComplianceInput, evaluateAdaptedCompliance } from './adapter';
import { evaluateComplianceGate, ComplianceGateInput } from './gate';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';

export function runAdapterTests() {
  console.log('\n--- Running Compliance Adapter Unit Tests ---');
  let passedCount = 0;

  // Test 1: Shape Verification
  {
    const sampleEvent: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_001',
      customer_id: 'cust_001',
      customer_name: 'Ananya Deshmukh',
      phone: '+919811099887',
      amount: 4999,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 1,
      last_attempt_timestamp: '2026-08-28T10:00:00Z',
      customer_segment: 'high_value',
      previous_payment_history: 'on_time',
      dnd_registered: false,
      recent_contact_count_48h: 0,
      contact_history: [],
      pre_debit_notice_sent_at: '2026-08-27T00:00:00Z'
    };

    const adapted = adaptEventToComplianceInput(
      sampleEvent,
      'RETRY_MANDATE_NOW',
      'GATEWAY_API',
      new Date('2026-08-29T10:00:00Z')
    );

    assert.strictEqual(adapted.recoveryCase.id, 'case_sub_test_001');
    assert.strictEqual(adapted.recoveryCase.subscription_id, 'sub_test_001');
    assert.strictEqual(adapted.recoveryCase.retry_count, 1);
    assert.strictEqual(adapted.recoveryCase.max_retries_allowed, 3);
    assert.strictEqual(adapted.recoveryCase.total_amount_due, 4999);

    assert.strictEqual(adapted.subscription.id, 'sub_test_001');
    assert.strictEqual(adapted.subscription.amount, 4999);
    assert.strictEqual(adapted.subscription.currency, 'INR');

    assert.strictEqual(adapted.customer.id, 'cust_001');
    assert.strictEqual(adapted.customer.name, 'Ananya Deshmukh');
    assert.strictEqual(adapted.customer.phone, '+919811099887');
    assert.strictEqual(adapted.customer.dnd_registered, false);
    assert.strictEqual(adapted.customer.tier, 'vip');

    assert.strictEqual(adapted.latestFailureEvent.raw_error_code, 'insufficient_funds');
    assert.strictEqual(adapted.latestFailureEvent.failure_category, 'insufficient_funds');
    assert.strictEqual(adapted.latestFailureEvent.pre_debit_notice_sent_at, '2026-08-27T00:00:00Z');

    assert.strictEqual(adapted.proposedAction, 'retry_now');
    assert.strictEqual(adapted.proposedChannel, 'gateway_retry');

    console.log('  [PASS] Test 1: Adapter produces complete and strictly typed ComplianceGateInput with real columns');
    passedCount++;
  }

  // Test 2: Parity on Max Retries Rule (RBI_MANDATE_MAX_RETRIES_3)
  {
    const eventMaxRetries: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_002',
      customer_id: 'cust_002',
      customer_name: 'Vikram Malhotra',
      amount: 15000,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 3,
      last_attempt_timestamp: '2026-08-28T10:00:00Z',
      customer_segment: 'standard',
      previous_payment_history: 'on_time',
      recent_contact_count_48h: 0,
      pre_debit_notice_sent_at: '2026-08-27T00:00:00Z'
    };

    const testTime = new Date('2026-08-29T06:00:00Z'); // 11:30 AM IST (daytime)
    const adaptedInput = adaptEventToComplianceInput(eventMaxRetries, 'RETRY_MANDATE_NOW', 'GATEWAY_API', testTime);
    const adaptedResults = evaluateComplianceGate(adaptedInput);

    const adaptedRbiCheck = adaptedResults.find((r) => r.rule_cited === 'RBI_MANDATE_MAX_RETRIES_3')!;
    assert.strictEqual(adaptedRbiCheck.passed, false);

    console.log('  [PASS] Test 2: RBI Max Retries blocks retry_count = 3');
    passedCount++;
  }

  // Test 3: Parity on Quiet Hours Rule (TRAI_QUIET_HOURS_2100_0900_IST)
  {
    const eventQuietHours: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_003',
      customer_id: 'cust_003',
      customer_name: 'Pooja Hegde',
      amount: 18000,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 1,
      last_attempt_timestamp: '2026-08-28T17:00:00Z', // 22:30 IST (Night)
      customer_segment: 'high_value',
      previous_payment_history: 'on_time',
      recent_contact_count_48h: 0
    };

    const adaptedEval = evaluateAdaptedCompliance(
      eventQuietHours,
      'HINGLISH_VOICE_RECOVERY',
      'HINGLISH_VOICE_CALL',
      new Date(eventQuietHours.last_attempt_timestamp)
    );

    assert.strictEqual(adaptedEval.passed, false);
    assert.strictEqual(adaptedEval.rule_cited, 'TRAI_QUIET_HOURS_2100_0900_IST');

    console.log('  [PASS] Test 3: TRAI Quiet Hours blocks voice call at 22:30 IST');
    passedCount++;
  }

  // Test 4: Parity on Anti-Harassment Cooldown (MIN_COOLDOWN_48H)
  {
    const eventSpammed: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_004',
      customer_id: 'cust_004',
      customer_name: 'Siddharth Rao',
      amount: 7999,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 1,
      last_attempt_timestamp: '2026-08-28T10:00:00Z',
      customer_segment: 'high_value',
      previous_payment_history: 'on_time',
      recent_contact_count_48h: 3,
      last_contacted_at: '2026-08-28T04:00:00Z' // 6 hours prior to last_attempt_timestamp
    };

    const dayTimeUtc = new Date('2026-08-28T10:00:00Z');
    const adaptedEval = evaluateAdaptedCompliance(
      eventSpammed,
      'SEND_PAYMENT_METHOD_UPDATE_NUDGE',
      'WHATSAPP_NUDGE',
      dayTimeUtc
    );

    assert.strictEqual(adaptedEval.passed, false);
    assert.strictEqual(adaptedEval.rule_cited, 'MIN_COOLDOWN_48H');

    console.log('  [PASS] Test 4: Anti-harassment 48h cooldown blocks outreach with recent contact');
    passedCount++;
  }

  // Test 5: TRAI DND Channel Block (TRAI_DND_CHANNEL_BLOCK)
  {
    const dndCustomerEvent: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_005_dnd',
      customer_id: 'cust_005',
      customer_name: 'Rajesh Sharma',
      phone: '+919811055443',
      amount: 4500,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 1,
      last_attempt_timestamp: '2026-08-28T06:30:00Z', // 12:00 IST (Daytime)
      customer_segment: 'high_value',
      previous_payment_history: 'on_time',
      dnd_registered: true, // Registered on National DND Registry
      recent_contact_count_48h: 0
    };

    const adaptedEval = evaluateAdaptedCompliance(
      dndCustomerEvent,
      'HINGLISH_VOICE_RECOVERY',
      'HINGLISH_VOICE_CALL',
      new Date(dndCustomerEvent.last_attempt_timestamp)
    );

    assert.strictEqual(adaptedEval.passed, false);
    assert.strictEqual(adaptedEval.rule_cited, 'TRAI_DND_CHANNEL_BLOCK');

    console.log('  [PASS] Test 5: TRAI DND blocks direct voice outreach for DND-registered subscriber');
    passedCount++;
  }

  // Test 6: Pre-Debit Notice Timing (RBI_24H_PRE_DEBIT_NOTICE)
  {
    const missingNoticeEvent: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_006_notice',
      customer_id: 'cust_006',
      customer_name: 'Meera Iyer',
      amount: 3200,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 0,
      last_attempt_timestamp: '2026-08-28T06:30:00Z', // 12:00 IST (Daytime)
      customer_segment: 'standard',
      previous_payment_history: 'on_time',
      recent_contact_count_48h: 0,
      pre_debit_notice_sent_at: undefined // Notice never sent
    };

    const adaptedEval = evaluateAdaptedCompliance(
      missingNoticeEvent,
      'RETRY_MANDATE_NOW',
      'GATEWAY_API',
      new Date(missingNoticeEvent.last_attempt_timestamp)
    );

    assert.strictEqual(adaptedEval.passed, false);
    assert.strictEqual(adaptedEval.rule_cited, 'RBI_24H_PRE_DEBIT_NOTICE');

    console.log('  [PASS] Test 6: RBI 24h Pre-Debit Notice blocks debit when notice timestamp is missing');
    passedCount++;
  }

  // Test 7: Fully Compliant Case Passes All Rules
  {
    const compliantEvent: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_007_clean',
      customer_id: 'cust_007',
      customer_name: 'Aarav Sharma',
      amount: 1499,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'technical_error',
      retry_count_so_far: 0,
      last_attempt_timestamp: '2026-08-28T06:30:00Z', // 12:00 PM IST (Active window)
      customer_segment: 'standard',
      previous_payment_history: 'on_time',
      dnd_registered: false,
      recent_contact_count_48h: 0,
      contact_history: [],
      pre_debit_notice_sent_at: '2026-08-27T00:00:00Z' // 30.5 hours prior
    };

    const adaptedEval = evaluateAdaptedCompliance(
      compliantEvent,
      'RETRY_MANDATE_NOW',
      'GATEWAY_API',
      new Date(compliantEvent.last_attempt_timestamp)
    );

    assert.strictEqual(adaptedEval.passed, true);
    assert.strictEqual(adaptedEval.check_results.every((c) => c.passed), true);

    console.log('  [PASS] Test 7: Fully compliant case passes all applicable rules through adapter');
    passedCount++;
  }

  console.log(`\nAdapter Test Suite Complete: ${passedCount}/7 passed.`);
}

if (require.main === module) {
  runAdapterTests();
}
