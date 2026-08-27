// TypeScript type definitions for AI Revenue Recovery Agent

export type MerchantCategory = 'OTT' | 'SaaS' | 'Fintech' | 'EdTech' | 'Fitness';

export interface Merchant {
  id: string;
  name: string;
  category: MerchantCategory;
  support_email: string;
  webhook_secret: string;
  rbi_mandate_id_prefix: string;
  created_at: string;
}

export type CustomerTier = 'vip' | 'standard' | 'at_risk';
export type PreferredLanguage = 'en' | 'hi' | 'hinglish';

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

export type PaymentMethod = 'upi_autopay' | 'e_mandate_netbanking' | 'e_mandate_card' | 'recurring_card';
export type SubscriptionStatus = 'active' | 'failing' | 'grace_period' | 'cancelled' | 'recovered';

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

export type FailureCategory = 'insufficient_funds' | 'expired_mandate' | 'bank_timeout' | 'technical_decline';

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

export type RecoveryCaseStatus =
  | 'open'
  | 'in_progress'
  | 'ptp_pending'
  | 'recovered'
  | 'exhausted'
  | 'escalated_human'
  | 'written_off';

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

export type InterventionChannel =
  | 'gateway_retry'
  | 'whatsapp_nudge'
  | 'email_notice'
  | 'voice_call'
  | 'human_escalation';

export type InterventionActionType =
  | 'retry_now'
  | 'retry_scheduled'
  | 'pre_debit_notice'
  | 'interactive_nudge'
  | 'hinglish_call'
  | 'manual_review';

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
