import { NextRequest, NextResponse } from 'next/server';
import { ModelPredictor, PredictionInput } from '@/prediction/model_predictor';
import { getDatabase } from '@/db/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prediction = ModelPredictor.predict(body as PredictionInput);
    return NextResponse.json({ success: true, prediction });
  } catch (error) {
    console.error('Prediction API error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscription_id');
    const db = getDatabase();

    if (subscriptionId) {
      const record = db.prepare('SELECT * FROM subscriptions WHERE subscription_id = ?').get(subscriptionId) as any;
      if (!record) {
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
      const prediction = ModelPredictor.predict({
        subscription_id: record.subscription_id,
        customer_name: record.customer_name,
        amount: record.amount,
        failure_reason_code: record.failure_reason_code,
        customer_segment: record.customer_segment,
        retry_count_so_far: record.retry_count_so_far,
        payment_method: record.payment_method || 'upi_autopay'
      });
      return NextResponse.json({ success: true, prediction, record });
    }

    // Portfolio Batch Prediction
    const records = db.prepare('SELECT subscription_id, customer_name, amount, failure_reason_code, customer_segment, retry_count_so_far, payment_method FROM subscriptions ORDER BY amount DESC').all() as any[];
    const portfolio = ModelPredictor.predictPortfolio(records || []);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      portfolio
    });
  } catch (error) {
    console.error('Portfolio prediction error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
