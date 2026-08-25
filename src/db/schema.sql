-- AI Revenue Recovery Agent Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    mandate_status TEXT NOT NULL,
    failure_reason_code TEXT NOT NULL,
    retry_count_so_far INTEGER NOT NULL DEFAULT 0,
    last_attempt_timestamp TEXT NOT NULL,
    customer_segment TEXT NOT NULL,
    previous_payment_history TEXT NOT NULL,
    recent_contact_count_48h INTEGER NOT NULL DEFAULT 0,
    contact_history TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interventions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    outcome TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id)
);

-- Promise-to-Pay (PTP) State Machine Tracking
CREATE TABLE IF NOT EXISTS promises_to_pay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    amount REAL NOT NULL,
    promised_date TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PROMISED', -- 'PROMISED', 'DUE', 'KEPT', 'BROKEN'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    channel TEXT NOT NULL DEFAULT 'voice_recovery',
    metadata TEXT,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id)
);

-- Immutable Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    subscription_id TEXT NOT NULL,
    decision TEXT,
    reasoning TEXT NOT NULL,
    action_taken TEXT,
    result TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT
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
