import { getDatabase } from '../db/database';

export interface AuditEntry {
  event_type: 'DETECTION' | 'DIAGNOSIS' | 'STOPPING_RULE_CHECK' | 'COMPLIANCE_GATE_CHECK' | 'DECISION' | 'EXECUTION' | 'OUTCOME';
  subscription_id: string;
  decision?: string;
  reasoning: string;
  action_taken?: string;
  result?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private static insertStmt = () => {
    const db = getDatabase();
    return db.prepare(`
      INSERT INTO audit_log (
        event_type, subscription_id, decision, reasoning,
        action_taken, result, timestamp, metadata
      ) VALUES (
        @event_type, @subscription_id, @decision, @reasoning,
        @action_taken, @result, @timestamp, @metadata
      )
    `);
  };

  /**
   * Appends an immutable audit entry to SQLite.
   */
  public static log(entry: AuditEntry): void {
    const db = getDatabase();
    const timestamp = entry.timestamp || new Date().toISOString();
    const metadataStr = entry.metadata ? JSON.stringify(entry.metadata) : null;

    AuditLogger.insertStmt().run({
      event_type: entry.event_type,
      subscription_id: entry.subscription_id,
      decision: entry.decision ?? null,
      reasoning: entry.reasoning,
      action_taken: entry.action_taken ?? null,
      result: entry.result ?? null,
      timestamp,
      metadata: metadataStr
    });
  }

  /**
   * Retrieves full chronological audit history for a specific subscription.
   */
  public static getLogsBySubscription(subscriptionId: string): AuditEntry[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM audit_log WHERE subscription_id = ? ORDER BY id ASC').all(subscriptionId);
    return rows.map((row: any) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  /**
   * Retrieves all audit logs from the immutable table.
   */
  public static getAllLogs(): any[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all();
  }
}
