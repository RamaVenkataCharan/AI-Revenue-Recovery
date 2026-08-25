import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/db/database';
import { AuditLogger } from '@/audit/audit_logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDatabase();

    const subscription = db.prepare('SELECT * FROM subscriptions WHERE subscription_id = ?').get(id) as any;

    if (!subscription) {
      return NextResponse.json({ error: `Subscription ${id} not found` }, { status: 404 });
    }

    const auditLogs = AuditLogger.getLogsBySubscription(id);
    const interventions = db.prepare('SELECT * FROM interventions WHERE subscription_id = ? ORDER BY id ASC').all(id);
    const ptp = db.prepare('SELECT * FROM promises_to_pay WHERE subscription_id = ? ORDER BY id DESC LIMIT 1').get(id);

    // Check if voice transcript exists for this case
    let voiceTranscript = null;
    const transcriptsPath = path.resolve(process.cwd(), 'data/synthetic/voice_call_transcripts.json');
    if (fs.existsSync(transcriptsPath)) {
      try {
        const transcripts: any[] = JSON.parse(fs.readFileSync(transcriptsPath, 'utf-8'));
        voiceTranscript = transcripts.find(t => t.subscription_id === id) || null;
      } catch {
        voiceTranscript = null;
      }
    }

    return NextResponse.json({
      subscription: {
        ...subscription,
        contact_history: subscription.contact_history ? JSON.parse(subscription.contact_history) : []
      },
      audit_logs: auditLogs,
      interventions,
      ptp,
      voice_transcript: voiceTranscript
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
