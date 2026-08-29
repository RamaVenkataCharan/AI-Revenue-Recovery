/**
 * @module Database — SQLite (better-sqlite3) singleton for the Revenue Recovery Agent.
 *
 * Design decision: Single SQLite file (`revenue_recovery.db`) chosen for hackathon
 * demo — zero external dependencies, works on any machine with Node.js.
 *
 * Schema source: `src/db/sqlite_schema.sql` (flat denormalized tables).
 * There is no Postgres/Supabase fallback — those schemas have been removed.
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'revenue_recovery.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src/db/sqlite_schema.sql');

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
    console.warn(`[DB] Schema file not found at ${SCHEMA_PATH}. Skipping init.`);
    return;
  }
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);
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
