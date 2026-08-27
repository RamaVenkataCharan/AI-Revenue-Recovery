-- ============================================================================
-- AI REVENUE RECOVERY AGENT — SUPABASE / POSTGRES SCHEMA MIGRATION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'OTT', 'SaaS', 'Fintech', 'EdTech', 'Fitness'
    support_email TEXT NOT NULL,
    webhook_secret TEXT NOT NULL,
    rbi_mandate_id_prefix TEXT NOT NULL DEFAULT 'RPR_',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en', -- 'en', 'hi', 'hinglish'
    dnd_registered BOOLEAN NOT NULL DEFAULT FALSE,
    tier TEXT NOT NULL DEFAULT 'standard', -- 'vip', 'standard', 'at_risk'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
    payment_method TEXT NOT NULL, -- 'upi_autopay', 'e_mandate_netbanking', 'e_mandate_card', 'recurring_card'
    mandate_token TEXT NOT NULL,
    mandate_expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'failing', 'grace_period', 'cancelled', 'recovered'
    current_cycle_start TIMESTAMPTZ NOT NULL,
    current_cycle_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PAYMENT ATTEMPTS
CREATE TABLE IF NOT EXISTS payment_attempts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    gateway TEXT NOT NULL DEFAULT 'razorpay',
    gateway_payment_id TEXT,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    error_code TEXT,      -- e.g. 'BAD_REQUEST_INSUFFICIENT_FUNDS', 'GATEWAY_TIMEOUT'
    error_description TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 5. FAILURE EVENTS
CREATE TABLE IF NOT EXISTS failure_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_attempt_id TEXT NOT NULL REFERENCES payment_attempts(id) ON DELETE CASCADE,
    failure_category TEXT NOT NULL, -- 'insufficient_funds', 'expired_mandate', 'bank_timeout', 'technical_decline'
    raw_error_code TEXT NOT NULL,
    raw_error_message TEXT NOT NULL,
    pre_debit_notice_sent_at TIMESTAMPTZ,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_webhook_payload JSONB DEFAULT '{}'::jsonb
);

-- 6. RECOVERY CASES
CREATE TABLE IF NOT EXISTS recovery_cases (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    latest_failure_event_id TEXT REFERENCES failure_events(id),
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'ptp_pending', 'recovered', 'exhausted', 'escalated_human', 'written_off'
    recovery_strategy TEXT,              -- 'salary_cycle_retry', 'smart_nudge', 'voice_escalation', 'mandate_refresh'
    total_amount_due NUMERIC(10, 2) NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries_allowed INTEGER NOT NULL DEFAULT 3, -- Hard RBI limit
    last_contacted_at TIMESTAMPTZ,
    next_scheduled_action_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INTERVENTION ACTIONS
CREATE TABLE IF NOT EXISTS intervention_actions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recovery_case_id TEXT NOT NULL REFERENCES recovery_cases(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'gateway_retry', 'whatsapp_nudge', 'email_notice', 'voice_call', 'human_escalation'
    action_type TEXT NOT NULL, -- 'retry_now', 'retry_scheduled', 'pre_debit_notice', 'interactive_nudge', 'hinglish_call', 'manual_review'
    reasoning TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'executed', -- 'scheduled', 'executed', 'failed', 'blocked_by_compliance'
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. COMPLIANCE CHECKS (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS compliance_checks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recovery_case_id TEXT NOT NULL REFERENCES recovery_cases(id) ON DELETE CASCADE,
    proposed_action TEXT NOT NULL,
    proposed_channel TEXT NOT NULL,
    proposed_time TIMESTAMPTZ NOT NULL,
    passed BOOLEAN NOT NULL,
    rule_cited TEXT NOT NULL, -- 'RBI_MANDATE_MAX_RETRIES_3', 'TRAI_DND_QUIET_HOURS', 'RBI_24H_PRE_DEBIT_NOTICE', 'MIN_COOLDOWN_48H'
    reason TEXT NOT NULL,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PROMISE TO PAY
CREATE TABLE IF NOT EXISTS promise_to_pay (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recovery_case_id TEXT NOT NULL REFERENCES recovery_cases(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    promised_amount NUMERIC(10, 2) NOT NULL,
    promised_date DATE NOT NULL,
    channel_captured TEXT NOT NULL, -- 'whatsapp_interactive', 'voice_agent', 'email_link'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'fulfilled', 'broken', 'cancelled'
    follow_up_scheduled_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 10. AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    trace_id TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
    entity_type TEXT NOT NULL, -- 'recovery_case', 'compliance_check', 'intervention', 'promise_to_pay', 'llm_decision'
    entity_id TEXT NOT NULL,
    actor TEXT NOT NULL, -- 'ai_orchestrator', 'claude_decision_engine', 'compliance_gate', 'webhook_listener', 'customer'
    action TEXT NOT NULL,
    input_payload JSONB DEFAULT '{}'::jsonb,
    output_payload JSONB DEFAULT '{}'::jsonb,
    reasoning TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & regulatory queries
CREATE INDEX IF NOT EXISTS idx_recovery_cases_status ON recovery_cases(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_case ON compliance_checks(recovery_case_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_passed ON compliance_checks(passed);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ptp_status_date ON promise_to_pay(status, promised_date);
