import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { getDatabase } from '../db/database';
import { AuditLogger } from '../audit/audit_logger';

export interface ExecutionResult {
  subscription_id: string;
  action_type: string;
  success: boolean;
  amount_recovered: number;
  gateway_payment_id?: string;
  error_message?: string;
  execution_details: string;
}

export class MandateRetryExecutor {
  /**
   * @simulation Simulates a mandate recurring payment charge against Payment Gateway Subscriptions / Orders API.
   * Recovery outcome is determined by weighted Math.random() probability rolls per failure code.
   * In production, replace with live payment gateway SDK calls (see TODO below).
   */
  public static async executeMandateRetry(
    event: AtRiskSubscriptionEvent,
    executionMode: 'IMMEDIATE' | 'SCHEDULED_24H'
  ): Promise<ExecutionResult> {
    const db = getDatabase();

    // Log Execution Start
    AuditLogger.log({
      event_type: 'EXECUTION',
      subscription_id: event.subscription_id,
      decision: 'INITIATING_RETRY',
      reasoning: `Executing ${executionMode} mandate retry via payment gateway API for ₹${event.amount}.`,
      action_taken: 'POST /v1/subscriptions/' + event.subscription_id + '/charge',
      result: 'IN_PROGRESS',
      metadata: {
        mode: executionMode,
        amount: event.amount,
        currency: event.currency
      }
    });

    // @simulation — Production replacement: Payment Gateway Node SDK
    // const gateway = new PaymentGateway({ key_id: process.env.GATEWAY_KEY_ID, key_secret: process.env.GATEWAY_KEY_SECRET });
    // const chargeResult = await gateway.subscriptions.chargeSubscription(event.subscription_id, { amount: event.amount * 100 });

    // @simulation — Weighted recovery probability based on root cause
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

    const randomRoll = Math.random(); // @simulation — deterministic in production
    const isSuccess = randomRoll < successProbability;

    const newRetryCount = event.retry_count_so_far + 1;
    const nowIso = new Date().toISOString();
    const mockPaymentId = isSuccess ? `pay_test_${Math.random().toString(36).substring(2, 12)}` : undefined;

    if (isSuccess) {
      // Update subscription in database to recovered status
      db.prepare(`
        UPDATE subscriptions 
        SET mandate_status = 'recovered',
            retry_count_so_far = ?,
            last_attempt_timestamp = ?,
            updated_at = ?
        WHERE subscription_id = ?
      `).run(newRetryCount, nowIso, nowIso, event.subscription_id);

      const details = `Mandate charge succeeded via payment gateway. Payment ID: ${mockPaymentId}. ₹${event.amount} recovered.`;

      // Record intervention
      db.prepare(`
        INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        event.subscription_id,
        `MANDATE_RETRY_${executionMode}`,
        `Automated retry succeeded with recovery rate roll ${randomRoll.toFixed(2)} (threshold: ${successProbability})`,
        'SUCCESS',
        nowIso,
        JSON.stringify({ payment_id: mockPaymentId, amount: event.amount })
      );

      // Audit Log Outcome
      AuditLogger.log({
        event_type: 'OUTCOME',
        subscription_id: event.subscription_id,
        decision: 'RECOVERY_SUCCESSFUL',
        reasoning: details,
        action_taken: 'RECORD_RECOVERY',
        result: 'SUCCESS',
        metadata: {
          payment_id: mockPaymentId,
          amount_recovered: event.amount,
          new_retry_count: newRetryCount
        }
      });

      return {
        subscription_id: event.subscription_id,
        action_type: `MANDATE_RETRY_${executionMode}`,
        success: true,
        amount_recovered: event.amount,
        gateway_payment_id: mockPaymentId,
        execution_details: details
      };
    } else {
      // Update subscription retry count
      db.prepare(`
        UPDATE subscriptions 
        SET retry_count_so_far = ?,
            last_attempt_timestamp = ?,
            updated_at = ?
        WHERE subscription_id = ?
      `).run(newRetryCount, nowIso, nowIso, event.subscription_id);

      const errorMsg = `Mandate retry failed at gateway. Bank returned response: ${event.failure_reason_code}`;
      const details = `Attempt ${newRetryCount} failed (roll ${randomRoll.toFixed(2)} vs threshold ${successProbability}).`;

      // Record intervention
      db.prepare(`
        INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        event.subscription_id,
        `MANDATE_RETRY_${executionMode}`,
        details,
        'FAILED',
        nowIso,
        JSON.stringify({ retry_count: newRetryCount, reason: event.failure_reason_code })
      );

      // Audit Log Outcome
      AuditLogger.log({
        event_type: 'OUTCOME',
        subscription_id: event.subscription_id,
        decision: 'RECOVERY_FAILED',
        reasoning: `${errorMsg}. ${details}`,
        action_taken: newRetryCount >= 3 ? 'ESCALATE_TO_MANUAL_REVIEW' : 'SCHEDULE_NEXT_RETRY',
        result: 'FAILED',
        metadata: {
          retry_count_so_far: newRetryCount,
          failure_reason_code: event.failure_reason_code
        }
      });

      return {
        subscription_id: event.subscription_id,
        action_type: `MANDATE_RETRY_${executionMode}`,
        success: false,
        amount_recovered: 0,
        error_message: errorMsg,
        execution_details: details
      };
    }
  }

  /**
   * Dispatches customer-facing communications (payment update links or e-mandate registration links).
   */
  public static async dispatchCustomerNudge(
    event: AtRiskSubscriptionEvent,
    actionType: 'SEND_PAYMENT_METHOD_UPDATE_NUDGE' | 'REQUEST_NEW_MANDATE',
    channel: 'WHATSAPP_NUDGE' | 'SMS_NUDGE'
  ): Promise<ExecutionResult> {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    const newContactCount = event.recent_contact_count_48h + 1;

    // Update contact count
    db.prepare(`
      UPDATE subscriptions 
      SET recent_contact_count_48h = ?,
          updated_at = ?
      WHERE subscription_id = ?
    `).run(newContactCount, nowIso, event.subscription_id);

    const linkType = actionType === 'SEND_PAYMENT_METHOD_UPDATE_NUDGE' ? 'payment card update' : 'new e-mandate authorization';
    const mockTrackingId = `msg_${Math.random().toString(36).substring(2, 10)}`;
    const details = `Simulated dispatch of secure ${linkType} link to ${event.customer_name} via ${channel}. Tracking ID: ${mockTrackingId}.`;

    db.prepare(`
      INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      event.subscription_id,
      actionType,
      details,
      'DISPATCHED',
      nowIso,
      JSON.stringify({ channel, contact_count: newContactCount, tracking_id: mockTrackingId })
    );

    AuditLogger.log({
      event_type: 'OUTCOME',
      subscription_id: event.subscription_id,
      decision: 'NUDGE_DISPATCHED',
      reasoning: details,
      action_taken: actionType,
      result: 'DISPATCHED',
      metadata: { channel, newContactCount, tracking_id: mockTrackingId }
    });

    return {
      subscription_id: event.subscription_id,
      action_type: actionType,
      success: true,
      amount_recovered: 0, // customer must take action to recover
      execution_details: details
    };
  }
}
