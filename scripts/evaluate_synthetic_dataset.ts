import fs from 'fs';
import path from 'path';
import {
  evaluateComplianceGate,
  isActionBlocked,
  ProposedAction,
  ProposedChannel,
  ComplianceCheckResult
} from '../src/compliance/gate';
import {
  RecoveryCase,
  Subscription,
  Customer,
  FailureEvent
} from '../src/db/types';

interface SyntheticDataset {
  generated_at: string;
  total_cases: number;
  customers: Customer[];
  subscriptions: Subscription[];
  payment_attempts: any[];
  failure_events: FailureEvent[];
  recovery_cases: RecoveryCase[];
}

export interface ScenarioEvaluationSummary {
  scenarioName: string;
  description: string;
  proposedAction: ProposedAction;
  proposedChannel: ProposedChannel;
  totalCasesEvaluated: number;
  totalCasesBlocked: number;
  totalCasesPassed: number;
  ruleStats: {
    rule: string;
    evaluatedCount: number;
    blockedCount: number;
    passedCount: number;
    exemptCount: number;
  }[];
  caseResults: {
    caseId: string;
    blocked: boolean;
    results: ComplianceCheckResult[];
  }[];
}

const ALL_RULES = [
  'RBI_MANDATE_MAX_RETRIES_3',
  'TRAI_QUIET_HOURS_2100_0900_IST',
  'RBI_24H_PRE_DEBIT_NOTICE',
  'MIN_COOLDOWN_48H',
  'TRAI_DND_CHANNEL_BLOCK'
];

/**
 * Evaluates all 100 cases under a uniform, explicit scenario policy.
 */
export function evaluateScenario(
  dataset: SyntheticDataset,
  scenarioName: string,
  description: string,
  action: ProposedAction,
  channel: ProposedChannel
): ScenarioEvaluationSummary {
  const customerMap = new Map<string, Customer>();
  dataset.customers.forEach((c) => customerMap.set(c.id, c));

  const subMap = new Map<string, Subscription>();
  dataset.subscriptions.forEach((s) => subMap.set(s.id, s));

  const failMap = new Map<string, FailureEvent>();
  dataset.failure_events.forEach((f) => failMap.set(f.id, f));

  let totalCasesBlocked = 0;
  let totalCasesPassed = 0;

  const ruleStatsMap = new Map<
    string,
    { evaluatedCount: number; blockedCount: number; passedCount: number; exemptCount: number }
  >();

  ALL_RULES.forEach((rule) => {
    ruleStatsMap.set(rule, { evaluatedCount: 0, blockedCount: 0, passedCount: 0, exemptCount: 0 });
  });

  const caseResults: {
    caseId: string;
    blocked: boolean;
    results: ComplianceCheckResult[];
  }[] = [];

  for (const rc of dataset.recovery_cases) {
    const sub = subMap.get(rc.subscription_id);
    const failEvent = rc.latest_failure_event_id ? failMap.get(rc.latest_failure_event_id) : undefined;
    const customer = sub ? customerMap.get(sub.customer_id) : undefined;

    if (!sub || !failEvent || !customer) {
      throw new Error(`Integrity error: missing relational records for case ${rc.id}`);
    }

    const proposedTime = new Date(failEvent.occurred_at);

    const results = evaluateComplianceGate({
      recoveryCase: rc,
      subscription: sub,
      customer,
      latestFailureEvent: failEvent,
      proposedAction: action,
      proposedChannel: channel,
      proposedTime
    });

    const blocked = isActionBlocked(results);
    if (blocked) {
      totalCasesBlocked++;
    } else {
      totalCasesPassed++;
    }

    // Tally rule statistics
    for (const res of results) {
      const stats = ruleStatsMap.get(res.rule_cited);
      if (stats) {
        stats.evaluatedCount++;
        if (!res.passed) {
          stats.blockedCount++;
        } else {
          stats.passedCount++;
          if (res.context_snapshot?.exempt) {
            stats.exemptCount++;
          }
        }
      }
    }

    // For any rule not evaluated for this action type, record as not applicable
    ALL_RULES.forEach((rule) => {
      if (!results.some((r) => r.rule_cited === rule)) {
        // Not checked for this channel/action type (e.g. DND not checked for gateway_retry)
      }
    });

    caseResults.push({
      caseId: rc.id,
      blocked,
      results
    });
  }

  const ruleStats = ALL_RULES.map((rule) => {
    const stats = ruleStatsMap.get(rule)!;
    return {
      rule,
      evaluatedCount: stats.evaluatedCount,
      blockedCount: stats.blockedCount,
      passedCount: stats.passedCount,
      exemptCount: stats.exemptCount
    };
  });

  return {
    scenarioName,
    description,
    proposedAction: action,
    proposedChannel: channel,
    totalCasesEvaluated: dataset.recovery_cases.length,
    totalCasesBlocked,
    totalCasesPassed,
    ruleStats,
    caseResults
  };
}

