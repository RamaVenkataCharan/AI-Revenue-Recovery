/**
 * @module Type definitions for the AI Revenue Recovery Agent.
 *
 * Two schema generations exist:
 *   1. FLAT SCHEMA (active) — used by all runtime modules (seed, detection,
 *      diagnosis, decision, execution, tracking, orchestrator, API routes).
 *      The canonical interface is `FlatSubscriptionRecord`.
 *
 *   2. NORMALIZED SCHEMA (Phase 2) — designed for production-grade relational
 *      integrity. Used by src/compliance/gate.ts and src/compliance/adapter.ts.
 *      Interfaces: Merchant, Customer, Subscription, PaymentAttempt,
 *      FailureEvent, RecoveryCase, InterventionAction, etc.
 */

// ============================================================================
// FLAT SCHEMA TYPES (ACTIVE RUNTIME)
// ============================================================================

/**
 * Flat denormalized subscription record — matches the `subscriptions` table
 * in sqlite_schema.sql and the JSON shape in failed_subscriptions.json.
 *
 * This is the canonical input type consumed by:
 * - SubscriptionFailureDetector.detect()
 * - RootCauseClassifier.diagnose()
 * - InterventionPolicy.decide()
 * - StoppingRules.evaluate()
 * - ComplianceGate.evaluate() (src/decision/compliance_gate.ts)
 * - MandateRetryExecutor
 * - HinglishVoiceAgent
 * - PromiseToPayTracker
 *
 * NOTE: The `AtRiskSubscriptionEvent` interface in subscription_failure_detector.ts
 * is structurally identical to this type. Both exist for historical reasons;
 * AtRiskSubscriptionEvent is the import used by all downstream modules.
 */
export interface FlatSubscriptionRecord {
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  phone?: string;
  amount: number;
  currency: string;
  mandate_status: string;
  failure_reason_code: string;
  retry_count_so_far: number;
  last_attempt_timestamp: string;
  customer_segment: 'high_value' | 'standard' | 'at_risk';
  previous_payment_history: 'on_time' | 'occasional_delay' | 'frequent_delay';
  dnd_registered?: boolean | number;
  recent_contact_count_48h: number;
  last_contacted_at?: string;
  contact_history?: string[];
  pre_debit_notice_sent_at?: string;
  next_scheduled_action_at?: string;
  updated_at?: string;
}

/**
 * Flat intervention record — matches the `interventions` table.
 */
export interface FlatInterventionRecord {
  id?: number;
  subscription_id: string;
  action_type: string;
  reasoning: string;
  outcome: string;
  timestamp: string;
  metadata?: string;
}

/**
 * Flat promise-to-pay record — matches the `promises_to_pay` table.
 */
export interface FlatPromiseToPayRecord {
  id?: number;
  subscription_id: string;
  customer_id: string;
  amount: number;
  promised_date: string;
  state: 'PROMISED' | 'DUE' | 'KEPT' | 'BROKEN';
  created_at: string;
  resolved_at?: string;
  channel: string;
  metadata?: string;
}

/**
 * Flat audit log entry — matches the `audit_log` table.
 * This table is strictly append-only (enforced by SQLite triggers).
 */
export interface FlatAuditLogEntry {
  id?: number;
  event_type: string;
  subscription_id: string;
  decision?: string;
  reasoning: string;
  action_taken?: string;
  result?: string;
  timestamp: string;
  metadata?: string;
}

// ============================================================================
// NORMALIZED SCHEMA TYPES (PHASE 2 — NOT ACTIVE IN RUNTIME)
// ============================================================================
// These types are consumed by src/compliance/gate.ts and adapted via
// src/compliance/adapter.ts for complete regulatory verification.
// ============================================================================

/** @phase2 — Normalized schema. Not active in current runtime. */
export type MerchantCategory = 'OTT' | 'SaaS' | 'Fintech' | 'EdTech' | 'Fitness';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  support_email: string;
  webhook_secret: string;
  rbi_mandate_id_prefix: string;
  created_at: string;
}

/** @phase2 */
export type CustomerTier = 'vip' | 'standard' | 'at_risk';
/** @phase2 */
export type PreferredLanguage = 'en' | 'hi' | 'hinglish';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  email: string;
  preferred_language: PreferredLanguage;
  dnd_registered: boolean;
  tier: CustomerTier;
  created_at: string;
}

