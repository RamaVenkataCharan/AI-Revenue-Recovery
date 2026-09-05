import assert from 'assert';
import { evaluateAdaptedCompliance, adaptEventToComplianceInput } from '../compliance/adapter';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { RevenueRecoveryOrchestrator } from '../agent/orchestrator';

export function runRescheduleLoopTests() {
  console.log('\n--- Running 2-Cycle Reschedule Loop Verification Tests ---');
  let passedCount = 0;

  // Test 1: RBI 24h Pre-Debit Notice Deferral & Resolution Loop
  {
    const initialTime = new Date('2026-08-28T05:30:00.000Z'); // 11:00 AM IST (Daytime)
    const missingNoticeCase: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_loop_notice',
      customer_id: 'cust_loop_1',
      customer_name: 'Tarun Mehra',
      phone: '+919811098765',
      amount: 4999,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'insufficient_funds',
      retry_count_so_far: 0,
      last_attempt_timestamp: initialTime.toISOString(),
      customer_segment: 'standard',
      previous_payment_history: 'on_time',
      dnd_registered: false,
      recent_contact_count_48h: 0,
      pre_debit_notice_sent_at: undefined // Notice never sent initially
    };

    // Cycle 1: Immediate evaluation at failure time
    const cycle1Eval = evaluateAdaptedCompliance(
      missingNoticeCase,
      'RETRY_MANDATE_NOW',
      'GATEWAY_API',
      initialTime
    );

    assert.strictEqual(cycle1Eval.passed, false, 'Cycle 1 must be blocked');
    assert.strictEqual(cycle1Eval.rule_cited, 'RBI_24H_PRE_DEBIT_NOTICE', 'Cycle 1 must cite RBI_24H_PRE_DEBIT_NOTICE');

    // Simulate Orchestrator Rescheduling Action:
    // 1. Pre-debit notice is actively dispatched at initialTime
    // 2. Next retry is scheduled 24.5 hours later
    const noticeDispatchedAt = initialTime.toISOString();
    const cycle2Time = new Date(initialTime.getTime() + 24.5 * 3600 * 1000); // 24.5 hours later (11:30 AM IST next day)

    missingNoticeCase.pre_debit_notice_sent_at = noticeDispatchedAt;
    missingNoticeCase.next_scheduled_action_at = cycle2Time.toISOString();

    // Cycle 2: Re-evaluation at nextActionAt
    const cycle2Eval = evaluateAdaptedCompliance(
      missingNoticeCase,
      'RETRY_MANDATE_NOW',
      'GATEWAY_API',
      cycle2Time
    );

    assert.strictEqual(cycle2Eval.passed, true, 'Cycle 2 must pass after 24.5h notice clearance');
    const noticeCheck = cycle2Eval.check_results.find((c) => c.rule_cited === 'RBI_24H_PRE_DEBIT_NOTICE');
    assert.strictEqual(noticeCheck?.passed, true);
    assert.strictEqual(noticeCheck?.context_snapshot?.hours_elapsed >= 24, true);

    console.log('  [PASS] Test 1: RBI_24H_PRE_DEBIT_NOTICE 2-cycle loop (Block -> Notice Dispatched -> Re-evaluation Passes)');
    passedCount++;
  }

  // Test 2: TRAI DND Channel Redirection & Resolution Loop
  {
    const daytime = new Date('2026-08-28T06:30:00.000Z'); // 12:00 PM IST
    const dndCase: AtRiskSubscriptionEvent = {
      subscription_id: 'sub_test_loop_dnd',
      customer_id: 'cust_loop_2',
      customer_name: 'Kavita Krishnan',
      phone: '+919811012345',
      amount: 12000,
      currency: 'INR',
      mandate_status: 'failed',
      failure_reason_code: 'card_expired',
      retry_count_so_far: 1,
      last_attempt_timestamp: daytime.toISOString(),
      customer_segment: 'high_value',
      previous_payment_history: 'on_time',
      dnd_registered: true, // Registered on National DND Registry
      recent_contact_count_48h: 0
    };

    // Cycle 1: Direct Voice Call Attempt
    const cycle1Eval = evaluateAdaptedCompliance(
      dndCase,
      'HINGLISH_VOICE_RECOVERY',
      'HINGLISH_VOICE_CALL',
      daytime
    );

    assert.strictEqual(cycle1Eval.passed, false, 'Cycle 1 voice call must be blocked on DND');
    assert.strictEqual(cycle1Eval.rule_cited, 'TRAI_DND_CHANNEL_BLOCK');

    // Simulate Orchestrator Channel Redirection Action:
    // Action redirected to transactional billing portal notice via email
    const cycle2Action = 'SEND_BILLING_PORTAL_NOTICE';
    const cycle2Channel = 'TRANSACTIONAL_EMAIL';
    const cycle2Time = new Date(daytime.getTime() + 2 * 3600 * 1000);

    // Cycle 2: Re-evaluation on redirected transactional channel
    const cycle2Eval = evaluateAdaptedCompliance(
      dndCase,
      cycle2Action,
      cycle2Channel,
      cycle2Time
    );

    assert.strictEqual(cycle2Eval.passed, true, 'Cycle 2 must pass on redirected transactional email channel');
    const dndCheck = cycle2Eval.check_results.find((c) => c.rule_cited === 'TRAI_DND_CHANNEL_BLOCK');
    assert.strictEqual(dndCheck?.passed, true);
    assert.strictEqual(dndCheck?.context_snapshot?.exempt, true);

    console.log('  [PASS] Test 2: TRAI_DND_CHANNEL_BLOCK 2-cycle loop (Block -> Redirect to Transactional Email -> Re-evaluation Passes)');
    passedCount++;
  }

  console.log(`\n2-Cycle Reschedule Loop Tests Complete: ${passedCount}/2 passed.`);
}

if (require.main === module) {
  runRescheduleLoopTests();
}
