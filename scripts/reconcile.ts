import { getDatabase } from '../src/db/database';

const db = getDatabase();

console.log('=== RECOVERY METRICS ===');
const metrics = db.prepare('SELECT * FROM recovery_metrics ORDER BY timestamp DESC LIMIT 5').all();
console.log(JSON.stringify(metrics, null, 2));

console.log('\n=== SUBSCRIPTIONS: mandate_status = recovered ===');
const recoveredSubs = db.prepare("SELECT subscription_id, customer_name, amount, mandate_status, failure_reason_code, retry_count_so_far FROM subscriptions WHERE mandate_status = 'recovered'").all();
console.log(JSON.stringify(recoveredSubs, null, 2));

console.log('\n=== PROMISES TO PAY ===');
const ptp = db.prepare("SELECT * FROM promises_to_pay").all();
console.log(JSON.stringify(ptp, null, 2));

console.log('\n=== SPECIFIC CASES: sub_1045, sub_1029, sub_1014 ===');
const specific = db.prepare("SELECT subscription_id, customer_name, amount, mandate_status, failure_reason_code, retry_count_so_far FROM subscriptions WHERE subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')").all();
console.log(JSON.stringify(specific, null, 2));

console.log('\n=== INTERVENTIONS FOR sub_1045, sub_1029, sub_1014 ===');
const inter = db.prepare("SELECT * FROM interventions WHERE subscription_id IN ('sub_1045', 'sub_1029', 'sub_1014')").all();
console.log(JSON.stringify(inter, null, 2));

console.log('\n=== ALL INTERVENTIONS WITH VOICE OR GATEWAY ===');
const allInter = db.prepare("SELECT * FROM interventions WHERE action_type LIKE '%VOICE%' OR action_type LIKE '%GATEWAY%'").all();
console.log(JSON.stringify(allInter, null, 2));