/** @phase2 */
export type PaymentMethod = 'upi_autopay' | 'e_mandate_netbanking' | 'e_mandate_card' | 'recurring_card';
/** @phase2 */
export type SubscriptionStatus = 'active' | 'failing' | 'grace_period' | 'cancelled' | 'recovered';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface Subscription {
  id: string;
  merchant_id: string;
  customer_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  payment_method: PaymentMethod;
  mandate_token: string;
  mandate_expiry_date: string;
  status: SubscriptionStatus;
  current_cycle_start: string;
  current_cycle_end: string;
  created_at: string;
  updated_at: string;
}

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface PaymentAttempt {
  id: string;
  subscription_id: string;
  attempt_number: number;
  amount: number;
  currency: string;
  gateway: string;
  gateway_payment_id?: string;
  status: 'success' | 'failed' | 'pending';
  error_code?: string;
  error_description?: string;
  attempted_at: string;
  metadata?: Record<string, any>;
}

/** @phase2 */
export type FailureCategory = 'insufficient_funds' | 'expired_mandate' | 'bank_timeout' | 'technical_decline';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface FailureEvent {
  id: string;
  subscription_id: string;
  payment_attempt_id: string;
  failure_category: FailureCategory;
  raw_error_code: string;
  raw_error_message: string;
  pre_debit_notice_sent_at?: string;
  occurred_at: string;
  raw_webhook_payload?: Record<string, any>;
}

/** @phase2 */
export type RecoveryCaseStatus =
  | 'open'
  | 'in_progress'
  | 'ptp_pending'
  | 'recovered'
  | 'exhausted'
  | 'escalated_human'
  | 'written_off';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface RecoveryCase {
  id: string;
  subscription_id: string;
  latest_failure_event_id?: string;
  status: RecoveryCaseStatus;
  recovery_strategy?: string;
  total_amount_due: number;
  retry_count: number;
  max_retries_allowed: number;
  last_contacted_at?: string;
  next_scheduled_action_at?: string;
  opened_at: string;
  resolved_at?: string;
  updated_at: string;
}

/** @phase2 */
export type InterventionChannel =
  | 'gateway_retry'
  | 'whatsapp_nudge'
  | 'email_notice'
  | 'voice_call'
  | 'human_escalation';

/** @phase2 */
export type InterventionActionType =
  | 'retry_now'
  | 'retry_scheduled'
  | 'pre_debit_notice'
  | 'interactive_nudge'
  | 'hinglish_call'
  | 'manual_review';

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface InterventionAction {
  id: string;
  recovery_case_id: string;
  channel: InterventionChannel;
  action_type: InterventionActionType;
  reasoning: string;
  status: 'scheduled' | 'executed' | 'failed' | 'blocked_by_compliance';
  payload?: Record<string, any>;
  result?: Record<string, any>;
  executed_at: string;
}

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface ComplianceCheckResult {
  id?: string;
  recovery_case_id: string;
  proposed_action: string;
  proposed_channel: string;
  proposed_time: string;
  passed: boolean;
  rule_cited: string;
  reason: string;
  context_snapshot?: Record<string, any>;
  created_at?: string;
}

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface PromiseToPay {
  id: string;
  recovery_case_id: string;
  customer_id: string;
  promised_amount: number;
  promised_date: string;
  channel_captured: 'whatsapp_interactive' | 'voice_agent' | 'email_link';
  status: 'active' | 'fulfilled' | 'broken' | 'cancelled';
  follow_up_scheduled_at: string;
  created_at: string;
  resolved_at?: string;
}

/** @phase2 — Normalized schema. Not active in current runtime. */
export interface AuditLogEntry {
  id?: string;
  trace_id?: string;
  entity_type: 'recovery_case' | 'compliance_check' | 'intervention' | 'promise_to_pay' | 'llm_decision';
  entity_id: string;
  actor: 'ai_orchestrator' | 'claude_decision_engine' | 'compliance_gate' | 'webhook_listener' | 'customer';
  action: string;
  input_payload?: Record<string, any>;
  output_payload?: Record<string, any>;
  reasoning?: string;
  created_at?: string;
}
