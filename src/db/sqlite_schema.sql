-- ============================================================================
-- AI REVENUE RECOVERY AGENT — CANONICAL SQLITE SCHEMA (FLAT RELATIONAL BUILD)
-- ============================================================================
-- This is the SINGLE source of truth for the database structure.
-- All modules (seed, detection, diagnosis, decision, execution, tracking,
-- orchestrator, API routes) are written against these exact tables and columns.
--
-- The canonical compliance engine (src/compliance/gate.ts) is bridged seamlessly
-- via src/compliance/adapter.ts.
-- ============================================================================

-- 1. SUBSCRIPTIONS (Flat denormalized — one row per at-risk subscription)
--    Seeded from data/synthetic/failed_subscriptions.json via src/db/seed.ts
CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id          TEXT PRIMARY KEY,
    customer_id              TEXT NOT NULL,
    customer_name            TEXT NOT NULL,
    phone                    TEXT NOT NULL DEFAULT '+919876543210',
    amount                   REAL NOT NULL,
    currency                 TEXT NOT NULL DEFAULT 'INR',
    mandate_status           TEXT NOT NULL DEFAULT 'failed',
    failure_reason_code      TEXT NOT NULL,
    retry_count_so_far       INTEGER NOT NULL DEFAULT 0,
    last_attempt_timestamp   TEXT NOT NULL,
    customer_segment         TEXT NOT NULL DEFAULT 'standard',
    previous_payment_history TEXT NOT NULL DEFAULT 'on_time',
    dnd_registered           INTEGER NOT NULL DEFAULT 0,
    recent_contact_count_48h INTEGER NOT NULL DEFAULT 0,
    last_contacted_at        TEXT,
    contact_history          TEXT,
    pre_debit_notice_sent_at TEXT,
    next_scheduled_action_at TEXT,
    updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. INTERVENTIONS (Actions taken on a subscription — gateway retries, nudges, voice calls)
CREATE TABLE IF NOT EXISTS interventions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id   TEXT NOT NULL,
    action_type       TEXT NOT NULL,
    reasoning         TEXT NOT NULL,
    outcome           TEXT NOT NULL,
    timestamp         TEXT NOT NULL DEFAULT (datetime('now')),
    metadata          TEXT,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE
);

-- 3. PROMISES TO PAY (Voice recovery commitments)
CREATE TABLE IF NOT EXISTS promises_to_pay (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id   TEXT NOT NULL,
    customer_id       TEXT NOT NULL,
    amount            REAL NOT NULL,
    promised_date     TEXT NOT NULL,
    state             TEXT NOT NULL DEFAULT 'PROMISED',
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at       TEXT,
    channel           TEXT NOT NULL DEFAULT 'voice_recovery',
    metadata          TEXT,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id) ON DELETE CASCADE
);

-- 4. AUDIT LOG (Strictly Append-Only — regulatory compliance trail)
CREATE TABLE IF NOT EXISTS audit_log (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type        TEXT NOT NULL,
    subscription_id   TEXT NOT NULL,
    decision          TEXT,
    reasoning         TEXT NOT NULL,
    action_taken      TEXT,
    result            TEXT,
    timestamp         TEXT NOT NULL DEFAULT (datetime('now')),
    metadata          TEXT
);

-- 5. RECOVERY METRICS (Batch run aggregate summaries)
CREATE TABLE IF NOT EXISTS recovery_metrics (
    batch_id                      TEXT PRIMARY KEY,
    total_at_risk                 REAL NOT NULL,
    total_recovered               REAL NOT NULL,
    recovery_rate_pct             REAL NOT NULL,
    stopping_rule_triggers_count  INTEGER NOT NULL DEFAULT 0,
    compliance_gate_blocks_count  INTEGER NOT NULL DEFAULT 0,
    exceptions_count              INTEGER NOT NULL DEFAULT 0,
    voice_calls_placed_count      INTEGER NOT NULL DEFAULT 0,
    promises_made_count           INTEGER NOT NULL DEFAULT 0,
    promises_kept_count           INTEGER NOT NULL DEFAULT 0,
    promises_broken_count         INTEGER NOT NULL DEFAULT 0,
    voice_recovered_amount        REAL NOT NULL DEFAULT 0,
    gateway_recovered_amount      REAL NOT NULL DEFAULT 0,
    timestamp                     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_mandate_status ON subscriptions(mandate_status);
CREATE INDEX IF NOT EXISTS idx_interventions_subscription ON interventions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ptp_subscription ON promises_to_pay(subscription_id);
CREATE INDEX IF NOT EXISTS idx_ptp_state ON promises_to_pay(state);
CREATE INDEX IF NOT EXISTS idx_audit_log_subscription ON audit_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);

-- ============================================================================
-- APPEND-ONLY REGULATORY INTEGRITY TRIGGERS (SQLite)
-- RBI/TRAI audit trail must be immutable — no UPDATE or DELETE permitted.
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'REGULATORY VIOLATION: audit_log is strictly append-only. UPDATE operations are forbidden per RBI compliance audit requirements.');
END;

CREATE TRIGGER IF NOT EXISTS trg_audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'REGULATORY VIOLATION: audit_log is strictly append-only. DELETE operations are forbidden per RBI compliance audit requirements.');
END;
