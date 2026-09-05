import fs from 'fs';
import path from 'path';
import { seedDatabase } from '../src/db/seed';
import { RevenueRecoveryOrchestrator, BatchRunReport } from '../src/agent/orchestrator';
import { AuditLogger } from '../src/audit/audit_logger';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

async function main() {
  console.log('='.repeat(85));
  console.log(' AI REVENUE RECOVERY AGENT — BATCH EXECUTION RUNNER (Autonomous Closed Loop)');
  console.log('='.repeat(85));

  // Step 1: Seed fresh synthetic data into SQLite
  console.log('\n[1/5] Seeding SQLite database from /data/synthetic/failed_subscriptions.json...');
  const { seededCount } = seedDatabase();
  console.log(`✓ Loaded ${seededCount} failed subscription records.\n`);

  // Step 2: Run the complete closed-loop recovery pipeline
  console.log('[2/5] Executing Closed-Loop Recovery Pipeline:');
  console.log('      Detect → Diagnose → Policy & Voice Escalation → Safety Gates → Execute → Track PTP → Audit...');
  const startTime = Date.now();
  const report: BatchRunReport = await RevenueRecoveryOrchestrator.runBatch();
  const durationMs = Date.now() - startTime;
  console.log(`✓ Batch execution & Promise-to-Pay resolution completed in ${durationMs}ms.\n`);

  // Step 3: Print Executive Recovery Metrics Summary
  console.log('='.repeat(85));
  console.log(' EXECUTIVE RECOVERY METRICS SUMMARY');
  console.log('='.repeat(85));
  console.log(` Batch ID:                         ${report.batch_id}`);
  console.log(` Total At-Risk Events Detected:    ${report.total_events_detected}`);
  console.log(` Total Revenue At Risk:            ${formatINR(report.total_at_risk_amount)}`);
  console.log(` TOTAL REVENUE RECOVERED:          ${formatINR(report.total_recovered_amount)} (${report.recovery_rate_pct}%)`);
  console.log(`   ├── Gateway Auto-Recovery:      ${formatINR(report.gateway_recovered_amount)}`);
  console.log(`   └── Voice Channel Recovery:     ${formatINR(report.voice_recovered_amount)}`);
  console.log('-'.repeat(85));
  console.log(` Hinglish Voice Calls Placed:      ${report.voice_calls_placed_count} calls`);
  console.log(` Promise-to-Pay (PTP) Commitments: ${report.promises_made_count} promises captured`);
  console.log(`   ├── PTP Kept (Recovered):       ${report.promises_kept_count} promises`);
  console.log(`   └── PTP Broken (Penalized):     ${report.promises_broken_count} promises`);
  console.log(` Payment Update Nudges Sent:       ${report.dispatched_nudges_count} messages`);
  console.log(` Failed Gateway Retries:           ${report.failed_retries_count} cases`);
  console.log(` Stopping-Rule Safety Triggers:    ${report.stopping_rule_triggers_count} cases (Enforced max retries & revoked blocks)`);
  console.log(` Compliance-Gate Blocks:           ${report.compliance_gate_blocks_count} cases (Anti-harassment contact frequency & DND)`);
  console.log(` Total Unresolved Exceptions:      ${report.unresolved_exceptions_count} cases`);
  console.log('='.repeat(85));

  // Step 4: Display 2-3 Sample Hinglish Voice Recovery Transcripts
  console.log('\n[3/5] SAMPLE HINGLISH VOICE CALL TRANSCRIPTS (Differentiator Preview):');
  console.log('-'.repeat(85));
  
  const transcriptsPath = path.resolve(__dirname, '../data/synthetic/voice_call_transcripts.json');
  if (fs.existsSync(transcriptsPath)) {
    const transcripts: any[] = JSON.parse(fs.readFileSync(transcriptsPath, 'utf-8'));
    const samples = transcripts.slice(0, 3);
    
    samples.forEach((t, i) => {
      console.log(`\n🎙️ SAMPLE CALL #${i + 1} | [${t.tone}] | Customer: ${t.customer_name} (${t.customer_segment}) | Amount: ${formatINR(t.amount)}`);
      console.log(`   Duration: ${t.call_duration_seconds}s | Outcome: ${t.simulated_outcome} ${t.promised_date ? `(PTP Date: ${t.promised_date})` : ''}`);
      console.log('   Script:');
      t.script_content.split('\n').forEach((line: string) => console.log(`     ${line}`));
      console.log(`   Result Note: ${t.summary}`);
    });
  }

  // Step 5: Honest Exception List
  console.log('\n\n[4/5] HONEST EXCEPTION LIST (Unresolved / Blocked / Broken Cases):');
  console.log('-'.repeat(85));
  const exceptionCases = report.cases.filter(c => c.status !== 'GATEWAY_RECOVERED' && c.status !== 'VOICE_RECOVERED');
  
  exceptionCases.slice(0, 12).forEach((item, idx) => {
    const statusBadge = `[${item.status}]`.padEnd(24, ' ');
    console.log(`${(idx + 1).toString().padStart(2, '0')}. ${statusBadge} | ${item.subscription_id} | ${item.customer_name.padEnd(20, ' ')} | ${formatINR(item.amount).padEnd(10, ' ')} | ${item.summary_note}`);
  });
  if (exceptionCases.length > 12) {
    console.log(`... and ${exceptionCases.length - 12} more exception cases recorded in recovery_metrics.`);
  }

  // Step 6: Sample Explainability Audit Trail
  console.log('\n[5/5] SAMPLE EXPLAINABILITY TRACES (Audit Log Sample for Judge Review):');
  console.log('-'.repeat(85));
  
  // 1. Voice -> PTP -> Kept / Resolved flow
  const voiceCase = report.cases.find(c => c.decision.action === 'HINGLISH_VOICE_RECOVERY');
  // 2. Compliance Blocked Case
  const complianceCase = report.cases.find(c => c.status === 'BLOCKED_COMPLIANCE');
  // 3. Stopping Rule Blocked Case
  const stoppingCase = report.cases.find(c => c.status === 'BLOCKED_STOPPING_RULE');

  const demoSubIds = [voiceCase?.subscription_id, complianceCase?.subscription_id, stoppingCase?.subscription_id].filter(Boolean) as string[];

  for (const subId of demoSubIds) {
    console.log(`\n>>> AUDIT TRAIL FOR SUBSCRIPTION: ${subId}`);
    const logs = AuditLogger.getLogsBySubscription(subId);
    logs.forEach(log => {
      console.log(`  [${log.event_type.padEnd(22, ' ')}] ${log.decision || log.result || 'INFO'}`);
      console.log(`     ↳ Reason: ${log.reasoning}`);
      if (log.action_taken) console.log(`     ↳ Action: ${log.action_taken}`);
    });
  }

  console.log('\n' + '='.repeat(85));
  console.log(' BATCH RUN COMPLETE — DB audit_log, promises_to_pay & recovery_metrics updated.');
  console.log('='.repeat(85));
}

main().catch(err => {
  console.error('[Batch Error]:', err);
  process.exit(1);
});
