import { getDatabase } from '../src/db/database';

const db = getDatabase();

console.log('=== LATEST RECOVERY METRICS RECORD ===');
const metrics = db.prepare('SELECT * FROM recovery_metrics ORDER BY timestamp DESC LIMIT 1').get() as any;
console.log(metrics);

console.log('\n=== DETAILED BREAKDOWN OF ALL RECOVERED CASES IN DATABASE ===');
const recovered = db.prepare(`
  SELECT s.subscription_id, s.customer_name, s.amount, s.failure_reason_code, s.retry_count_so_far,
         p.state as ptp_state, p.amount as ptp_amount, p.promised_date
  FROM subscriptions s
  LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
  WHERE s.mandate_status = 'recovered'
  ORDER BY s.amount DESC
`).all() as any[];

let gatewayTotal = 0;
let voiceTotal = 0;

console.log('| Subscription ID | Customer Name | Amount (₹) | Failure Reason | Recovery Channel | PTP State |');
console.log('| :--- | :--- | :--- | :--- | :--- | :--- |');
recovered.forEach(r => {
  const isVoice = r.ptp_state === 'KEPT';
  if (isVoice) {
    voiceTotal += r.amount;
  } else {
    gatewayTotal += r.amount;
  }
  console.log(`| ${r.subscription_id} | ${r.customer_name} | ₹${r.amount.toLocaleString('en-IN')} | ${r.failure_reason_code} | ${isVoice ? 'Hinglish Voice (PTP)' : 'Gateway API Retry'} | ${r.ptp_state || 'N/A'} |`);
});

console.log(`\nSubtotal Gateway-Only: ₹${gatewayTotal.toLocaleString('en-IN')} (${gatewayTotal})`);
console.log(`Subtotal Voice-Only (PTP): ₹${voiceTotal.toLocaleString('en-IN')} (${voiceTotal})`);
console.log(`Total Settled: ₹${(gatewayTotal + voiceTotal).toLocaleString('en-IN')} (${gatewayTotal + voiceTotal})`);

console.log('\n=== 3 TARGETED VOICE CASES IN SEED DATA ===');
const voiceCases = db.prepare(`
  SELECT s.subscription_id, s.customer_name, s.amount, s.mandate_status, s.failure_reason_code, s.retry_count_so_far,
         p.state as ptp_state, p.amount as ptp_amount, p.promised_date
  FROM subscriptions s
  LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
  WHERE s.subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')
`).all() as any[];

console.log('| Subscription ID | Customer Name | Amount (₹) | Mandate Status | Decline Reason | PTP State | Final Outcome in Batch |');
console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
voiceCases.forEach(v => {
  console.log(`| ${v.subscription_id} | ${v.customer_name} | ₹${v.amount.toLocaleString('en-IN')} | ${v.mandate_status} | ${v.failure_reason_code} | ${v.ptp_state || 'None'} | ${v.mandate_status === 'recovered' ? 'Recovered' : 'Unresolved / Failed'} |`);
});
