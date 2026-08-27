import fs from 'fs';
import path from 'path';
import { getDatabase, resetDatabase } from '../src/db/database';
import {
  Merchant,
  Customer,
  Subscription,
  PaymentAttempt,
  FailureEvent,
  RecoveryCase,
  FailureCategory,
  PaymentMethod,
  PreferredLanguage,
  CustomerTier
} from '../src/db/types';

const INDIAN_FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Aditya', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Atharv',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Pari', 'Myra', 'Ira', 'Avni', 'Riya', 'Kavya',
  'Rohan', 'Vikram', 'Pooja', 'Deepak', 'Neha', 'Suresh', 'Kavita', 'Manish', 'Sneha', 'Rajesh',
  'Amit', 'Priya', 'Rahul', 'Sunita', 'Venkatesh', 'Swati', 'Alok', 'Divya', 'Karan', 'Meera'
];

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Rao', 'Nair', 'Iyer', 'Menon', 'Gupta', 'Singh',
  'Kumar', 'Joshi', 'Deshmukh', 'Kulkarni', 'Chatterjee', 'Banerjee', 'Bose', 'Das', 'Mehta', 'Shah',
  'Choudhury', 'Pillai', 'Agarwal', 'Mishra', 'Pandey', 'Saxena', 'Bhat', 'Hegde', 'Shetty', 'Gowda'
];

