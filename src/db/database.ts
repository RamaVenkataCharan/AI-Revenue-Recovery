import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'revenue_recovery.db');
const SCHEMA_PATH = fs.existsSync(path.join(process.cwd(), 'src/db/sqlite_schema.sql'))
  ? path.join(process.cwd(), 'src/db/sqlite_schema.sql')
  : path.join(process.cwd(), 'src/db/schema.sql');

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

export function initSchema(db: Database.Database = getDatabase()): void {
  if (!fs.existsSync(SCHEMA_PATH)) {
    return;
  }
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);

  // Safe table schema migrations for development
  const migrations = [
    'ALTER TABLE subscriptions ADD COLUMN contact_history TEXT',
    'ALTER TABLE recovery_metrics ADD COLUMN voice_calls_placed_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_made_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_kept_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN promises_broken_count INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN voice_recovered_amount REAL NOT NULL DEFAULT 0',
    'ALTER TABLE recovery_metrics ADD COLUMN gateway_recovered_amount REAL NOT NULL DEFAULT 0'
  ];

  for (const sql of migrations) {
    try {
      db.prepare(sql).run();
    } catch {
      // Column already exists
    }
  }
}

export function resetDatabase(): Database.Database {
  closeDatabase();
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH);
    } catch {
      // Ignore if locked
    }
  }
  return getDatabase();
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
