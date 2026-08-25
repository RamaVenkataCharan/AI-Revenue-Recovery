import { getDatabase } from '../db/database';
import { AtRiskSubscriptionEvent } from '../detection/subscription_failure_detector';
import { StoppingRules } from '../decision/stopping_rules';
import { AuditLogger } from '../audit/audit_logger';

export type PtpState = 'PROMISED' | 'DUE' | 'KEPT' | 'BROKEN';

export interface PromiseToPayRecord {
  id?: number;
  subscription_id: string;
  customer_id: string;
  amount: number;
  promised_date: string;
  state: PtpState;
  created_at: string;
  resolved_at?: string;
  channel: string;
  metadata?: string;
}

export class PromiseToPayTracker {
  /**
   * Records a new Promise-to-Pay commitment from customer voice interaction.
   */
  public static createPromise(
    event: AtRiskSubscriptionEvent,
    promisedDate: string
  ): PromiseToPayRecord {
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO promises_to_pay (
        subscription_id, customer_id, amount, promised_date,
        state, created_at, channel, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      event.subscription_id,
      event.customer_id,
      event.amount,
      promisedDate,
      'PROMISED',
      nowIso,
      'voice_recovery',
      JSON.stringify({ failure_reason_code: event.failure_reason_code })
    );

    AuditLogger.log({
      event_type: 'OUTCOME',
      subscription_id: event.subscription_id,
      decision: 'PROMISE_TO_PAY_RECORDED',
      reasoning: `Customer ${event.customer_name} committed to settle ₹${event.amount} by ${promisedDate}. State initialized to PROMISED.`,
      action_taken: 'SCHEDULE_PTP_TRACKING',
      result: 'PROMISED',
      metadata: {
        ptp_id: info.lastInsertRowid,
        promised_date: promisedDate,
        amount: event.amount
      }
    });

    return {
      id: Number(info.lastInsertRowid),
      subscription_id: event.subscription_id,
      customer_id: event.customer_id,
      amount: event.amount,
      promised_date: promisedDate,
      state: 'PROMISED',
      created_at: nowIso,
      channel: 'voice_recovery'
    };
  }