// Fictionalized Indian Subscription Merchants
const FICTIONAL_MERCHANTS: Merchant[] = [
  {
    id: 'merch_aura_stream',
    name: 'Aura OTT Stream',
    category: 'OTT',
    support_email: 'billing@aurastream.in',
    webhook_secret: 'whsec_aura_test_98124',
    rbi_mandate_id_prefix: 'RPR_AURA_',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'merch_kiteflow_algo',
    name: 'KiteFlow Algo Fintech',
    category: 'Fintech',
    support_email: 'accounts@kiteflow.tech',
    webhook_secret: 'whsec_kite_test_66192',
    rbi_mandate_id_prefix: 'RPR_KTFL_',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'merch_pulsefit_club',
    name: 'PulseFit Health Club',
    category: 'Fitness',
    support_email: 'membership@pulsefit.in',
    webhook_secret: 'whsec_pulse_test_33108',
    rbi_mandate_id_prefix: 'RPR_PLSF_',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 'merch_vidyapeeth_pro',
    name: 'Vidyapeeth Pro EdTech',
    category: 'EdTech',
    support_email: 'care@vidyapeethpro.com',
    webhook_secret: 'whsec_vidya_test_88190',
    rbi_mandate_id_prefix: 'RPR_VDPT_',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

const FAILURE_REASON_PROFILES: {
  category: FailureCategory;
  codes: { code: string; message: string }[];
  weight: number;
}[] = [
  {
    category: 'insufficient_funds',
    codes: [
      { code: 'BAD_REQUEST_INSUFFICIENT_FUNDS', message: 'Debit declined: Insufficient account balance in linked account' },
      { code: 'PAYMENT_ACCOUNT_BALANCE_LOW', message: 'UPI Autopay debit failed: Account balance below mandate amount' }
    ],
    weight: 40
  },
  {
    category: 'bank_timeout',
    codes: [
      { code: 'GATEWAY_TIMEOUT_NPCI_SWITCH', message: 'NPCI UPI switch response timed out after 30 seconds' },
      { code: 'ISSUER_BANK_UNAVAILABLE', message: 'HDFC / SBI core banking gateway temporarily offline for maintenance' }
    ],
    weight: 25
  },
  {
    category: 'expired_mandate',
    codes: [
      { code: 'MANDATE_EXPIRED_OR_REVOKED', message: 'e-Mandate registration expired or revoked by customer via netbanking' },
      { code: 'CARD_MANDATE_EXPIRED', message: 'Tokenized card linked to standing instruction expired' }
    ],
    weight: 20
  },
  {
    category: 'technical_decline',
    codes: [
      { code: 'PAYMENT_RISK_CHECK_FAILED', message: 'Internal bank risk rule blocked automated recurring execution' },
      { code: 'CUSTOMER_ACCOUNT_DORMANT', message: 'Account status dormant or frozen as per RBI KYC guidelines' }
    ],
    weight: 15
  }
];

export function generateSyntheticDataset(count = 100) {
  const db = resetDatabase();
  console.log(`Generating ${count} realistic Indian subscription recovery scenarios...`);

  // Insert Merchants
  const insertMerchant = db.prepare(`
    INSERT INTO merchants (id, name, category, support_email, webhook_secret, rbi_mandate_id_prefix, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of FICTIONAL_MERCHANTS) {
    insertMerchant.run(m.id, m.name, m.category, m.support_email, m.webhook_secret, m.rbi_mandate_id_prefix, m.created_at);
  }

  const customers: Customer[] = [];
  const subscriptions: Subscription[] = [];
  const paymentAttempts: PaymentAttempt[] = [];
  const failureEvents: FailureEvent[] = [];
  const recoveryCases: RecoveryCase[] = [];

  for (let i = 1; i <= count; i++) {
    const caseId = `case_${String(i).padStart(4, '0')}`;
    const custId = `cust_${String(i).padStart(4, '0')}`;
    const subId = `sub_${String(i).padStart(4, '0')}`;
    const attemptId = `att_${String(i).padStart(4, '0')}`;
    const failId = `fail_${String(i).padStart(4, '0')}`;

    const firstName = INDIAN_FIRST_NAMES[i % INDIAN_FIRST_NAMES.length];
    const lastName = INDIAN_LAST_NAMES[Math.floor(i / 2) % INDIAN_LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const merchant = FICTIONAL_MERCHANTS[i % FICTIONAL_MERCHANTS.length];

    const preferredLang: PreferredLanguage = i % 5 === 0 ? 'hi' : i % 3 === 0 ? 'hinglish' : 'en';
    const tier: CustomerTier = i % 10 === 0 ? 'vip' : i % 7 === 0 ? 'at_risk' : 'standard';
    const isDnd = i % 4 === 0; // 25% registered on DND

    const amountTiers = [499, 999, 1499, 2999, 4999, 9999, 19999, 39999];
    const amount = tier === 'vip' ? amountTiers[6 + (i % 2)] : amountTiers[i % 6];

    const paymentMethods: PaymentMethod[] = ['upi_autopay', 'e_mandate_netbanking', 'recurring_card', 'e_mandate_card'];
    const paymentMethod = paymentMethods[i % paymentMethods.length];

    // Failure Category based on weighted percentages
    let failureCategory: FailureCategory;
    let failureCodeObj: { code: string; message: string };

    const roll = (i * 17) % 100;
    if (roll < 40) {
      failureCategory = 'insufficient_funds';
      failureCodeObj = FAILURE_REASON_PROFILES[0].codes[i % FAILURE_REASON_PROFILES[0].codes.length];
    } else if (roll < 65) {
      failureCategory = 'bank_timeout';
      failureCodeObj = FAILURE_REASON_PROFILES[1].codes[i % FAILURE_REASON_PROFILES[1].codes.length];
    } else if (roll < 85) {
      failureCategory = 'expired_mandate';
      failureCodeObj = FAILURE_REASON_PROFILES[2].codes[i % FAILURE_REASON_PROFILES[2].codes.length];
    } else {
      failureCategory = 'technical_decline';
      failureCodeObj = FAILURE_REASON_PROFILES[3].codes[i % FAILURE_REASON_PROFILES[3].codes.length];
    }

    // 1. Uniformly distributed timestamp across all 24 UTC hours
    // (i % 24) gives an exact uniform distribution across hours 0..23 UTC
    const utcHour = i % 24;
    const utcMinute = (i * 17) % 60;
    const dayOffset = (i % 14); // across last 14 days
    const eventTime = new Date(Date.UTC(2026, 7, 26 - dayOffset, utcHour, utcMinute, 0));

    // 2. Varied Pre-debit Notice: ~30% missing or late (< 24h)
    let preDebitNoticeDate: string | undefined;
    if (i % 7 === 0) {
      // 14% missing notice completely
      preDebitNoticeDate = undefined;
    } else if (i % 7 === 1) {
      // 14% late notice (sent only 4 to 16 hours prior to debit attempt)
      const lateHours = 4 + (i % 13);
      preDebitNoticeDate = new Date(eventTime.getTime() - (lateHours * 3600 * 1000)).toISOString();
    } else {
      // 72% fully compliant notice (sent 26 to 48 hours prior)
      const advanceHours = 26 + (i % 22);
      preDebitNoticeDate = new Date(eventTime.getTime() - (advanceHours * 3600 * 1000)).toISOString();
    }

    // 3. Retry Count & Max Retries Edge Cases
    const isMaxRetryEdgeCase = i % 10 === 0; // 10% already exhausted (retry_count = 3)
    const retryCount = isMaxRetryEdgeCase ? 3 : (i % 3);

    // 4. Cooldown History (last_contacted_at)
    let lastContactedAt: string | undefined;
    if (i % 6 === 0) {
      // Contacted 8 to 24 hours ago (violates 48h cooldown)
      lastContactedAt = new Date(eventTime.getTime() - ((8 + (i % 16)) * 3600 * 1000)).toISOString();
    } else if (i % 3 === 0) {
      // Contacted 60 to 120 hours ago (passes cooldown)
      lastContactedAt = new Date(eventTime.getTime() - ((60 + (i % 60)) * 3600 * 1000)).toISOString();
    } else {
      // Never contacted
      lastContactedAt = undefined;
    }

    const cust: Customer = {
      id: custId,
      merchant_id: merchant.id,
      name: fullName,
      phone: `+9198${String(10000000 + i * 38219).slice(0, 8)}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.in`,
      preferred_language: preferredLang,
      dnd_registered: isDnd,
      tier,
      created_at: new Date('2025-06-01T00:00:00Z').toISOString()
    };
    customers.push(cust);

    const mandateExpiry = failureCategory === 'expired_mandate'
      ? new Date(eventTime.getTime() - (5 * 24 * 3600 * 1000)).toISOString().split('T')[0]
      : new Date(eventTime.getTime() + (365 * 24 * 3600 * 1000)).toISOString().split('T')[0];

    const sub: Subscription = {
      id: subId,
      merchant_id: merchant.id,
      customer_id: custId,
      plan_name: `${merchant.name} Premium Tier`,
      amount,
      currency: 'INR',
      billing_cycle: 'monthly',
      payment_method: paymentMethod,
      mandate_token: `${merchant.rbi_mandate_id_prefix}MND_${100000 + i}`,
      mandate_expiry_date: mandateExpiry,
      status: 'failing',
      current_cycle_start: new Date(eventTime.getTime() - (30 * 24 * 3600 * 1000)).toISOString(),
      current_cycle_end: eventTime.toISOString(),
      created_at: new Date(eventTime.getTime() - (90 * 24 * 3600 * 1000)).toISOString(),
      updated_at: eventTime.toISOString()
    };
    subscriptions.push(sub);

    // Clean metadata: genuine technical parameters with NO compliance hints
    const attempt: PaymentAttempt = {
      id: attemptId,
      subscription_id: subId,
      attempt_number: retryCount + 1,
      amount,
      currency: 'INR',
      gateway: 'razorpay',
      gateway_payment_id: `pay_rzp_test_${900000 + i}`,
      status: 'failed',
      error_code: failureCodeObj.code,
      error_description: failureCodeObj.message,
      attempted_at: eventTime.toISOString(),
      metadata: {
        gateway_response_time_ms: 120 + (i * 37) % 650,
        bank_rrn: `RRN${800000000000 + i * 941}`,
        auth_protocol: paymentMethod.startsWith('upi') ? 'upi_2.0' : '3ds_v2'
      }
    };
    paymentAttempts.push(attempt);

    const failEvent: FailureEvent = {
      id: failId,
      subscription_id: subId,
      payment_attempt_id: attemptId,
      failure_category: failureCategory,
      raw_error_code: failureCodeObj.code,
      raw_error_message: failureCodeObj.message,
      pre_debit_notice_sent_at: preDebitNoticeDate,
      occurred_at: eventTime.toISOString(),
      raw_webhook_payload: {
        event: 'subscription.payment.failed',
        payload: {
          payment: {
            entity: {
              id: attempt.gateway_payment_id,
              amount: amount * 100,
              currency: 'INR',
              status: 'failed',
              error_code: failureCodeObj.code,
              error_description: failureCodeObj.message
            }
          }
        },
        created_at: Math.floor(eventTime.getTime() / 1000)
      }
    };
    failureEvents.push(failEvent);

    const recoveryCase: RecoveryCase = {
      id: caseId,
      subscription_id: subId,
      latest_failure_event_id: failId,
      status: isMaxRetryEdgeCase ? 'exhausted' : 'open',
      recovery_strategy: failureCategory === 'insufficient_funds' ? 'salary_cycle_retry' : failureCategory === 'expired_mandate' ? 'mandate_refresh' : 'smart_nudge',
      total_amount_due: amount,
      retry_count: retryCount,
      max_retries_allowed: 3,
      last_contacted_at: lastContactedAt,
      next_scheduled_action_at: undefined,
      opened_at: eventTime.toISOString(),
      updated_at: eventTime.toISOString()
    };
    recoveryCases.push(recoveryCase);
  }

  // Database transaction inserts
  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, merchant_id, name, phone, email, preferred_language, dnd_registered, tier, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSub = db.prepare(`
    INSERT INTO subscriptions (id, merchant_id, customer_id, plan_name, amount, currency, billing_cycle, payment_method, mandate_token, mandate_expiry_date, status, current_cycle_start, current_cycle_end, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAttempt = db.prepare(`
    INSERT INTO payment_attempts (id, subscription_id, attempt_number, amount, currency, gateway, gateway_payment_id, status, error_code, error_description, attempted_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFail = db.prepare(`
    INSERT INTO failure_events (id, subscription_id, payment_attempt_id, failure_category, raw_error_code, raw_error_message, pre_debit_notice_sent_at, occurred_at, raw_webhook_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCase = db.prepare(`
    INSERT INTO recovery_cases (id, subscription_id, latest_failure_event_id, status, recovery_strategy, total_amount_due, retry_count, max_retries_allowed, last_contacted_at, next_scheduled_action_at, opened_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const c of customers) {
      insertCustomer.run(c.id, c.merchant_id, c.name, c.phone, c.email, c.preferred_language, c.dnd_registered ? 1 : 0, c.tier, c.created_at);
    }
    for (const s of subscriptions) {
      insertSub.run(s.id, s.merchant_id, s.customer_id, s.plan_name, s.amount, s.currency, s.billing_cycle, s.payment_method, s.mandate_token, s.mandate_expiry_date, s.status, s.current_cycle_start, s.current_cycle_end, s.created_at, s.updated_at);
    }
    for (const a of paymentAttempts) {
      insertAttempt.run(a.id, a.subscription_id, a.attempt_number, a.amount, a.currency, a.gateway, a.gateway_payment_id, a.status, a.error_code, a.error_description, a.attempted_at, JSON.stringify(a.metadata));
    }
    for (const f of failureEvents) {
      insertFail.run(f.id, f.subscription_id, f.payment_attempt_id, f.failure_category, f.raw_error_code, f.raw_error_message, f.pre_debit_notice_sent_at, f.occurred_at, JSON.stringify(f.raw_webhook_payload));
    }
    for (const rc of recoveryCases) {
      insertCase.run(rc.id, rc.subscription_id, rc.latest_failure_event_id, rc.status, rc.recovery_strategy, rc.total_amount_due, rc.retry_count, rc.max_retries_allowed, rc.last_contacted_at, rc.next_scheduled_action_at, rc.opened_at, rc.updated_at);
    }
  });

  tx();

  const outDir = path.join(process.cwd(), 'data/synthetic');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exportPayload = {
    generated_at: new Date().toISOString(),
    total_cases: count,
    merchants: FICTIONAL_MERCHANTS,
    customers,
    subscriptions,
    payment_attempts: paymentAttempts,
    failure_events: failureEvents,
    recovery_cases: recoveryCases
  };

  fs.writeFileSync(
    path.join(outDir, 'synthetic_recovery_scenarios_100.json'),
    JSON.stringify(exportPayload, null, 2),
    'utf-8'
  );

  console.log(`[Success] Generated ${count} realistic cases with clean metadata & uniform 24h distribution into data/synthetic/synthetic_recovery_scenarios_100.json`);
  return exportPayload;
}

if (require.main === module) {
  generateSyntheticDataset(100);
}
