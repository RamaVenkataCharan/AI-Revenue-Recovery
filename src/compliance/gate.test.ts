import assert from 'assert';
import {
  evaluateComplianceGate,
  isActionBlocked,
  checkRbiMaxRetries,
  checkTraiQuietHours,
  checkRbiPreDebitNotice,
  checkMinCooldown48h,
  checkTraiDndChannel,
  ComplianceGateInput
} from './gate';
import {
  RecoveryCase,
  Subscription,
  Customer,
  FailureEvent
} from '../db/types';

// Mock fixtures
const baseCustomer: Customer = {
  id: 'cust_test_01',
  merchant_id: 'merch_01',
  name: 'Vikram Sharma',
  phone: '+919876543210',
  email: 'vikram.sharma@example.in',
  preferred_language: 'en',
  dnd_registered: false,
  tier: 'standard',
  created_at: '2026-01-01T00:00:00Z'
};

const baseSubscription: Subscription = {
  id: 'sub_test_01',
  merchant_id: 'merch_01',
  customer_id: 'cust_test_01',
  plan_name: 'Pro Subscription',
  amount: 2999,
  currency: 'INR',
  billing_cycle: 'monthly',
  payment_method: 'upi_autopay',
  mandate_token: 'RPR_SWG_MND_123',
  mandate_expiry_date: '2027-12-31',
  status: 'failing',
  current_cycle_start: '2026-08-01T00:00:00Z',
  current_cycle_end: '2026-08-31T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-08-27T00:00:00Z'
};

const baseFailureEvent: FailureEvent = {
  id: 'fail_test_01',
  subscription_id: 'sub_test_01',
  payment_attempt_id: 'att_test_01',
  failure_category: 'insufficient_funds',
  raw_error_code: 'BAD_REQUEST_INSUFFICIENT_FUNDS',
  raw_error_message: 'Debit declined: Insufficient account balance',
  pre_debit_notice_sent_at: '2026-08-26T00:00:00Z', // 28 hours prior to test action
  occurred_at: '2026-08-27T04:00:00Z'
};

const baseRecoveryCase: RecoveryCase = {
  id: 'case_test_01',
  subscription_id: 'sub_test_01',
  latest_failure_event_id: 'fail_test_01',
  status: 'open',
  recovery_strategy: 'salary_cycle_retry',
  total_amount_due: 2999,
  retry_count: 1,
  max_retries_allowed: 3,
  last_contacted_at: '2026-08-24T00:00:00Z', // 76 hours ago
  opened_at: '2026-08-27T04:00:00Z',
  updated_at: '2026-08-27T04:00:00Z'
};