  /**
   * Transitions a promise state from PROMISED -> DUE -> KEPT or BROKEN.
   * 
   * ARCHITECTURAL DESIGN DECISION:
   * "Does a broken promise count toward the stopping rules retry cap?"
   * YES. A broken promise is treated as a failed recovery attempt and increments
   * `retry_count_so_far`. Allowing unpenalized broken promises would create an 
   * infinite deferral exploit, defeating the hard stopping-rule guarantees required
   * by merchant finance teams and regulators.
   */
  public static resolvePromise(
    ptpId: number,
    resolution: 'KEPT' | 'BROKEN',
    simulatedPaymentId?: string
  ): { ptp: PromiseToPayRecord; status: string; amount_recovered: number } {
    const db = getDatabase();
    const nowIso = new Date().toISOString();

    const ptpRow = db.prepare('SELECT * FROM promises_to_pay WHERE id = ?').get(ptpId) as PromiseToPayRecord | undefined;
    if (!ptpRow) {
      throw new Error(`Promise-to-Pay record with id ${ptpId} not found.`);
    }

    const subRow = db.prepare('SELECT * FROM subscriptions WHERE subscription_id = ?').get(ptpRow.subscription_id) as any;

    if (resolution === 'KEPT') {
      // 1. Mark PTP as KEPT
      db.prepare(`
        UPDATE promises_to_pay 
        SET state = 'KEPT', resolved_at = ?
        WHERE id = ?
      `).run(nowIso, ptpId);

      // 2. Mark Subscription as Recovered
      db.prepare(`
        UPDATE subscriptions
        SET mandate_status = 'recovered', updated_at = ?
        WHERE subscription_id = ?
      `).run(nowIso, ptpRow.subscription_id);

      // 3. Record Intervention
      db.prepare(`
        INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        ptpRow.subscription_id,
        'PROMISE_TO_PAY_FULFILLED',
        `Customer fulfilled promise to pay of ₹${ptpRow.amount} on scheduled date ${ptpRow.promised_date}.`,
        'SUCCESS',
        nowIso,
        JSON.stringify({ channel: 'voice_recovery', payment_id: simulatedPaymentId })
      );

      // 4. Audit Log
      AuditLogger.log({
        event_type: 'OUTCOME',
        subscription_id: ptpRow.subscription_id,
        decision: 'PROMISE_TO_PAY_KEPT',
        reasoning: `Promise to pay verified. ₹${ptpRow.amount} successfully settled via Voice Recovery channel. Payment ID: ${simulatedPaymentId || 'pay_ptp_settled'}.`,
        action_taken: 'RECORD_VOICE_RECOVERY',
        result: 'KEPT',
        metadata: {
          ptp_id: ptpId,
          amount_recovered: ptpRow.amount,
          channel: 'voice_recovery'
        }
      });

      return {
        ptp: { ...ptpRow, state: 'KEPT', resolved_at: nowIso },
        status: 'KEPT',
        amount_recovered: ptpRow.amount
      };
    } else {
      // BROKEN PROMISE FLOW
      // 1. Increment retry_count_so_far on subscription
      const newRetryCount = (subRow?.retry_count_so_far || 0) + 1;

      db.prepare(`
        UPDATE promises_to_pay 
        SET state = 'BROKEN', resolved_at = ?
        WHERE id = ?
      `).run(nowIso, ptpId);

      db.prepare(`
        UPDATE subscriptions
        SET retry_count_so_far = ?, updated_at = ?
        WHERE subscription_id = ?
      `).run(newRetryCount, nowIso, ptpRow.subscription_id);

      // 2. Evaluate Stopping Rules on the broken promise
      const isMaxRetries = newRetryCount >= StoppingRules.MAX_RETRY_ATTEMPTS;

      // 3. Record Intervention
      db.prepare(`
        INSERT INTO interventions (subscription_id, action_type, reasoning, outcome, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        ptpRow.subscription_id,
        'PROMISE_TO_PAY_BROKEN',
        `Customer failed to settle by promised date ${ptpRow.promised_date}. Retry attempt count incremented to ${newRetryCount}/${StoppingRules.MAX_RETRY_ATTEMPTS}.`,
        'FAILED',
        nowIso,
        JSON.stringify({ new_retry_count: newRetryCount, max_allowed: StoppingRules.MAX_RETRY_ATTEMPTS })
      );

      // 4. Audit Log
      AuditLogger.log({
        event_type: 'OUTCOME',
        subscription_id: ptpRow.subscription_id,
        decision: 'PROMISE_TO_PAY_BROKEN',
        reasoning: `Customer broke promise to pay on ${ptpRow.promised_date}. Under safety policy, broken promise counts as 1 retry (now ${newRetryCount}/${StoppingRules.MAX_RETRY_ATTEMPTS}). ${isMaxRetries ? 'Max retries exceeded; escalating to human collections review.' : 'Case retained in recovery queue.'}`,
        action_taken: isMaxRetries ? 'ESCALATE_TO_MANUAL_REVIEW' : 'SCHEDULE_NEXT_TOUCH',
        result: 'BROKEN',
        metadata: {
          ptp_id: ptpId,
          new_retry_count: newRetryCount,
          is_max_retries: isMaxRetries
        }
      });

      return {
        ptp: { ...ptpRow, state: 'BROKEN', resolved_at: nowIso },
        status: isMaxRetries ? 'BROKEN_AND_ESCALATED' : 'BROKEN',
        amount_recovered: 0
      };
    }
  }

  /**
   * Retrieves all active/historical promises to pay.
   */
  public static getAllPromises(): PromiseToPayRecord[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM promises_to_pay ORDER BY id ASC').all() as PromiseToPayRecord[];
  }
}
