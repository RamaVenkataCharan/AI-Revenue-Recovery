import { getDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { RevenueRecoveryOrchestrator } from '../src/agent/orchestrator';

// Seed fresh data and run batch
seedDatabase();
const reportPromise = RevenueRecoveryOrchestrator.runBatch();

reportPromise.then((report) => {
  const db = getDatabase();

  console.log('=== BATCH RUN REPORT SUMMARY ===');
  console.log({
    total_at_risk_amount: report.total_at_risk_amount,
    total_recovered_amount: report.total_recovered_amount,
    gateway_recovered_amount: report.gateway_recovered_amount,
    voice_recovered_amount: report.voice_recovered_amount,
    recovery_rate_pct: report.recovery_rate_pct,
    voice_calls_placed_count: report.voice_calls_placed_count,
    promises_made_count: report.promises_made_count,
    promises_kept_count: report.promises_kept_count,
    promises_broken_count: report.promises_broken_count,
  });

  console.log('\n=== ALL RECOVERED CASES IN DATABASE ===');
  const recoveredCases = db.prepare(`
    SELECT s.subscription_id, s.customer_name, s.amount, s.failure_reason_code, s.retry_count_so_far,
           p.state as ptp_state, p.amount as ptp_amount, p.promised_date
    FROM subscriptions s
    LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
    WHERE s.mandate_status = 'recovered'
    ORDER BY s.amount DESC
  `).all() as any[];

  let sumGateway = 0;
  let sumVoice = 0;

  recoveredCases.forEach((c) => {
    const isVoice = c.ptp_state === 'KEPT';
    if (isVoice) {
      sumVoice += c.amount;
    } else {
      sumGateway += c.amount;
    }
    console.log(`- [${c.subscription_id}] ${c.customer_name}: ₹${c.amount} | Reason: ${c.failure_reason_code} | Channel: ${isVoice ? 'VOICE (PTP KEPT)' : 'GATEWAY RETRY'}`);
  });

  console.log(`\nReconciled Gateway Sum: ₹${sumGateway}`);
  console.log(`Reconciled Voice Sum: ₹${sumVoice}`);
  console.log(`Reconciled Total Sum: ₹${sumGateway + sumVoice}`);

  console.log('\n=== 3 EXECUTED VOICE CALLS INSPECTION ===');
  const voiceTargetCases = db.prepare(`
    SELECT s.subscription_id, s.customer_name, s.amount, s.mandate_status, s.failure_reason_code, s.retry_count_so_far,
           p.state as ptp_state, p.amount as ptp_amount, p.promised_date
    FROM subscriptions s
    LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
    WHERE s.subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')
  `).all();
  console.log(JSON.stringify(voiceTargetCases, null, 2));

  console.log('\n=== AUDIT LOGS FOR sub_1045, sub_1029, sub_1014 ===');
  const auditLogs = db.prepare(`
    SELECT subscription_id, event_type, decision, reasoning, action_taken, result
    FROM audit_log
    WHERE subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')
    ORDER BY id ASC
  `).all();
  console.log(JSON.stringify(auditLogs, null, 2));
});
