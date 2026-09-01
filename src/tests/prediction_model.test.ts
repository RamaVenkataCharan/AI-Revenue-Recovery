import assert from 'assert';
import { ModelPredictor } from '../prediction/model_predictor';

export function runPredictionModelTests() {
  console.log('\n--- Running AI Model Predictor Unit Test Suite ---');

  // Test 1: Transient Technical Error
  const res1 = ModelPredictor.predict({
    amount: 5000,
    failure_reason_code: 'technical_error',
    payment_method: 'upi_autopay',
    customer_segment: 'standard',
    retry_count_so_far: 0,
    time_of_debit_ist_hour: 11
  });
  assert.strictEqual(res1.root_cause, 'retry_immediate');
  assert.ok(res1.channel_probabilities.gateway_retry_pct >= 80, 'Gateway probability should be >= 80% for technical glitch');
  assert.ok(res1.overall_recovery_probability_pct >= 75, 'Overall recovery probability should be >= 75%');
  assert.strictEqual(res1.recommended_action, 'RETRY_MANDATE_NOW');
  assert.ok(res1.compliance_pre_flight.all_passed, 'Should pass all compliance checks during day');
  console.log('  ✓ [PASS] Test 1: Transient technical_error yields high gateway probability (>=80%) and RETRY_MANDATE_NOW');

  // Test 2: Hard Authentication Failure (card_expired)
  const res2 = ModelPredictor.predict({
    amount: 12500,
    failure_reason_code: 'card_expired',
    payment_method: 'card_mandate',
    customer_segment: 'high_value',
    retry_count_so_far: 0,
    time_of_debit_ist_hour: 14
  });
  assert.strictEqual(res2.root_cause, 'update_payment_method');
  assert.strictEqual(res2.channel_probabilities.gateway_retry_pct, 0, 'Gateway probability must be 0% for expired card');
  assert.ok(res2.channel_probabilities.whatsapp_nudge_pct >= 50, 'WhatsApp payment update nudge probability should be high');
  assert.strictEqual(res2.recommended_action, 'SEND_PAYMENT_METHOD_UPDATE_NUDGE');
  console.log('  ✓ [PASS] Test 2: Card expired sets gateway probability strictly to 0% and routes to update nudge');

  // Test 3: Mandate Revoked
  const res3 = ModelPredictor.predict({
    amount: 2500,
    failure_reason_code: 'mandate_revoked',
    payment_method: 'upi_autopay',
    customer_segment: 'standard',
    retry_count_so_far: 0
  });
  assert.strictEqual(res3.root_cause, 'requires_new_mandate');
  assert.strictEqual(res3.channel_probabilities.gateway_retry_pct, 0, 'Gateway probability must be 0% for revoked mandate');
  assert.strictEqual(res3.recommended_action, 'REQUEST_NEW_MANDATE');
  console.log('  ✓ [PASS] Test 3: Mandate revoked sets gateway retry to 0% and requests new mandate');

  // Test 4: High Value Voice Escalation
  const res4 = ModelPredictor.predict({
    amount: 32000,
    customer_name: 'Kiran Mazumdar',
    failure_reason_code: 'daily_limit_exceeded',
    payment_method: 'upi_autopay',
    customer_segment: 'high_value',
    retry_count_so_far: 1,
    time_of_debit_ist_hour: 14
  });
  assert.strictEqual(res4.recommended_action, 'HINGLISH_VOICE_RECOVERY');
  assert.strictEqual(res4.recommended_channel, 'HINGLISH_VOICE_CALL');
  assert.strictEqual(res4.voice_script_preview.tone, 'PREMIUM_DEFERENTIAL');
  assert.ok(res4.channel_probabilities.voice_outreach_pct >= 70, 'Voice probability should be >= 70% for VIP outreach');
  console.log('  ✓ [PASS] Test 4: High-value account with prior attempt escalates to Hinglish Voice with premium tone');

  // Test 5: RBI 3-Retry Cap
  const res5 = ModelPredictor.predict({
    amount: 4999,
    failure_reason_code: 'bank_declined',
    retry_count_so_far: 3,
    time_of_debit_ist_hour: 14
  });
  assert.strictEqual(res5.compliance_pre_flight.rbi_max_retries.passed, false, 'Should fail RBI max retry check');
  assert.strictEqual(res5.compliance_pre_flight.all_passed, false, 'all_passed must be false when retry limit reached');
  console.log('  ✓ [PASS] Test 5: RBI Max Retries rule triggers statutory block when retries >= 3');

  // Test 6: TRAI Quiet Hours
  const res6Night = ModelPredictor.predict({
    amount: 1500,
    failure_reason_code: 'insufficient_funds',
    time_of_debit_ist_hour: 23
  });
  assert.strictEqual(res6Night.compliance_pre_flight.trai_quiet_hours.passed, false, 'Should fail quiet hours check at 23:00 IST');

  const res6Day = ModelPredictor.predict({
    amount: 1500,
    failure_reason_code: 'insufficient_funds',
    time_of_debit_ist_hour: 14
  });
  assert.strictEqual(res6Day.compliance_pre_flight.trai_quiet_hours.passed, true, 'Should pass quiet hours check at 14:00 IST');
  console.log('  ✓ [PASS] Test 6: TRAI Quiet Hours boundary validation blocks at 23:00 IST and permits at 14:00 IST');

  // Test 7: EV Calculation & Feature Attribution
  const res7 = ModelPredictor.predict({
    amount: 20000,
    failure_reason_code: 'daily_limit_exceeded',
    payment_method: 'upi_autopay',
    customer_segment: 'high_value',
    retry_count_so_far: 1,
    customer_tenure_months: 24
  });
  assert.ok(res7.expected_recovery_amount > 0 && res7.expected_recovery_amount <= 20000, 'EV must be positive and bounded by amount');
  assert.ok(res7.feature_attributions.length >= 3, 'Must produce multiple SHAP-style feature attributions');
  console.log('  ✓ [PASS] Test 7: Mathematical consistency of EV and multi-factor feature attribution verified');

  // Test 8: Portfolio Batch Predictor
  const mockPortfolio = [
    { subscription_id: 's1', customer_name: 'A', amount: 10000, failure_reason_code: 'technical_error', customer_segment: 'standard', retry_count_so_far: 0 },
    { subscription_id: 's2', customer_name: 'B', amount: 20000, failure_reason_code: 'card_expired', customer_segment: 'high_value', retry_count_so_far: 0 },
    { subscription_id: 's3', customer_name: 'C', amount: 30000, failure_reason_code: 'daily_limit_exceeded', customer_segment: 'high_value', retry_count_so_far: 1 }
  ];
  const portRes = ModelPredictor.predictPortfolio(mockPortfolio);
  assert.strictEqual(portRes.portfolio_size, 3);
  assert.strictEqual(portRes.total_at_risk_amount, 60000);
  assert.ok(portRes.predicted_recovery_amount > 0, 'Portfolio predicted recovery amount must be positive');
  assert.ok(portRes.predicted_recovery_rate_pct >= 40 && portRes.predicted_recovery_rate_pct <= 95, 'Portfolio rate within expected bounds');
  console.log('  ✓ [PASS] Test 8: Portfolio batch aggregator correctly calculates ₹60,000 risk and distribution health');

  console.log('\nAI Model Predictor Test Suite Complete: 8/8 passed.');
}

if (require.main === module) {
  runPredictionModelTests();
}
