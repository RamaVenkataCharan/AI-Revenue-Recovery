# Verifiable Current-State Audit: AI Revenue Recovery Agent

**Audit Date & Time:** 2026-08-29 10:08:00 IST  
**Environment:** Windows (Node.js `v22.17.1`, Next.js `16.3.2`, TypeScript `7.0.2`, `better-sqlite3` `13.0.3`)  
**Active Database File on Disk:** `revenue_recovery.db` (245,760 bytes)  
**Model & Execution Performance:** Execution times measured live across evaluation scripts and test suites (< 300ms per suite).

---

## 1. Repository Structure

### Command Executed:
```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch '\\(node_modules|\.git|\.next)\\' } | Select-Object FullName, Length
```

### Real Command Output:
```text
FullName                                                                                      Length
--------                                                                                      ------
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\CLAUDE.md                                   11
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\FRONTEND_REPORT.md                       29782
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\next-env.d.ts                              303
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\next.config.js                             167
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\package-lock.json                       131576
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\package.json                              1047
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\postcss.config.js                           72
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\PROJECT_STATUS.md                         7722
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\README.md                                 6606
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\revenue_recovery.db                     245760
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\revenue_recovery.db-shm                  32768
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\revenue_recovery.db-wal                      0
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\tailwind.config.js                        1571
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\tsconfig.json                              715
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\.github\workflows\generator-generic-ossf-slsa3-publish.yml   2494
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\data\synthetic\failed_subscriptions.json 23539
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\data\synthetic\synthetic_recovery_scenarios_100.json       286702
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\data\synthetic\voice_call_transcripts.json 6648
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\public\screenshots\01_executive_dashboard.png              403974
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\public\screenshots\02_case_portfolio.png                    108042
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\public\screenshots\03_audit_ledger.png                      101375
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\public\screenshots\04_voice_studio.png                       96426
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\scripts\evaluate_synthetic_dataset.ts    14653
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\scripts\generate_synthetic_cases.ts      15572
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\scripts\run_batch.ts                      6304
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\server.ts                             1490
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\agent\orchestrator.ts                12221
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\globals.css                       1815
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\layout.tsx                         776
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\page.tsx                           110
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\audit\search\route.ts         1303
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\batch\run\route.ts             740
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\cases\route.ts                3894
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\cases\[id]\route.ts           1830
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\dashboard\funnel\route.ts     3017
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\dashboard\summary\route.ts    2231
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\api\voice\samples\route.ts        1407
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\components\Navbar.tsx             4910
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\dashboard\page.tsx               16365
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\dashboard\audit\page.tsx          9410
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\dashboard\cases\page.tsx          9720
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\dashboard\cases\[id]\page.tsx    16457
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\app\dashboard\voice\page.tsx          9603
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\audit\audit_logger.ts                 2076
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\compliance\gate.test.ts              18844
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\compliance\gate.ts                   15093
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\database.ts                        2045
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\schema.sql                         9018
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\seed.ts                            2743
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\sqlite_schema.sql                  6127
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\supabase_schema.sql               7622
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\db\types.ts                           4373
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\decision\compliance_gate.ts           4090
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\decision\intervention_policy.ts       4646
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\decision\stopping_rules.ts            4423
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\detection\subscription_failure_detector.ts 2366
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\diagnosis\root_cause_classifier.ts    3498
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\execution\hinglish_voice_agent.ts     8821
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\execution\mandate_retry_executor.ts   8099
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\compliance_gate.test.ts         2521
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\detection.test.ts                890
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\promise_to_pay.test.ts          4216
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\run_tests.ts                     534
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\stopping_rules.test.ts          2691
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tests\voice_recovery.test.ts          2709
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tracking\promise_to_pay_tracker.ts    7357
C:\Users\ramav\Documents\PROJECTS\AI Revenue Recovery\src\tracking\retry_scheduler.ts           2464
```

---

## 2. Database / Data Layer

### A. Confirmation of Actual DB Client / Connection
- **File:** `src/db/database.ts`
- **Engine Verdict:** **Strictly SQLite (`better-sqlite3`)**. The app runs locally against an embedded file `revenue_recovery.db`. It is **NOT** connected to Supabase/Postgres in the current active runtime.

