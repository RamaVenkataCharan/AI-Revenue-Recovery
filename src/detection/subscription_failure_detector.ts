import { getDatabase } from '../db/database';
import { AuditLogger } from '../audit/audit_logger';

export interface AtRiskSubscriptionEvent {
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  mandate_status: string;
  failure_reason_code: string;
  retry_count_so_far: number;
  last_attempt_timestamp: string;
  customer_segment: 'high_value' | 'standard' | 'at_risk';
  previous_payment_history: 'on_time' | 'occasional_delay' | 'frequent_delay';
  recent_contact_count_48h: number;
  contact_history?: string[];
}

export interface DetectionResult {
  total_count: number;
  total_at_risk_amount: number;
  currency: string;
  events: AtRiskSubscriptionEvent[];
}

export class SubscriptionFailureDetector {
  /**
   * Scans subscriptions table for active mandate failures and computes total ₹ at risk.
   */
  public static detect(): DetectionResult {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT 
        subscription_id, customer_id, customer_name, amount, currency,
        mandate_status, failure_reason_code, retry_count_so_far,
        last_attempt_timestamp, customer_segment, previous_payment_history,
        recent_contact_count_48h, contact_history
      FROM subscriptions
      WHERE mandate_status = 'failed'
      ORDER BY amount DESC
    `).all().map((row: any) => ({
      ...row,
      contact_history: row.contact_history ? JSON.parse(row.contact_history) : []
    })) as AtRiskSubscriptionEvent[];

    let totalAtRiskAmount = 0;

    for (const event of rows) {
      totalAtRiskAmount += event.amount;
      AuditLogger.log({
        event_type: 'DETECTION',
        subscription_id: event.subscription_id,
        decision: 'FLAGGED_AT_RISK',
        reasoning: `Mandate failed with decline code "${event.failure_reason_code}". Customer ${event.customer_name} (${event.customer_segment} segment) has ₹${event.amount} at risk.`,
        action_taken: 'ENQUEUE_FOR_DIAGNOSIS',
        result: 'AT_RISK',
        metadata: {
          amount: event.amount,
          failure_reason_code: event.failure_reason_code,
          retry_count_so_far: event.retry_count_so_far
        }
      });
    }

    return {
      total_count: rows.length,
      total_at_risk_amount: totalAtRiskAmount,
      currency: 'INR',
      events: rows
    };
  }
}
