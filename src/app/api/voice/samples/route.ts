import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/db/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    const transcriptsPath = path.resolve(process.cwd(), 'data/synthetic/voice_call_transcripts.json');
    
    let transcripts: any[] = [];
    if (fs.existsSync(transcriptsPath)) {
      try {
        transcripts = JSON.parse(fs.readFileSync(transcriptsPath, 'utf-8'));
      } catch {
        transcripts = [];
      }
    }

    // Attach latest PTP and subscription status
    const enrichedTranscripts = transcripts.map(t => {
      const sub = db.prepare('SELECT mandate_status FROM subscriptions WHERE subscription_id = ?').get(t.subscription_id) as any;
      const ptp = db.prepare('SELECT state FROM promises_to_pay WHERE subscription_id = ? ORDER BY id DESC LIMIT 1').get(t.subscription_id) as any;

      return {
        ...t,
        current_mandate_status: sub?.mandate_status || 'failed',
        current_ptp_state: ptp?.state || (t.simulated_outcome === 'PROMISE_TO_PAY_COMMITTED' ? 'PROMISED' : null)
      };
    });

    return NextResponse.json({
      transcripts: enrichedTranscripts,
      total_count: enrichedTranscripts.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