export function runComplianceGateTests() {
  console.log('=================================================================');
  console.log(' RUNNING COMPLIANCE GATE ENGINE (PHASE 2) UNIT TEST SUITE');
  console.log('=================================================================');

  let passedTests = 0;
  let totalTests = 0;

  function runTest(name: string, fn: () => void) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(err);
      throw err;
    }
  }

  // -------------------------------------------------------------------------
  // RULE 1: RBI_MANDATE_MAX_RETRIES_3
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Rule 1: RBI_MANDATE_MAX_RETRIES_3 ---');

  runTest('Rule 1 PASS: retry_count = 1 with max 3 allowed', () => {
    const res = checkRbiMaxRetries(baseRecoveryCase, 'retry_now', 'gateway_retry');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.rule_cited, 'RBI_MANDATE_MAX_RETRIES_3');
    assert.match(res.reason, /within permissible limits/i);
  });

  runTest('Rule 1 BLOCK: retry_count = 3 (limit reached)', () => {
    const caseAtLimit: RecoveryCase = { ...baseRecoveryCase, retry_count: 3, max_retries_allowed: 3 };
    const res = checkRbiMaxRetries(caseAtLimit, 'retry_now', 'gateway_retry');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'RBI_MANDATE_MAX_RETRIES_3');
    assert.match(res.reason, /Retry count 3 has reached the maximum of 3/);
  });

  runTest('Rule 1 BLOCK: retry_count = 4 (exceeded limit)', () => {
    const caseOverLimit: RecoveryCase = { ...baseRecoveryCase, retry_count: 4, max_retries_allowed: 3 };
    const res = checkRbiMaxRetries(caseOverLimit, 'retry_scheduled', 'gateway_retry');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'RBI_MANDATE_MAX_RETRIES_3');
  });

  runTest('Rule 1 EXEMPT: human_escalation when retry_count = 3', () => {
    const caseAtLimit: RecoveryCase = { ...baseRecoveryCase, retry_count: 3, max_retries_allowed: 3 };
    const res = checkRbiMaxRetries(caseAtLimit, 'human_escalation', 'human_escalation');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.context_snapshot.exempt, true);
  });

  // -------------------------------------------------------------------------
  // RULE 2: TRAI_QUIET_HOURS_2100_0900_IST Boundary & Off-By-One Tests
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Rule 2: TRAI_QUIET_HOURS_2100_0900_IST (Boundary & Diurnal Checks) ---');

  // Boundary conversions:
  // 21:00:00 IST = 15:30:00 UTC (Blocked - exact start of quiet hours)
  // 20:59:59 IST = 15:29:59 UTC (Passed - 1 second before quiet hours)
  // 08:59:59 IST = 03:29:59 UTC (Blocked - 1 second before window opens)
  // 09:00:00 IST = 03:30:00 UTC (Passed - exact start of active window)
  // 14:00:00 IST = 08:30:00 UTC (Passed - midday)
  // 02:00:00 IST = 20:30:00 UTC (Blocked - midnight quiet hours)

  runTest('Rule 2 BLOCK at exact quiet hours start (21:00:00 IST / 15:30:00 UTC)', () => {
    const t = new Date('2026-08-27T15:30:00Z');
    const res = checkTraiQuietHours(t, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'TRAI_QUIET_HOURS_2100_0900_IST');
    assert.match(res.reason, /21:00:00 IST/);
  });

  runTest('Rule 2 PASS at 1 minute before quiet hours (20:59:00 IST / 15:29:00 UTC)', () => {
    const t = new Date('2026-08-27T15:29:00Z');
    const res = checkTraiQuietHours(t, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, true);
    assert.match(res.reason, /permitted active operating hours/);
  });

  runTest('Rule 2 BLOCK at 1 minute before active window opens (08:59:00 IST / 03:29:00 UTC)', () => {
    const t = new Date('2026-08-27T03:29:00Z');
    const res = checkTraiQuietHours(t, 'voice_call', 'voice_call');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'TRAI_QUIET_HOURS_2100_0900_IST');
    assert.match(res.reason, /08:59:00 IST/);
  });

  runTest('Rule 2 PASS at exact active window opening (09:00:00 IST / 03:30:00 UTC)', () => {
    const t = new Date('2026-08-27T03:30:00Z');
    const res = checkTraiQuietHours(t, 'voice_call', 'voice_call');
    assert.strictEqual(res.passed, true);
    assert.match(res.reason, /09:00:00 IST/);
  });

  runTest('Rule 2 PASS at midday active hours (14:30:00 IST / 09:00:00 UTC)', () => {
    const t = new Date('2026-08-27T09:00:00Z');
    const res = checkTraiQuietHours(t, 'email_notice', 'email_notice');
    assert.strictEqual(res.passed, true);
  });

  runTest('Rule 2 BLOCK in middle of night (02:00:00 IST / 20:30:00 UTC prev day)', () => {
    const t = new Date('2026-08-26T20:30:00Z');
    const res = checkTraiQuietHours(t, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'TRAI_QUIET_HOURS_2100_0900_IST');
  });

  runTest('Rule 2 EXEMPT: human_escalation passes quiet-hours regardless of time (e.g. 23:00 IST)', () => {
    const t = new Date('2026-08-27T17:30:00Z'); // 23:00 IST (Night)
    const res = checkTraiQuietHours(t, 'human_escalation', 'human_escalation');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.rule_cited, 'TRAI_QUIET_HOURS_2100_0900_IST');
    assert.strictEqual(res.context_snapshot.exempt, true);
  });

  // -------------------------------------------------------------------------
  // RULE 3: RBI_24H_PRE_DEBIT_NOTICE
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Rule 3: RBI_24H_PRE_DEBIT_NOTICE ---');

  runTest('Rule 3 PASS: Notice sent 28 hours prior to debit retry', () => {
    const proposedTime = new Date('2026-08-27T04:00:00Z');
    const failureEvent: FailureEvent = {
      ...baseFailureEvent,
      pre_debit_notice_sent_at: '2026-08-26T00:00:00Z' // 28h prior
    };
    const res = checkRbiPreDebitNotice(failureEvent, proposedTime, 'retry_now', 'gateway_retry');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.rule_cited, 'RBI_24H_PRE_DEBIT_NOTICE');
    assert.match(res.reason, /28\.0 hours prior/);
  });

  runTest('Rule 3 BLOCK: Notice missing (null/undefined)', () => {
    const proposedTime = new Date('2026-08-27T04:00:00Z');
    const failureEvent: FailureEvent = {
      ...baseFailureEvent,
      pre_debit_notice_sent_at: undefined
    };
    const res = checkRbiPreDebitNotice(failureEvent, proposedTime, 'retry_now', 'gateway_retry');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'RBI_24H_PRE_DEBIT_NOTICE');
    assert.match(res.reason, /pre-debit notice has not been sent/i);
  });

  runTest('Rule 3 BLOCK: Notice sent only 8 hours prior (< 24h requirement)', () => {
    const proposedTime = new Date('2026-08-27T10:00:00Z');
    const failureEvent: FailureEvent = {
      ...baseFailureEvent,
      pre_debit_notice_sent_at: '2026-08-27T02:00:00Z' // 8h prior
    };
    const res = checkRbiPreDebitNotice(failureEvent, proposedTime, 'retry_scheduled', 'gateway_retry');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'RBI_24H_PRE_DEBIT_NOTICE');
    assert.match(res.reason, /only 8\.0 hours before/);
  });

  runTest('Rule 3 EXEMPT: whatsapp_nudge does not require 24h pre-debit notice', () => {
    const proposedTime = new Date('2026-08-27T10:00:00Z');
    const failureEvent: FailureEvent = {
      ...baseFailureEvent,
      pre_debit_notice_sent_at: undefined
    };
    const res = checkRbiPreDebitNotice(failureEvent, proposedTime, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.context_snapshot.exempt, true);
  });

  // -------------------------------------------------------------------------
  // RULE 4: MIN_COOLDOWN_48H
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Rule 4: MIN_COOLDOWN_48H ---');

  runTest('Rule 4 PASS: Never contacted before (last_contacted_at is null)', () => {
    const proposedTime = new Date('2026-08-27T05:00:00Z');
    const freshCase: RecoveryCase = { ...baseRecoveryCase, last_contacted_at: undefined };
    const res = checkMinCooldown48h(freshCase, proposedTime, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.rule_cited, 'MIN_COOLDOWN_48H');
    assert.match(res.reason, /has not been contacted previously/);
  });

  runTest('Rule 4 PASS: Contacted 72 hours ago (> 48h cooldown)', () => {
    const proposedTime = new Date('2026-08-27T05:00:00Z');
    const cooledCase: RecoveryCase = {
      ...baseRecoveryCase,
      last_contacted_at: '2026-08-24T05:00:00Z' // exactly 72h ago
    };
    const res = checkMinCooldown48h(cooledCase, proposedTime, 'voice_call', 'voice_call');
    assert.strictEqual(res.passed, true);
    assert.match(res.reason, /72\.0 hours ago/);
  });

  runTest('Rule 4 BLOCK: Contacted 14 hours ago (< 48h cooldown)', () => {
    const proposedTime = new Date('2026-08-27T05:00:00Z');
    const recentCase: RecoveryCase = {
      ...baseRecoveryCase,
      last_contacted_at: '2026-08-26T15:00:00Z' // 14h ago
    };
    const res = checkMinCooldown48h(recentCase, proposedTime, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'MIN_COOLDOWN_48H');
    assert.match(res.reason, /contacted 14\.0 hours ago/);
  });

  runTest('Rule 4 EXEMPT: gateway_retry is backend debit, not direct customer ping', () => {
    const proposedTime = new Date('2026-08-27T05:00:00Z');
    const recentCase: RecoveryCase = {
      ...baseRecoveryCase,
      last_contacted_at: '2026-08-27T01:00:00Z' // 4h ago
    };
    const res = checkMinCooldown48h(recentCase, proposedTime, 'retry_now', 'gateway_retry');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.context_snapshot.exempt, true);
  });

  // -------------------------------------------------------------------------
  // RULE 5: TRAI_DND_CHANNEL_BLOCK & Independence from Quiet Hours
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Rule 5: TRAI_DND_CHANNEL_BLOCK & Regulatory Independence ---');

  runTest('Rule 5 BLOCK: Customer registered on DND for WhatsApp nudge', () => {
    const dndCustomer: Customer = { ...baseCustomer, dnd_registered: true };
    const res = checkTraiDndChannel(dndCustomer, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'TRAI_DND_CHANNEL_BLOCK');
    assert.match(res.reason, /registered on the National DND Registry/);
  });

  runTest('Rule 5 BLOCK: Customer registered on DND for Voice Call', () => {
    const dndCustomer: Customer = { ...baseCustomer, dnd_registered: true };
    const res = checkTraiDndChannel(dndCustomer, 'voice_call', 'voice_call');
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.rule_cited, 'TRAI_DND_CHANNEL_BLOCK');
  });

  runTest('Rule 5 PASS: Non-DND customer for WhatsApp nudge', () => {
    const nonDndCustomer: Customer = { ...baseCustomer, dnd_registered: false };
    const res = checkTraiDndChannel(nonDndCustomer, 'whatsapp_nudge', 'whatsapp_nudge');
    assert.strictEqual(res.passed, true);
  });

  runTest('Rule 5 EXEMPT: DND customer for transactional email_notice', () => {
    const dndCustomer: Customer = { ...baseCustomer, dnd_registered: true };
    const res = checkTraiDndChannel(dndCustomer, 'email_notice', 'email_notice');
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.context_snapshot.exempt, true);
  });

  runTest('Regulatory Independence Test A: DND registered during daytime (14:00 IST)', () => {
    // DND should BLOCK WhatsApp, but Quiet Hours should PASS
    const input: ComplianceGateInput = {
      recoveryCase: baseRecoveryCase,
      subscription: baseSubscription,
      customer: { ...baseCustomer, dnd_registered: true },
      latestFailureEvent: baseFailureEvent,
      proposedAction: 'whatsapp_nudge',
      proposedChannel: 'whatsapp_nudge',
      proposedTime: new Date('2026-08-27T08:30:00Z') // 14:00 IST (Daytime)
    };

    const results = evaluateComplianceGate(input);
    const dndResult = results.find((r) => r.rule_cited === 'TRAI_DND_CHANNEL_BLOCK');
    const quietHoursResult = results.find((r) => r.rule_cited === 'TRAI_QUIET_HOURS_2100_0900_IST');

    assert(dndResult, 'DND rule must be evaluated');
    assert(quietHoursResult, 'Quiet hours rule must be evaluated');
    assert.strictEqual(dndResult.passed, false, 'DND must block WhatsApp even at 14:00 IST');
    assert.strictEqual(quietHoursResult.passed, true, 'Quiet hours must pass at 14:00 IST');
    assert.strictEqual(isActionBlocked(results), true);
  });

  runTest('Regulatory Independence Test B: Non-DND customer during quiet hours (23:00 IST)', () => {
    // DND should PASS, but Quiet Hours should BLOCK
    const input: ComplianceGateInput = {
      recoveryCase: baseRecoveryCase,
      subscription: baseSubscription,
      customer: { ...baseCustomer, dnd_registered: false },
      latestFailureEvent: baseFailureEvent,
      proposedAction: 'whatsapp_nudge',
      proposedChannel: 'whatsapp_nudge',
      proposedTime: new Date('2026-08-27T17:30:00Z') // 23:00 IST (Quiet Hours)
    };

    const results = evaluateComplianceGate(input);
    const dndResult = results.find((r) => r.rule_cited === 'TRAI_DND_CHANNEL_BLOCK');
    const quietHoursResult = results.find((r) => r.rule_cited === 'TRAI_QUIET_HOURS_2100_0900_IST');

    assert.strictEqual(dndResult?.passed, true, 'Non-DND customer passes DND check');
    assert.strictEqual(quietHoursResult?.passed, false, 'Quiet hours blocks outreach at 23:00 IST');
    assert.strictEqual(isActionBlocked(results), true);
  });

  // -------------------------------------------------------------------------
  // INTEGRATED / COMBINED SCENARIOS
  // -------------------------------------------------------------------------
  console.log('\n--- Testing Combined Scenarios (Full Gate Evaluation) ---');

  runTest('Combined Scenario: FULLY COMPLIANT retry_now (All rules pass)', () => {
    const input: ComplianceGateInput = {
      recoveryCase: { ...baseRecoveryCase, retry_count: 1, max_retries_allowed: 3 },
      subscription: baseSubscription,
      customer: baseCustomer,
      latestFailureEvent: {
        ...baseFailureEvent,
        pre_debit_notice_sent_at: '2026-08-26T00:00:00Z' // 32 hours before 08:00 UTC / 13:30 IST
      },
      proposedAction: 'retry_now',
      proposedChannel: 'gateway_retry',
      proposedTime: new Date('2026-08-27T08:00:00Z') // 13:30 IST (Active hours)
    };

    const results = evaluateComplianceGate(input);
    assert.strictEqual(results.length, 3, 'All 3 relevant rules evaluated');
    assert(results.every((r) => r.passed), 'Every rule must pass');
    assert.strictEqual(isActionBlocked(results), false, 'Action is NOT blocked');
  });

  runTest('Combined Scenario: MULTI-FAILURE (3 rules fail simultaneously on one action)', () => {
    // Action: WhatsApp nudge at 22:30 IST, customer on DND, contacted 6 hours ago
    const input: ComplianceGateInput = {
      recoveryCase: {
        ...baseRecoveryCase,
        last_contacted_at: '2026-08-27T11:00:00Z' // 6h before proposed time
      },
      subscription: baseSubscription,
      customer: { ...baseCustomer, dnd_registered: true },
      latestFailureEvent: baseFailureEvent,
      proposedAction: 'whatsapp_nudge',
      proposedChannel: 'whatsapp_nudge',
      proposedTime: new Date('2026-08-27T17:00:00Z') // 22:30 IST (Quiet hours)
    };

    const results = evaluateComplianceGate(input);
    const failedRules = results.filter((r) => !r.passed);

    assert.strictEqual(failedRules.length, 3, 'Must capture exactly 3 simultaneous violations');
    const failedRuleNames = failedRules.map((r) => r.rule_cited);
    assert(failedRuleNames.includes('TRAI_QUIET_HOURS_2100_0900_IST'));
    assert(failedRuleNames.includes('MIN_COOLDOWN_48H'));
    assert(failedRuleNames.includes('TRAI_DND_CHANNEL_BLOCK'));
    assert.strictEqual(isActionBlocked(results), true);
  });

  console.log('\n=================================================================');
  console.log(` ALL ${passedTests}/${totalTests} COMPLIANCE GATE UNIT TESTS PASSED SUCCESSFULLY!`);
  console.log('=================================================================\n');
}

if (require.main === module) {
  runComplianceGateTests();
}
