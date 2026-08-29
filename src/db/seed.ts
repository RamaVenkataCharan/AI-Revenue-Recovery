import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';

export interface SubscriptionRecord {
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
  customer_segment: string;
  previous_payment_history: string;
  dnd_registered?: boolean | number;
  recent_contact_count_48h: number;
  last_contacted_at?: string;
  contact_history?: string[];
  pre_debit_notice_sent_at?: string;
}

export function seedDatabase(): { seededCount: number } {
  const db = getDatabase();
  const dataPath = path.join(process.cwd(), 'data/synthetic/failed_subscriptions.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Synthetic data file not found at ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const subscriptions: SubscriptionRecord[] = JSON.parse(rawData);

  // Clear existing mutable records for clean test/demo runs (audit_log is append-only by regulation)
  const deletePtp = db.prepare('DELETE FROM promises_to_pay');
  const deleteInterventions = db.prepare('DELETE FROM interventions');
  const deleteMetrics = db.prepare('DELETE FROM recovery_metrics');
  const deleteSubscriptions = db.prepare('DELETE FROM subscriptions');

  const insertSubscription = db.prepare(`
    INSERT INTO subscriptions (
      subscription_id, customer_id, customer_name, phone, amount, currency,
      mandate_status, failure_reason_code, retry_count_so_far,
      last_attempt_timestamp, customer_segment, previous_payment_history,
      dnd_registered, recent_contact_count_48h, last_contacted_at, contact_history,
      pre_debit_notice_sent_at
    ) VALUES (
      @subscription_id, @customer_id, @customer_name, @phone, @amount, @currency,
      @mandate_status, @failure_reason_code, @retry_count_so_far,
      @last_attempt_timestamp, @customer_segment, @previous_payment_history,
      @dnd_registered, @recent_contact_count_48h, @last_contacted_at, @contact_history,
      @pre_debit_notice_sent_at
    )
  `);

  const seedTransaction = db.transaction((records: SubscriptionRecord[]) => {
    deletePtp.run();
    deleteInterventions.run();
    deleteMetrics.run();
    deleteSubscriptions.run();

    for (const record of records) {
      insertSubscription.run({
        ...record,
        phone: record.phone || '+919876543210',
        dnd_registered: record.dnd_registered ? 1 : 0,
        last_contacted_at: record.last_contacted_at ?? null,
        pre_debit_notice_sent_at: record.pre_debit_notice_sent_at ?? null,
        contact_history: record.contact_history ? JSON.stringify(record.contact_history) : null
      });
    }
  });

  seedTransaction(subscriptions);
  console.log(`[Seed] Successfully seeded ${subscriptions.length} failed subscription records into SQLite.`);
  return { seededCount: subscriptions.length };
}

// Run directly if invoked from CLI
if (require.main === module) {
  try {
    seedDatabase();
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
}
