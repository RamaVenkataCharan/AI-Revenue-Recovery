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
    gateway TEXT NOT NULL DEFAULT 'razorpay',
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
