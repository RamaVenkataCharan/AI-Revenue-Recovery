import { getDatabase } from '../src/db/database';

const db = getDatabase();

console.log('=== 1. SQLITE MASTER (TABLES & TRIGGERS) ===');
const sqliteMaster = db.prepare(`
  SELECT name, type, sql 
  FROM sqlite_master 
  WHERE type IN ('table', 'trigger') AND name NOT LIKE 'sqlite_%'
  ORDER BY type, name
`).all();
console.log(JSON.stringify(sqliteMaster, null, 2));

console.log('\n=== 2. FINANCIAL RECONCILIATION PER-CASE QUERY ===');
const query = `
  SELECT 
    s.subscription_id,
    s.customer_name,
    s.amount,
    s.failure_reason_code,
    s.mandate_status,
    s.retry_count_so_far,
    CASE 
      WHEN p.state = 'KEPT' THEN 'Voice Recovery (PTP Kept)'
      WHEN s.mandate_status = 'recovered' THEN 'Gateway API Retry'
      ELSE 'Unresolved / Escalated'
    END as recovery_channel,
    COALESCE(p.state, 'N/A') as ptp_state
  FROM subscriptions s
  LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
  WHERE s.mandate_status = 'recovered' OR s.subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014', 'sub_1033')
  ORDER BY s.amount DESC;
`;
const results = db.prepare(query).all();
console.log(JSON.stringify(results, null, 2));

console.log('\n=== 3. 3 TARGETED VOICE OUTREACH CASES ===');
const voiceCases = db.prepare(`
  SELECT s.subscription_id, s.customer_name, s.amount, s.failure_reason_code, s.mandate_status, s.retry_count_so_far,
         p.state as ptp_state, p.amount as ptp_amount, p.promised_date
  FROM subscriptions s
  LEFT JOIN promises_to_pay p ON s.subscription_id = p.subscription_id
  WHERE s.subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')
`).all();
console.log(JSON.stringify(voiceCases, null, 2));

console.log('\n=== 4. CASE sub_1033 (₹4,999 DELTA CASE) ===');
const sub1033 = db.prepare(`
  SELECT s.subscription_id, s.customer_name, s.amount, s.failure_reason_code, s.mandate_status, s.retry_count_so_far
  FROM subscriptions s
  WHERE s.subscription_id = 'sub_1033'
`).all();
console.log(JSON.stringify(sub1033, null, 2));