#### Full File Contents: `src/db/database.ts`
```typescript
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'revenue_recovery.db');
const SCHEMA_PATH = fs.existsSync(path.join(process.cwd(), 'src/db/sqlite_schema.sql'))
  ? path.join(process.cwd(), 'src/db/sqlite_schema.sql')
  : path.join(process.cwd(), 'src/db/schema.sql');

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

export function initSchema(db: Database.Database = getDatabase()): void {
  if (!fs.existsSync(SCHEMA_PATH)) {
    return;
  }
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  // Safe table schema migrations for development
  const migrations = [
    'ALTER TABLE subscriptions ADD COLUMN contact_history TEXT',
    'ALTER TABLE recovery_metrics ADD COLUMN voice_calls_placed_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_made_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_kept_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_broken_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN voice_recovered_amount REAL NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN gateway_recovered_amount REAL NOT NULL DEFAULT 0'
  ];

  for (const sql of migrations) {
    try {
      db.prepare(sql).run();
    } catch {
      // Column already exists
    }
  }
}

export function resetDatabase(): Database.Database {
  closeDatabase();
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      // Ignore if locked
    }
  }
  return getDatabase();
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

---

### B. Current Schema File
**Primary SQLite Schema Path:** `src/db/sqlite_schema.sql` (167 lines)

#### Full File Contents: `src/db/sqlite_schema.sql`
```sql
-- ============================================================================
-- AI REVENUE RECOVERY AGENT — SQLITE SCHEMA (LOCAL RUNNER / TEST RUNS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    support_email TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    rbi_mandate_id_prefix TEXT NOT NULL DEFAULT 'RPR_',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    dnd_registered INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'standard',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    payment_method TEXT NOT NULL,
    mandate_token TEXT NOT NULL,
    mandate_expiry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_cycle_start TEXT NOT NULL,
    current_cycle_end TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    gateway TEXT NOT NULL DEFAULT 'payment_gateway',
    gateway_payment_id TEXT,
    status TEXT NOT NULL,
    error_code TEXT,
    error_description TEXT,
    attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS failure_events (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    payment_attempt_id TEXT NOT NULL,
    failure_category TEXT NOT NULL,
    raw_error_code TEXT NOT NULL,
    raw_error_message TEXT NOT NULL,
    pre_debit_notice_sent_at TEXT,
    occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
    raw_webhook_payload TEXT DEFAULT '{}',
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_attempt_id) REFERENCES payment_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recovery_cases (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    latest_failure_event_id TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    recovery_strategy TEXT,
    total_amount_due REAL NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries_allowed INTEGER NOT NULL DEFAULT 3,
    last_contacted_at TEXT,
    next_scheduled_action_at TEXT,
    opened_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (latest_failure_event_id) REFERENCES failure_events(id)
);

CREATE TABLE IF NOT EXISTS intervention_actions (
    id TEXT PRIMARY KEY,
    recovery_case_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    action_type TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'executed',
    payload TEXT DEFAULT '{}',
    result TEXT DEFAULT '{}',
    executed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recovery_case_id) REFERENCES recovery_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance_checks (
    id TEXT PRIMARY KEY,
    recovery_case_id TEXT NOT NULL,
    proposed_action TEXT NOT NULL,
    proposed_channel TEXT NOT NULL,
    proposed_time TEXT NOT NULL,
    passed INTEGER NOT NULL,
    rule_cited TEXT NOT NULL,
    reason TEXT NOT NULL,
    context_snapshot TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recovery_case_id) REFERENCES recovery_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promise_to_pay (
    id TEXT PRIMARY KEY,
    recovery_case_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    promised_amount REAL NOT NULL,
    promised_date TEXT NOT NULL,
    channel_captured TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    follow_up_scheduled_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (recovery_case_id) REFERENCES recovery_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    input_payload TEXT DEFAULT '{}',
    output_payload TEXT DEFAULT '{}',
    reasoning TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recovery_metrics (
    batch_id TEXT PRIMARY KEY,
    total_at_risk REAL NOT NULL,
    total_recovered REAL NOT NULL,
    recovery_rate_pct REAL NOT NULL,
    stopping_rule_triggers_count INTEGER NOT NULL DEFAULT 0,
    compliance_gate_blocks_count INTEGER NOT NULL DEFAULT 0,
    exceptions_count INTEGER NOT NULL DEFAULT 0,
    voice_calls_placed_count INTEGER NOT NULL DEFAULT 0,
    promises_made_count INTEGER NOT NULL DEFAULT 0,
    promises_kept_count INTEGER NOT NULL DEFAULT 0,
    promises_broken_count INTEGER NOT NULL DEFAULT 0,
    voice_recovered_amount REAL NOT NULL DEFAULT 0,
    gateway_recovered_amount REAL NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

### C. Synthetic Data Generator Execution & Row Counts
- **File:** `scripts/generate_synthetic_cases.ts` (386 lines)

#### Generator Run Command:
```powershell
npx tsx scripts/generate_synthetic_cases.ts
```

#### Real Console Output:
```text
Generating 100 realistic Indian subscription recovery scenarios...
[Success] Generated 100 realistic cases with clean metadata & uniform 24h distribution into data/synthetic/synthetic_recovery_scenarios_100.json
```

#### Direct Live SQLite Query:
```powershell
npx tsx -e "import { getDatabase } from './src/db/database'; const db = getDatabase(); console.log('merchants:', db.prepare('SELECT COUNT(*) as c FROM merchants').get().c); console.log('customers:', db.prepare('SELECT COUNT(*) as c FROM customers').get().c); console.log('subscriptions:', db.prepare('SELECT COUNT(*) as c FROM subscriptions').get().c); console.log('payment_attempts:', db.prepare('SELECT COUNT(*) as c FROM payment_attempts').get().c); console.log('failure_events:', db.prepare('SELECT COUNT(*) as c FROM failure_events').get().c); console.log('recovery_cases:', db.prepare('SELECT COUNT(*) as c FROM recovery_cases').get().c);"
```

#### Actual Live Row Counts in Database:
```text
merchants: 4
customers: 100
subscriptions: 100
payment_attempts: 100
failure_events: 100
recovery_cases: 100
```

---

## 3. Compliance Gate Engine

### A. Full Contents of `src/compliance/gate.ts` (456 lines)
**File:** `src/compliance/gate.ts`

```typescript
import {
  RecoveryCase,
  Subscription,
  Customer,
  FailureEvent
} from '../db/types';

export type ProposedAction =
  | 'retry_now'
  | 'retry_scheduled'
  | 'whatsapp_nudge'
  | 'voice_call'
  | 'email_notice'
  | 'human_escalation';

export type ProposedChannel =
  | 'gateway_retry'
  | 'whatsapp_nudge'
  | 'email_notice'
  | 'voice_call'
  | 'human_escalation';

export interface ComplianceGateInput {
  recoveryCase: RecoveryCase;
  subscription: Subscription;
  customer: Customer;
  latestFailureEvent: FailureEvent;
  proposedAction: ProposedAction;
  proposedChannel: ProposedChannel;
  proposedTime: Date;
}

export interface ComplianceCheckResult {
  passed: boolean;
  rule_cited: string;
  reason: string;
  context_snapshot: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Pure Rule Evaluation Functions
// ---------------------------------------------------------------------------

/**
 * 1. RBI_MANDATE_MAX_RETRIES_3
 * Blocks automated retry actions if retry_count >= max_retries_allowed (default 3).
 * Human escalation actions are exempt.
 */
export function checkRbiMaxRetries(
  recoveryCase: RecoveryCase,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isAutomatedRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  const maxAllowed = recoveryCase.max_retries_allowed ?? 3;
  const currentRetries = recoveryCase.retry_count ?? 0;

  if (!isAutomatedRetry) {
    return {
      passed: true,
      rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
      reason: `Action "${proposedAction}" is not an automated debit retry; RBI retry limit does not apply.`,
      context_snapshot: {
        retry_count: currentRetries,
        max_retries_allowed: maxAllowed,
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  if (currentRetries >= maxAllowed) {
    return {
      passed: false,
      rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
      reason: `Retry count ${currentRetries} has reached the maximum of ${maxAllowed} allowed under RBI e-mandate guidelines for subscription ${recoveryCase.subscription_id}.`,
      context_snapshot: {
        retry_count: currentRetries,
        max_retries_allowed: maxAllowed,
        subscription_id: recoveryCase.subscription_id,
        case_id: recoveryCase.id
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'RBI_MANDATE_MAX_RETRIES_3',
    reason: `Retry count (${currentRetries}/${maxAllowed}) is within permissible limits under RBI e-mandate regulations.`,
    context_snapshot: {
      retry_count: currentRetries,
      max_retries_allowed: maxAllowed,
      subscription_id: recoveryCase.subscription_id
    }
  };
}

/**
 * 2. TRAI_QUIET_HOURS_2100_0900_IST
 * Blocks any customer-facing action or automated debit between 21:00 and 09:00 IST.
 * IST is UTC+5:30. Evaluated strictly without relying on pre-computed flags.
 */
export function checkTraiQuietHours(
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isHumanEscalation =
    proposedAction === 'human_escalation' ||
    proposedChannel === 'human_escalation';

  if (isHumanEscalation) {
    return {
      passed: true,
      rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
      reason: `Action "${proposedAction}" is an internal handoff to a human agent, not direct customer communication; TRAI quiet hours do not apply.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  // IST offset: UTC + 5h 30m
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(proposedTime.getTime() + istOffsetMs);

  const istHours = istDate.getUTCHours();
  const istMinutes = istDate.getUTCMinutes();
  const istSeconds = istDate.getUTCSeconds();
  const timeInMinutes = istHours * 60 + istMinutes;

  const formattedIstTime = `${String(istHours).padStart(2, '0')}:${String(istMinutes).padStart(2, '0')}:${String(istSeconds).padStart(2, '0')} IST`;

  // Quiet hours: [21:00, 09:00) IST
  // 21:00 = 1260 min, 09:00 = 540 min
  const isQuietHours = timeInMinutes >= 1260 || timeInMinutes < 540;

  if (isQuietHours) {
    return {
      passed: false,
      rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
      reason: `Proposed execution time ${formattedIstTime} falls inside TRAI/RBI mandatory quiet hours (21:00 – 09:00 IST). Customer communication and automated retries are prohibited during this period.`,
      context_snapshot: {
        proposed_utc_time: proposedTime.toISOString(),
        calculated_ist_time: formattedIstTime,
        ist_hours: istHours,
        ist_minutes: istMinutes,
        quiet_hours_window: '21:00 – 09:00 IST'
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'TRAI_QUIET_HOURS_2100_0900_IST',
    reason: `Proposed execution time ${formattedIstTime} is within permitted active operating hours (09:00 – 21:00 IST).`,
    context_snapshot: {
      proposed_utc_time: proposedTime.toISOString(),
      calculated_ist_time: formattedIstTime,
      ist_hours: istHours,
      ist_minutes: istMinutes
    }
  };
}

/**
 * 3. RBI_24H_PRE_DEBIT_NOTICE
 * Blocks gateway_retry if failure_events.pre_debit_notice_sent_at is null
 * or less than 24 hours before proposed retry time.
 */
export function checkRbiPreDebitNotice(
  latestFailureEvent: FailureEvent,
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isDebitRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  if (!isDebitRetry) {
    return {
      passed: true,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Action "${proposedAction}" is not an autopay debit; 24-hour pre-debit notice requirement is not applicable.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  const noticeSentAtStr = latestFailureEvent.pre_debit_notice_sent_at;

  if (!noticeSentAtStr) {
    return {
      passed: false,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Mandatory pre-debit notice has not been sent for subscription ${latestFailureEvent.subscription_id}. RBI circular on e-mandates requires at least 24 hours prior intimation to the customer before debit.`,
      context_snapshot: {
        subscription_id: latestFailureEvent.subscription_id,
        failure_event_id: latestFailureEvent.id,
        pre_debit_notice_sent_at: null
      }
    };
  }

  const noticeSentAt = new Date(noticeSentAtStr);
  const diffHours = (proposedTime.getTime() - noticeSentAt.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return {
      passed: false,
      rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
      reason: `Pre-debit notice was sent only ${diffHours.toFixed(1)} hours before proposed debit time (${noticeSentAt.toISOString()}). RBI rules mandate a strict minimum 24-hour notice window.`,
      context_snapshot: {
        subscription_id: latestFailureEvent.subscription_id,
        pre_debit_notice_sent_at: noticeSentAtStr,
        proposed_time: proposedTime.toISOString(),
        hours_elapsed: Number(diffHours.toFixed(2)),
        required_hours: 24
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'RBI_24H_PRE_DEBIT_NOTICE',
    reason: `Pre-debit notice was sent ${diffHours.toFixed(1)} hours prior to scheduled debit, satisfying the mandatory 24-hour notice requirement.`,
    context_snapshot: {
      subscription_id: latestFailureEvent.subscription_id,
      pre_debit_notice_sent_at: noticeSentAtStr,
      proposed_time: proposedTime.toISOString(),
      hours_elapsed: Number(diffHours.toFixed(2)),
      required_hours: 24
    }
  };
}

/**
 * 4. MIN_COOLDOWN_48H
 * Blocks customer-facing outreach if recovery_cases.last_contacted_at is within 48h.
 * If last_contacted_at is null, this rule passes.
 */
export function checkMinCooldown48h(
  recoveryCase: RecoveryCase,
  proposedTime: Date,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isCustomerFacing =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedAction === 'email_notice' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call' ||
    proposedChannel === 'email_notice';

  if (!isCustomerFacing) {
    return {
      passed: true,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Action "${proposedAction}" is not direct customer outreach; 48-hour customer cooldown does not apply.`,
      context_snapshot: {
        proposedAction,
        proposedChannel,
        exempt: true
      }
    };
  }

  const lastContactStr = recoveryCase.last_contacted_at;

  if (!lastContactStr) {
    return {
      passed: true,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Customer has not been contacted previously for recovery case ${recoveryCase.id}; 48-hour cooldown is fully satisfied.`,
      context_snapshot: {
        last_contacted_at: null,
        case_id: recoveryCase.id
      }
    };
  }

  const lastContactDate = new Date(lastContactStr);
  const diffHours = (proposedTime.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60);

  if (diffHours >= 0 && diffHours < 48) {
    return {
      passed: false,
      rule_cited: 'MIN_COOLDOWN_48H',
      reason: `Customer was contacted ${diffHours.toFixed(1)} hours ago (${lastContactDate.toISOString()}). Anti-harassment policy enforces a mandatory 48-hour cooldown between outreach attempts.`,
      context_snapshot: {
        case_id: recoveryCase.id,
        last_contacted_at: lastContactStr,
        proposed_time: proposedTime.toISOString(),
        hours_since_last_contact: Number(diffHours.toFixed(2)),
        required_cooldown_hours: 48
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'MIN_COOLDOWN_48H',
    reason: `Last contact was ${diffHours.toFixed(1)} hours ago, satisfying the minimum 48-hour cooldown threshold.`,
    context_snapshot: {
      case_id: recoveryCase.id,
      last_contacted_at: lastContactStr,
      proposed_time: proposedTime.toISOString(),
      hours_since_last_contact: Number(diffHours.toFixed(2)),
      required_cooldown_hours: 48
    }
  };
}

/**
 * 5. TRAI_DND_CHANNEL_BLOCK
 * Blocks whatsapp_nudge and voice_call specifically (not gateway_retry, not email_notice)
 * if customer.dnd_registered is true.
 */
export function checkTraiDndChannel(
  customer: Customer,
  proposedAction: ProposedAction,
  proposedChannel: ProposedChannel
): ComplianceCheckResult {
  const isRestrictedDndChannel =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call';

  if (!isRestrictedDndChannel) {
    return {
      passed: true,
      rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
      reason: `Channel "${proposedChannel}" (${proposedAction}) is exempt from TRAI DND telemarketing restrictions (e.g. transactional email or backend retry).`,
      context_snapshot: {
        customer_id: customer.id,
        dnd_registered: customer.dnd_registered,
        proposedChannel,
        proposedAction,
        exempt: true
      }
    };
  }

  if (customer.dnd_registered) {
    return {
      passed: false,
      rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
      reason: `Customer ${customer.name} (${customer.phone}) is registered on the National DND Registry. Direct voice calls and promotional WhatsApp messages are prohibited under TRAI regulations.`,
      context_snapshot: {
        customer_id: customer.id,
        customer_name: customer.name,
        phone: customer.phone,
        dnd_registered: true,
        channel_blocked: proposedChannel
      }
    };
  }

  return {
    passed: true,
    rule_cited: 'TRAI_DND_CHANNEL_BLOCK',
    reason: `Customer ${customer.name} is not registered on TRAI DND; channel "${proposedChannel}" is permitted for recovery outreach.`,
    context_snapshot: {
      customer_id: customer.id,
      customer_name: customer.name,
      dnd_registered: false,
      channel_allowed: proposedChannel
    }
  };
}

// ---------------------------------------------------------------------------
// Main Compliance Gate Evaluation
// ---------------------------------------------------------------------------

export function evaluateComplianceGate(input: ComplianceGateInput): ComplianceCheckResult[] {
  const {
    recoveryCase,
    customer,
    latestFailureEvent,
    proposedAction,
    proposedChannel,
    proposedTime
  } = input;

  const results: ComplianceCheckResult[] = [];

  const isDebitRetry =
    proposedAction === 'retry_now' ||
    proposedAction === 'retry_scheduled' ||
    proposedChannel === 'gateway_retry';

  const isCustomerOutreach =
    proposedAction === 'whatsapp_nudge' ||
    proposedAction === 'voice_call' ||
    proposedAction === 'email_notice' ||
    proposedChannel === 'whatsapp_nudge' ||
    proposedChannel === 'voice_call' ||
    proposedChannel === 'email_notice';

  // Rule 1: RBI Max Retries
  results.push(checkRbiMaxRetries(recoveryCase, proposedAction, proposedChannel));

  // Rule 2: TRAI Quiet Hours 21:00 - 09:00 IST
  results.push(checkTraiQuietHours(proposedTime, proposedAction, proposedChannel));

  // Rule 3: RBI 24h Pre-Debit Notice
  if (isDebitRetry) {
    results.push(checkRbiPreDebitNotice(latestFailureEvent, proposedTime, proposedAction, proposedChannel));
  }

  // Rule 4: Min Cooldown 48h
  if (isCustomerOutreach) {
    results.push(checkMinCooldown48h(recoveryCase, proposedTime, proposedAction, proposedChannel));
  }

  // Rule 5: TRAI DND Channel Block
  if (isCustomerOutreach) {
    results.push(checkTraiDndChannel(customer, proposedAction, proposedChannel));
  }

  return results;
}

export function isActionBlocked(results: ComplianceCheckResult[]): boolean {
  return results.some((r) => !r.passed);
}
```

---

### B. Compliance Test Suite Execution
**Command Executed:**
```powershell
npx tsx src/compliance/gate.test.ts
```

**Real Console Output (Execution Time: 120ms):**
```text
=================================================================
 RUNNING COMPLIANCE GATE ENGINE (PHASE 2) UNIT TEST SUITE
=================================================================

--- Testing Rule 1: RBI_MANDATE_MAX_RETRIES_3 ---
  ✓ [PASS] Rule 1 PASS: retry_count = 1 with max 3 allowed
  ✓ [PASS] Rule 1 BLOCK: retry_count = 3 (limit reached)
  ✓ [PASS] Rule 1 BLOCK: retry_count = 4 (exceeded limit)
  ✓ [PASS] Rule 1 EXEMPT: human_escalation when retry_count = 3

--- Testing Rule 2: TRAI_QUIET_HOURS_2100_0900_IST (Boundary & Diurnal Checks) ---
  ✓ [PASS] Rule 2 BLOCK at exact quiet hours start (21:00:00 IST / 15:30:00 UTC)
  ✓ [PASS] Rule 2 PASS at 1 minute before quiet hours (20:59:00 IST / 15:29:00 UTC)
  ✓ [PASS] Rule 2 BLOCK at 1 minute before active window opens (08:59:00 IST / 03:29:00 UTC)
  ✓ [PASS] Rule 2 PASS at exact active window opening (09:00:00 IST / 03:30:00 UTC)
  ✓ [PASS] Rule 2 PASS at midday active hours (14:30:00 IST / 09:00:00 UTC)
  ✓ [PASS] Rule 2 BLOCK in middle of night (02:00:00 IST / 20:30:00 UTC prev day)
  ✓ [PASS] Rule 2 EXEMPT: human_escalation passes quiet-hours regardless of time (e.g. 23:00 IST)

--- Testing Rule 3: RBI_24H_PRE_DEBIT_NOTICE ---
  ✓ [PASS] Rule 3 PASS: Notice sent 28 hours prior to debit retry
  ✓ [PASS] Rule 3 BLOCK: Notice missing (null/undefined)
  ✓ [PASS] Rule 3 BLOCK: Notice sent only 8 hours prior (< 24h requirement)
  ✓ [PASS] Rule 3 EXEMPT: whatsapp_nudge does not require 24h pre-debit notice

--- Testing Rule 4: MIN_COOLDOWN_48H ---
  ✓ [PASS] Rule 4 PASS: Never contacted before (last_contacted_at is null)
  ✓ [PASS] Rule 4 PASS: Contacted 72 hours ago (> 48h cooldown)
  ✓ [PASS] Rule 4 BLOCK: Contacted 14 hours ago (< 48h cooldown)
  ✓ [PASS] Rule 4 EXEMPT: gateway_retry is backend debit, not direct customer ping

--- Testing Rule 5: TRAI_DND_CHANNEL_BLOCK & Regulatory Independence ---
  ✓ [PASS] Rule 5 BLOCK: Customer registered on DND for WhatsApp nudge
  ✓ [PASS] Rule 5 BLOCK: Customer registered on DND for Voice Call
  ✓ [PASS] Rule 5 PASS: Non-DND customer for WhatsApp nudge
  ✓ [PASS] Rule 5 EXEMPT: DND customer for transactional email_notice
  ✓ [PASS] Regulatory Independence Test A: DND registered during daytime (14:00 IST)
  ✓ [PASS] Regulatory Independence Test B: Non-DND customer during quiet hours (23:00 IST)

--- Testing Combined Scenarios (Full Gate Evaluation) ---
  ✓ [PASS] Combined Scenario: FULLY COMPLIANT retry_now (All rules pass)
  ✓ [PASS] Combined Scenario: MULTI-FAILURE (3 rules fail simultaneously on one action)

=================================================================
 ALL 27/27 COMPLIANCE GATE UNIT TESTS PASSED SUCCESSFULLY!
=================================================================
```

---

### C. Real Dataset Evaluation Metrics
**Command Executed:**
```powershell
npx tsx scripts/evaluate_synthetic_dataset.ts
```

**Real Console Output (Execution Time: 210ms):**
```text
================================================================================
 AI REVENUE RECOVERY AGENT — COMPLIANCE GATE DATASET EVALUATION
 Dataset Timestamp: 2026-08-29T04:32:16.605Z | Total Records: 100
================================================================================

### Scenario A — "Immediate Automated Retry"
Policy: proposedAction='retry_now', proposedChannel='gateway_retry', proposedTime=occurred_at
Context: Default automated merchant action: retry debit immediately via payment gateway API at payment failure time
--------------------------------------------------------------------------------
Total Cases Evaluated : 100
Total Cases Blocked   : 70 (70.0%)
Total Cases Passed    : 30 (30.0%)

Rule Breakdown:
| Rule Name                      | Evaluated | Blocked | Passed | (Exempt) |
| :----------------------------- | --------: | ------: | -----: | -------: |
| RBI_MANDATE_MAX_RETRIES_3      |       100 |      10 |     90 |        0 |
| TRAI_QUIET_HOURS_2100_0900_IST |       100 |      51 |     49 |        0 |
| RBI_24H_PRE_DEBIT_NOTICE       |       100 |      29 |     71 |        0 |
| MIN_COOLDOWN_48H               |         0 |       0 |      0 |        0 |
| TRAI_DND_CHANNEL_BLOCK         |         0 |       0 |      0 |        0 |
--------------------------------------------------------------------------------

### Scenario B — "Customer Outreach Nudge (WhatsApp)"
Policy: proposedAction='whatsapp_nudge', proposedChannel='whatsapp_nudge', proposedTime=occurred_at
Context: Direct consumer communication: interactive payment link & recovery nudge dispatched via WhatsApp
--------------------------------------------------------------------------------
Total Cases Evaluated : 100
Total Cases Blocked   : 68 (68.0%)
Total Cases Passed    : 32 (32.0%)

Rule Breakdown:
| Rule Name                      | Evaluated | Blocked | Passed | (Exempt) |
| :----------------------------- | --------: | ------: | -----: | -------: |
| RBI_MANDATE_MAX_RETRIES_3      |       100 |       0 |    100 |      100 |
| TRAI_QUIET_HOURS_2100_0900_IST |       100 |      51 |     49 |        0 |
| RBI_24H_PRE_DEBIT_NOTICE       |         0 |       0 |      0 |        0 |
| MIN_COOLDOWN_48H               |       100 |      16 |     84 |        0 |
| TRAI_DND_CHANNEL_BLOCK         |       100 |      25 |     75 |        0 |
--------------------------------------------------------------------------------

================================================================================
 THEORETICAL EXPECTATION VS ACTUAL RESULTS RECONCILIATION
================================================================================
| Scenario   | Rule Name                      | Expected | Actual | Delta | Status | Rationale |
| :--------- | :----------------------------- | -------: | -----: | ----: | :----: | :-------- |
| Scen A     | RBI_MANDATE_MAX_RETRIES_3      |       10 |     10 |     0 | ✓ MATCH | i % 10 === 0 -> 10 cases have retry_count=3 |
| Scen A     | TRAI_QUIET_HOURS_2100_0900_IST |       51 |     51 |     0 | ✓ MATCH | 12 of 24 UTC hours fall in 21:00-09:00 IST (exact discrete sum = 51) |
| Scen A     | RBI_24H_PRE_DEBIT_NOTICE       |       29 |     29 |     0 | ✓ MATCH | 14 missing (i%7=0) + 15 late notices (i%7=1) = 29 |
| Scen A     | MIN_COOLDOWN_48H               |        0 |      0 |     0 | ✓ MATCH | Exempt: gateway_retry is backend debit, not customer outreach |
| Scen A     | TRAI_DND_CHANNEL_BLOCK         |        0 |      0 |     0 | ✓ MATCH | Exempt: backend debit not subject to telemarketing DND |
| Scen B     | RBI_MANDATE_MAX_RETRIES_3      |        0 |      0 |     0 | ✓ MATCH | Exempt: customer nudge is not an automated debit attempt |
| Scen B     | TRAI_QUIET_HOURS_2100_0900_IST |       51 |     51 |     0 | ✓ MATCH | Customer outreach prohibited between 21:00 and 09:00 IST |
| Scen B     | RBI_24H_PRE_DEBIT_NOTICE       |        0 |      0 |     0 | ✓ MATCH | Exempt: 24h pre-debit notice only applies to debit transactions |
| Scen B     | MIN_COOLDOWN_48H               |       16 |     16 |     0 | ✓ MATCH | i % 6 === 0 -> 16 cases contacted within last 8-24 hours |
| Scen B     | TRAI_DND_CHANNEL_BLOCK         |       25 |     25 |     0 | ✓ MATCH | i % 4 === 0 -> 25 cases registered on TRAI National DND |
================================================================================
```

---

## 4. Decision / Diagnosis Engine (Phase 3)

**Status:** Code files exist on disk from earlier phase development (`src/diagnosis/root_cause_classifier.ts`, `src/decision/intervention_policy.ts`, `src/decision/stopping_rules.ts`, `src/decision/compliance_gate.ts`), but they reflect the **pre-Phase-2 flat database structure** (using fields like `failure_reason_code` and `mandate_status` directly on `subscriptions`) rather than the normalized Phase 2 relational schema.

### Relevant Source Code: `src/diagnosis/root_cause_classifier.ts` (97 lines)
```typescript
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { AuditLogger } from '../audit/audit_logger';

export type RootCause = 
  | 'retry_later'
  | 'update_payment_method'
  | 'requires_new_mandate'
  | 'retry_immediate'
  | 'unknown';

export interface DiagnosisResult {
  subscription_id: string;
  root_cause: RootCause;
  confidence: number;
  explanation: string;
  is_recoverable_via_mandate_retry: boolean;
}

export class RootCauseClassifier {
  public static diagnose(event: AtRiskSubscriptionEvent): DiagnosisResult {
    let rootCause: RootCause = 'unknown';
    let confidence = 1.0;
    let explanation = '';
    let isRecoverableViaRetry = false;

    switch (event.failure_reason_code) {
      case 'insufficient_funds':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Decline due to insufficient funds. Balance typically refreshes on salary cycles or subsequent calendar days. Optimal window is +24h retry.`;
        break;

      case 'card_expired':
        rootCause = 'update_payment_method';
        isRecoverableViaRetry = false;
        explanation = `Underlying payment card has expired. Automated retries against this card token will strictly fail. Customer must update payment details.`;
        break;

      case 'bank_declined':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Issuing bank declined the debit (temporary fraud check or network throttle). Safe to reattempt after cool-off window.`;
        break;

      case 'daily_limit_exceeded':
        rootCause = 'retry_later';
        isRecoverableViaRetry = true;
        explanation = `Customer exceeded per-day transaction or mandate limit. Limit resets midnight; schedule retry for next diurnal cycle.`;
        break;

      case 'mandate_revoked':
        rootCause = 'requires_new_mandate';
        isRecoverableViaRetry = false;
        explanation = `Customer or bank has explicitly cancelled/revoked the e-mandate registration. Automated retries are prohibited by RBI / NPCI rules; new authentication required.`;
        break;

      case 'technical_error':
        rootCause = 'retry_immediate';
        isRecoverableViaRetry = true;
        explanation = `Transient gateway or NPCI switch timeout. Mandate token is healthy; immediate retry has high probability of settlement.`;
        break;

      default:
        rootCause = 'unknown';
        confidence = 0.5;
        isRecoverableViaRetry = false;
        explanation = `Unrecognized failure code '${event.failure_reason_code}'. Requires manual inspection.`;
        break;
    }

    AuditLogger.log({
      event_type: 'DIAGNOSIS',
      subscription_id: event.subscription_id,
      decision: rootCause.toUpperCase(),
      reasoning: `Diagnosed failure_reason_code "${event.failure_reason_code}" as "${rootCause}" with confidence ${confidence}. ${explanation}`,
      action_taken: 'PROCEED_TO_DECISION',
      result: rootCause,
      metadata: {
        failure_reason_code: event.failure_reason_code,
        confidence,
        is_recoverable_via_mandate_retry: isRecoverableViaRetry
      }
    });

    return {
      subscription_id: event.subscription_id,
      root_cause: rootCause,
      confidence,
      explanation,
      is_recoverable_via_mandate_retry: isRecoverableViaRetry
    };
  }
}
```

---

## 5. Execution Layer (Payment Gateway / Twilio / Resend Integrations)

**Honest Integration Status:**
- **Payment Gateway API:** **STUBBED / SIMULATED**. Proved by lines 40-42 of `src/execution/mandate_retry_executor.ts` (commented out `// TODO: Connect to live Payment Gateway Test-Mode API`). It uses `Math.random()` to simulate success rates and creates mock IDs like `pay_test_${random}`.
- **Twilio (Voice/SMS):** **STUBBED / SIMULATED**. Hinglish Voice Agent generates simulated code-switched scripts and writes JSON records to `data/synthetic/voice_call_transcripts.json`. No live SIP or telephony credentials are wired.
- **Resend / Email:** **STUBBED / SIMULATED**. Direct notification dispatch returns mock message IDs (`msg_${random}`).

### Proving Code from Disk: `src/execution/mandate_retry_executor.ts` (lines 40–73)
```typescript
    // TODO: Connect to live Payment Gateway Test-Mode API using gateway node SDK or fetch:
    // const gateway = new PaymentGateway({ key_id: process.env.GATEWAY_KEY_ID, key_secret: process.env.GATEWAY_KEY_SECRET });
    // const chargeResult = await gateway.subscriptions.chargeSubscription(event.subscription_id, { amount: event.amount * 100 });

    // Realistic weighted recovery probability based on root cause
    let successProbability = 0.0;
    switch (event.failure_reason_code) {
      case 'technical_error':
        successProbability = 0.85; // high chance of recovery upon transient glitch
        break;
      case 'daily_limit_exceeded':
        successProbability = 0.65; // high chance once limit window resets
        break;
      case 'bank_declined':
        successProbability = 0.50; // moderate chance after bank throttle clear
        break;
      case 'insufficient_funds':
        successProbability = 0.40; // 40% chance after 24h cooldown/deposit
        break;
      case 'card_expired':
      case 'mandate_revoked':
      default:
        successProbability = 0.0;
        break;
    }

    const randomRoll = Math.random();
    const isSuccess = randomRoll < successProbability;

    const newRetryCount = event.retry_count_so_far + 1;
    const nowIso = new Date().toISOString();
    const mockPaymentId = isSuccess ? `pay_test_${Math.random().toString(36).substring(2, 12)}` : undefined;
```

---

## 6. Frontend

### A. Font Verification
- **File:** `src/app/globals.css` (Line 17):  
  `font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
- **File:** `tailwind.config.js` (Line 37):  
  `sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],`
- **Font Import:** No remote Google font download or `next/font` loader is configured in `layout.tsx`; it relies on local system fallback `Inter` CSS tokens.

---

### B. Color Tokens Actually Used on Disk
Grep results from `src/app/`:
- Background tones: `#060911`, `#070b14`, `#080d1a`, `#0c1424`, `#0e1626`
- Gradient surfaces: `from-[#11192e] to-[#1a1730]`, `from-[#1c1224] to-[#121628]`, `from-[#0f1d2c] to-[#0d1626]`, `from-[#12192c] to-[#181a2e]`
- Accent colors: `#10b981` (Emerald Recovery Primary), `#f59e0b` (Amber Accent), `#06b6d4` (Cyan Accent), `#f43f5e` (Rose Danger)

---

### C. Live Browser Screenshots (Fresh Captures)

```carousel
![01 Executive Dashboard](file:///c:/Users/ramav/.gemini/antigravity-ide/brain/c9332e99-f49a-4336-9bc1-400fa53f3f1a/dashboard_main_1787978017353.png)
<!-- slide -->
![02 Case Portfolio](file:///c:/Users/ramav/.gemini/antigravity-ide/brain/c9332e99-f49a-4336-9bc1-400fa53f3f1a/dashboard_cases_1787978117468.png)
<!-- slide -->
![03 Case Detail View](file:///c:/Users/ramav/.gemini/antigravity-ide/brain/c9332e99-f49a-4336-9bc1-400fa53f3f1a/dashboard_case_detail_1787978134564.png)
<!-- slide -->
![04 Immutable Audit Ledger](file:///c:/Users/ramav/.gemini/antigravity-ide/brain/c9332e99-f49a-4336-9bc1-400fa53f3f1a/dashboard_audit_1787978169041.png)
<!-- slide -->
![05 Voice AI Showcase](file:///c:/Users/ramav/.gemini/antigravity-ide/brain/c9332e99-f49a-4336-9bc1-400fa53f3f1a/dashboard_voice_1787978196441.png)
```

> [!WARNING]
> **Live Browser Diagnostics Finding:**  
> All 5 frontend routes render HTML cleanly, but currently display empty/zero states because the dashboard API endpoints (`/api/dashboard/summary`, `/api/dashboard/funnel`, `/api/cases`, `/api/batch/run`) query against the legacy Phase 1 table/column names (`mandate_status`, `interventions`, `promises_to_pay`) which do not exist in the normalized Phase 2 schema (`sqlite_schema.sql`).

---

## 7. Tests Overall

### Command Executed:
```powershell
npx tsx src/tests/run_tests.ts
```

### Real Command Output:
```text
=================================================================
 RUNNING AI REVENUE RECOVERY AGENT — FULL SYSTEM UNIT TESTS
=================================================================
=================================================================
 RUNNING COMPLIANCE GATE ENGINE (PHASE 2) UNIT TEST SUITE
=================================================================

--- Testing Rule 1: RBI_MANDATE_MAX_RETRIES_3 ---
  ✓ [PASS] Rule 1 PASS: retry_count = 1 with max 3 allowed
  ✓ [PASS] Rule 1 BLOCK: retry_count = 3 (limit reached)
  ✓ [PASS] Rule 1 BLOCK: retry_count = 4 (exceeded limit)
  ✓ [PASS] Rule 1 EXEMPT: human_escalation when retry_count = 3

--- Testing Rule 2: TRAI_QUIET_HOURS_2100_0900_IST (Boundary & Diurnal Checks) ---
  ✓ [PASS] Rule 2 BLOCK at exact quiet hours start (21:00:00 IST / 15:30:00 UTC)
  ✓ [PASS] Rule 2 PASS at 1 minute before quiet hours (20:59:00 IST / 15:29:00 UTC)
  ✓ [PASS] Rule 2 BLOCK at 1 minute before active window opens (08:59:00 IST / 03:29:00 UTC)
  ✓ [PASS] Rule 2 PASS at exact active window opening (09:00:00 IST / 03:30:00 UTC)
  ✓ [PASS] Rule 2 PASS at midday active hours (14:30:00 IST / 09:00:00 UTC)
  ✓ [PASS] Rule 2 BLOCK in middle of night (02:00:00 IST / 20:30:00 UTC prev day)
  ✓ [PASS] Rule 2 EXEMPT: human_escalation passes quiet-hours regardless of time (e.g. 23:00 IST)

--- Testing Rule 3: RBI_24H_PRE_DEBIT_NOTICE ---
  ✓ [PASS] Rule 3 PASS: Notice sent 28 hours prior to debit retry
  ✓ [PASS] Rule 3 BLOCK: Notice missing (null/undefined)
  ✓ [PASS] Rule 3 BLOCK: Notice sent only 8 hours prior (< 24h requirement)
  ✓ [PASS] Rule 3 EXEMPT: whatsapp_nudge does not require 24h pre-debit notice

--- Testing Rule 4: MIN_COOLDOWN_48H ---
  ✓ [PASS] Rule 4 PASS: Never contacted before (last_contacted_at is null)
  ✓ [PASS] Rule 4 PASS: Contacted 72 hours ago (> 48h cooldown)
  ✓ [PASS] Rule 4 BLOCK: Contacted 14 hours ago (< 48h cooldown)
  ✓ [PASS] Rule 4 EXEMPT: gateway_retry is backend debit, not direct customer ping

--- Testing Rule 5: TRAI_DND_CHANNEL_BLOCK & Regulatory Independence ---
  ✓ [PASS] Rule 5 BLOCK: Customer registered on DND for WhatsApp nudge
  ✓ [PASS] Rule 5 BLOCK: Customer registered on DND for Voice Call
  ✓ [PASS] Rule 5 PASS: Non-DND customer for WhatsApp nudge
  ✓ [PASS] Rule 5 EXEMPT: DND customer for transactional email_notice
  ✓ [PASS] Regulatory Independence Test A: DND registered during daytime (14:00 IST)
  ✓ [PASS] Regulatory Independence Test B: Non-DND customer during quiet hours (23:00 IST)

--- Testing Combined Scenarios (Full Gate Evaluation) ---
  ✓ [PASS] Combined Scenario: FULLY COMPLIANT retry_now (All rules pass)
  ✓ [PASS] Combined Scenario: MULTI-FAILURE (3 rules fail simultaneously on one action)

=================================================================
 ALL 27/27 COMPLIANCE GATE UNIT TESTS PASSED SUCCESSFULLY!
=================================================================


=================================================================
 ALL TESTS PASSED SUCCESSFULLY (27/27 Unit Tests)
=================================================================
```

---

## 8. Known Gaps / Honesty Check (Phase-by-Phase Breakdown)

| Phase | Department / Module | Status | Evidence & Reality Check |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Data Model & Schema** | **Partially Built / Diverged** | SQLite schema (`sqlite_schema.sql`) and Postgres schema (`schema.sql`) exist with 100 synthetic cases seeded. However, API endpoints and older agent files expect Phase 1 schema, causing runtime SQLite errors on dashboard fetch. |
| **Phase 2** | **Compliance Gate Engine** | **100% Complete & Verified** | Full pure-function compliance gate in `src/compliance/gate.ts`. 27/27 unit tests pass with mathematical reconciliation across 100 cases. |
| **Phase 3** | **Decision Engine (Root Cause & Policy)** | **Partially Built (Needs Phase 2 Schema Wire-up)** | Rule logic in `root_cause_classifier.ts` and `intervention_policy.ts` exists in isolation, but queries legacy subscription fields. Not yet updated to read normalized `failure_events` and `recovery_cases`. |
| **Phase 4** | **Execution Layer** | **Stubbed / Simulated** | Payment gateway charging and Twilio calls are simulated via `Math.random()` and local JSON files. No live API credentials connected. |
| **Phase 5** | **Dashboard UI** | **Complete Visual Shell / Blocked API** | Next.js 16 Dark glassmorphism UI is fully built with 5 routes. Pages render, but display 0/empty states because API routes fail SQLite queries against new tables. |
| **Phase 6** | **Voice Layer** | **Mocked / Script-Gen Only** | Hinglish script generation and prompt formulation work, but audio synthesis/Twilio SIP media streams are not wired to physical telephony. |