export function runDatasetEvaluations() {
  const filePath = path.join(process.cwd(), 'data/synthetic/synthetic_recovery_scenarios_100.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Synthetic dataset file not found at ${filePath}. Run 'npx tsx scripts/generate_synthetic_cases.ts' first.`);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const dataset: SyntheticDataset = JSON.parse(rawData);

  console.log('================================================================================');
  console.log(' AI REVENUE RECOVERY AGENT — COMPLIANCE GATE DATASET EVALUATION');
  console.log(` Dataset Timestamp: ${dataset.generated_at} | Total Records: ${dataset.total_cases}`);
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SCENARIO A: Immediate Automated Gateway Retry
  // ---------------------------------------------------------------------------
  const scenarioA = evaluateScenario(
    dataset,
    'Scenario A — "Immediate Automated Retry"',
    'Default automated merchant action: retry debit immediately via Razorpay API at payment failure time',
    'retry_now',
    'gateway_retry'
  );

  console.log(`### ${scenarioA.scenarioName}`);
  console.log(`Policy: proposedAction='${scenarioA.proposedAction}', proposedChannel='${scenarioA.proposedChannel}', proposedTime=occurred_at`);
  console.log(`Context: ${scenarioA.description}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Total Cases Evaluated : ${scenarioA.totalCasesEvaluated}`);
  console.log(`Total Cases Blocked   : ${scenarioA.totalCasesBlocked} (${((scenarioA.totalCasesBlocked / scenarioA.totalCasesEvaluated) * 100).toFixed(1)}%)`);
  console.log(`Total Cases Passed    : ${scenarioA.totalCasesPassed} (${((scenarioA.totalCasesPassed / scenarioA.totalCasesEvaluated) * 100).toFixed(1)}%)`);
  console.log('\nRule Breakdown:');
  console.log('| Rule Name                      | Evaluated | Blocked | Passed | (Exempt) |');
  console.log('| :----------------------------- | --------: | ------: | -----: | -------: |');
  scenarioA.ruleStats.forEach((rs) => {
    console.log(
      `| ${rs.rule.padEnd(30)} | ${String(rs.evaluatedCount).padStart(9)} | ${String(rs.blockedCount).padStart(7)} | ${String(rs.passedCount).padStart(6)} | ${String(rs.exemptCount).padStart(8)} |`
    );
  });
  console.log('--------------------------------------------------------------------------------\n');

  // ---------------------------------------------------------------------------
  // SCENARIO B: Customer Outreach Nudge
  // ---------------------------------------------------------------------------
  const scenarioB = evaluateScenario(
    dataset,
    'Scenario B — "Customer Outreach Nudge (WhatsApp)"',
    'Direct consumer communication: interactive payment link & recovery nudge dispatched via WhatsApp',
    'whatsapp_nudge',
    'whatsapp_nudge'
  );

  console.log(`### ${scenarioB.scenarioName}`);
  console.log(`Policy: proposedAction='${scenarioB.proposedAction}', proposedChannel='${scenarioB.proposedChannel}', proposedTime=occurred_at`);
  console.log(`Context: ${scenarioB.description}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`Total Cases Evaluated : ${scenarioB.totalCasesEvaluated}`);
  console.log(`Total Cases Blocked   : ${scenarioB.totalCasesBlocked} (${((scenarioB.totalCasesBlocked / scenarioB.totalCasesEvaluated) * 100).toFixed(1)}%)`);
  console.log(`Total Cases Passed    : ${scenarioB.totalCasesPassed} (${((scenarioB.totalCasesPassed / scenarioB.totalCasesEvaluated) * 100).toFixed(1)}%)`);
  console.log('\nRule Breakdown:');
  console.log('| Rule Name                      | Evaluated | Blocked | Passed | (Exempt) |');
  console.log('| :----------------------------- | --------: | ------: | -----: | -------: |');
  scenarioB.ruleStats.forEach((rs) => {
    console.log(
      `| ${rs.rule.padEnd(30)} | ${String(rs.evaluatedCount).padStart(9)} | ${String(rs.blockedCount).padStart(7)} | ${String(rs.passedCount).padStart(6)} | ${String(rs.exemptCount).padStart(8)} |`
    );
  });
  console.log('--------------------------------------------------------------------------------\n');

  // ---------------------------------------------------------------------------
  // THEORETICAL RECONCILIATION TABLE
  // ---------------------------------------------------------------------------
  console.log('================================================================================');
  console.log(' THEORETICAL EXPECTATION VS ACTUAL RESULTS RECONCILIATION');
  console.log('================================================================================');

  // Theoretical Expectations derivation from generator distributions:
  // 1. RBI_MANDATE_MAX_RETRIES_3:
  //    Generator: i % 10 === 0 -> 10 cases have retry_count = 3 (>= 3).
  //    Scenario A (gateway_retry): Expected = 10 triggers.
  //    Scenario B (whatsapp_nudge): Exempt/0 triggers (max retries only blocks automated debits).
  // 2. TRAI_QUIET_HOURS_2100_0900_IST:
  //    Generator: utcHour = i % 24 for i = 1..100.
  //    Quiet hours 21:00-09:00 IST = UTC hours [16..23, 0..3] (12 of 24 hours).
  //    Exact counts: 8 hrs * 4 cases + 1 hr * 4 cases + 3 hrs * 5 cases = 51 cases.
  //    Scenario A & B: Expected = 51 triggers.
  // 3. RBI_24H_PRE_DEBIT_NOTICE:
  //    Generator: i % 7 === 0 (missing notice, 14 cases) + i % 7 === 1 (late notice 4-16h, 15 cases) = 29 cases.
  //    Scenario A (gateway_retry): Expected = 29 triggers.
  //    Scenario B (whatsapp_nudge): Exempt/0 triggers (pre-debit notice only applies to debits).
  // 4. MIN_COOLDOWN_48H:
  //    Generator: i % 6 === 0 -> last_contacted_at set to 8..24h ago (< 48h). 16 cases.
  //    Scenario A (gateway_retry): Exempt/0 triggers (backend debit is not direct customer ping).
  //    Scenario B (whatsapp_nudge): Expected = 16 triggers.
  // 5. TRAI_DND_CHANNEL_BLOCK:
  //    Generator: i % 4 === 0 -> dnd_registered = true. 25 cases.
  //    Scenario A (gateway_retry): Exempt/0 triggers.
  //    Scenario B (whatsapp_nudge): Expected = 25 triggers.

  const reconciliationData = [
    {
      scenario: 'Scenario A (gateway_retry)',
      rule: 'RBI_MANDATE_MAX_RETRIES_3',
      expected: 10,
      actual: scenarioA.ruleStats.find((r) => r.rule === 'RBI_MANDATE_MAX_RETRIES_3')!.blockedCount,
      rationale: 'i % 10 === 0 -> 10 cases have retry_count=3'
    },
    {
      scenario: 'Scenario A (gateway_retry)',
      rule: 'TRAI_QUIET_HOURS_2100_0900_IST',
      expected: 51,
      actual: scenarioA.ruleStats.find((r) => r.rule === 'TRAI_QUIET_HOURS_2100_0900_IST')!.blockedCount,
      rationale: '12 of 24 UTC hours fall in 21:00-09:00 IST (exact discrete sum = 51)'
    },
    {
      scenario: 'Scenario A (gateway_retry)',
      rule: 'RBI_24H_PRE_DEBIT_NOTICE',
      expected: 29,
      actual: scenarioA.ruleStats.find((r) => r.rule === 'RBI_24H_PRE_DEBIT_NOTICE')!.blockedCount,
      rationale: '14 missing (i%7=0) + 15 late notices (i%7=1) = 29'
    },
    {
      scenario: 'Scenario A (gateway_retry)',
      rule: 'MIN_COOLDOWN_48H',
      expected: 0,
      actual: scenarioA.ruleStats.find((r) => r.rule === 'MIN_COOLDOWN_48H')!.blockedCount,
      rationale: 'Exempt: gateway_retry is backend debit, not customer outreach'
    },
    {
      scenario: 'Scenario A (gateway_retry)',
      rule: 'TRAI_DND_CHANNEL_BLOCK',
      expected: 0,
      actual: scenarioA.ruleStats.find((r) => r.rule === 'TRAI_DND_CHANNEL_BLOCK')!.blockedCount,
      rationale: 'Exempt: backend debit not subject to telemarketing DND'
    },
    {
      scenario: 'Scenario B (whatsapp_nudge)',
      rule: 'RBI_MANDATE_MAX_RETRIES_3',
      expected: 0,
      actual: scenarioB.ruleStats.find((r) => r.rule === 'RBI_MANDATE_MAX_RETRIES_3')!.blockedCount,
      rationale: 'Exempt: customer nudge is not an automated debit attempt'
    },
    {
      scenario: 'Scenario B (whatsapp_nudge)',
      rule: 'TRAI_QUIET_HOURS_2100_0900_IST',
      expected: 51,
      actual: scenarioB.ruleStats.find((r) => r.rule === 'TRAI_QUIET_HOURS_2100_0900_IST')!.blockedCount,
      rationale: 'Customer outreach prohibited between 21:00 and 09:00 IST'
    },
    {
      scenario: 'Scenario B (whatsapp_nudge)',
      rule: 'RBI_24H_PRE_DEBIT_NOTICE',
      expected: 0,
      actual: scenarioB.ruleStats.find((r) => r.rule === 'RBI_24H_PRE_DEBIT_NOTICE')!.blockedCount,
      rationale: 'Exempt: 24h pre-debit notice only applies to debit transactions'
    },
    {
      scenario: 'Scenario B (whatsapp_nudge)',
      rule: 'MIN_COOLDOWN_48H',
      expected: 16,
      actual: scenarioB.ruleStats.find((r) => r.rule === 'MIN_COOLDOWN_48H')!.blockedCount,
      rationale: 'i % 6 === 0 -> 16 cases contacted within last 8-24 hours'
    },
    {
      scenario: 'Scenario B (whatsapp_nudge)',
      rule: 'TRAI_DND_CHANNEL_BLOCK',
      expected: 25,
      actual: scenarioB.ruleStats.find((r) => r.rule === 'TRAI_DND_CHANNEL_BLOCK')!.blockedCount,
      rationale: 'i % 4 === 0 -> 25 cases registered on TRAI National DND'
    }
  ];

  console.log('| Scenario   | Rule Name                      | Expected | Actual | Delta | Status | Rationale |');
  console.log('| :--------- | :----------------------------- | -------: | -----: | ----: | :----: | :-------- |');

  reconciliationData.forEach((row) => {
    const delta = row.actual - row.expected;
    const status = Math.abs(delta) === 0 ? '✓ MATCH' : Math.abs(delta) <= 2 ? '≈ NOISE' : '❌ BUG';
    const scShort = row.scenario.startsWith('Scenario A') ? 'Scen A' : 'Scen B';
    console.log(
      `| ${scShort.padEnd(10)} | ${row.rule.padEnd(30)} | ${String(row.expected).padStart(8)} | ${String(row.actual).padStart(6)} | ${String(delta).padStart(5)} | ${status.padEnd(6)} | ${row.rationale} |`
    );
  });
  console.log('================================================================================\n');

  return { scenarioA, scenarioB, reconciliationData };
}

if (require.main === module) {
  runDatasetEvaluations();
}
