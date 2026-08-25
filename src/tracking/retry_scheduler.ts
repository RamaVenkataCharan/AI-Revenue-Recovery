import { getDatabase } from '../db/database';
import { PromiseToPayTracker, PromiseToPayRecord } from './promise_to_pay_tracker';

export interface SchedulerResolutionSummary {
  total_processed: number;
  kept_count: number;
  broken_count: number;
  voice_recovered_amount: number;
  resolved_promises: {
    ptp_id: number;
    subscription_id: string;
    amount: number;
    promised_date: string;
    resolution: 'KEPT' | 'BROKEN';
    payment_id?: string;
  }[];
}

export class RetryScheduler {
  /**
   * Advances simulated time to the promised dates and resolves all pending PROMISED records into KEPT or BROKEN.
   * This allows the batch runner and demo video to show the full promise-to-pay lifecycle in a single execution.
   */
  public static advanceAndResolvePromises(): SchedulerResolutionSummary {
    const db = getDatabase();
    const pendingPromises = db.prepare(`
      SELECT * FROM promises_to_pay WHERE state = 'PROMISED'
    `).all() as PromiseToPayRecord[];

    let keptCount = 0;
    let brokenCount = 0;
    let voiceRecoveredAmount = 0;
    const resolvedPromises: SchedulerResolutionSummary['resolved_promises'] = [];

    for (const ptp of pendingPromises) {
      if (!ptp.id) continue;

      // Realistic resolution roll: 70% of verbal date commitments are kept
      const roll = Math.random();
      const isKept = roll < 0.70;

      if (isKept) {
        const mockPayId = `pay_voice_ptp_${Math.random().toString(36).substring(2, 10)}`;
        const result = PromiseToPayTracker.resolvePromise(ptp.id, 'KEPT', mockPayId);
        keptCount++;
        voiceRecoveredAmount += result.amount_recovered;
        resolvedPromises.push({
          ptp_id: ptp.id,
          subscription_id: ptp.subscription_id,
          amount: ptp.amount,
          promised_date: ptp.promised_date,
          resolution: 'KEPT',
          payment_id: mockPayId
        });
      } else {
        PromiseToPayTracker.resolvePromise(ptp.id, 'BROKEN');
        brokenCount++;
        resolvedPromises.push({
          ptp_id: ptp.id,
          subscription_id: ptp.subscription_id,
          amount: ptp.amount,
          promised_date: ptp.promised_date,
          resolution: 'BROKEN'
        });
      }
    }

    return {
      total_processed: pendingPromises.length,
      kept_count: keptCount,
      broken_count: brokenCount,
      voice_recovered_amount: voiceRecoveredAmount,
      resolved_promises: resolvedPromises
    };
  }
}
