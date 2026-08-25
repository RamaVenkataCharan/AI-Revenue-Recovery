import fs from 'fs';
import path from 'path';
import { getDatabase } from './database';

export interface SubscriptionRecord {
  subscription_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  mandate_status: string;
  failure_reason_code: string;
  retry_count_so_far: number;
  last_attempt_timestamp: string;
  customer_segment: string;
  previous_payment_history: string;
  recent_contact_count_48h: number;
  contact_history?: string[];
}

export function seedDatabase(): { seededCount: number } {
  const db = getDatabase();
  const dataPath = path.join(process.cwd(), 'data/synthetic/failed_subscriptions.json');

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Synthetic data file not found at ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const subscriptions: SubscriptionRecord[] = JSON.parse(rawData);

  // Clear existing records in subscriptions and related tables for clean test runs
  const deletePtp = db.prepare('DELETE FROM promises_to_pay');
  const deleteInterventions = db.prepare('DELETE FROM interventions');
  const deleteAuditLogs = db.prepare('DELETE FROM audit_log');
  const deleteMetrics = db.prepare('DELETE FROM recovery_metrics');
  const deleteSubscriptions = db.prepare('DELETE FROM subscriptions');

  const insertSubscription = db.prepare(`
    INSERT INTO subscriptions (
      subscription_id, customer_id, customer_name, amount, currency,
      mandate_status, failure_reason_code, retry_count_so_far,
      last_attempt_timestamp, customer_segment, previous_payment_history,
      recent_contact_count_48h, contact_history
    ) VALUES (
      @subscription_id, @customer_id, @customer_name, @amount, @currency,
      @mandate_status, @failure_reason_code, @retry_count_so_far,
      @last_attempt_timestamp, @customer_segment, @previous_payment_history,
      @recent_contact_count_48h, @contact_history
    )
  `);

  const seedTransaction = db.transaction((records: SubscriptionRecord[]) => {
    deletePtp.run();
    deleteInterventions.run();
    deleteAuditLogs.run();
    deleteMetrics.run();
    deleteSubscriptions.run();

    for (const record of records) {
      insertSubscription.run({
        ...record,
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
