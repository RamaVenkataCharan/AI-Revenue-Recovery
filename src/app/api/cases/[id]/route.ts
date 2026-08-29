import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDatabase } from '@/db/database';
import { AuditLogger } from '@/audit/audit_logger';
import { RootCauseClassifier } from '@/diagnosis/root_cause_classifier';
import { InterventionPolicy } from '@/decision/intervention_policy';
import { evaluateAdaptedCompliance } from '@/compliance/adapter';

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

    // Compute real compliance gate evaluation for this case's policy action
    const diagnosis = RootCauseClassifier.diagnose(subscription);
    const policyDecision = InterventionPolicy.decide(
      diagnosis.root_cause,
      subscription
    );
    const complianceEval = evaluateAdaptedCompliance(
      subscription,
      policyDecision.action,
      policyDecision.channel
    );

    return NextResponse.json({
      subscription: {
        ...subscription,
        contact_history: subscription.contact_history ? JSON.parse(subscription.contact_history) : []
      },
      audit_logs: auditLogs,
      interventions,
      ptp,
      voice_transcript: voiceTranscript,
      policy_decision: policyDecision,
      compliance_results: complianceEval.check_results,
      compliance_summary: {
        passed: complianceEval.passed,
        blocked_reason: complianceEval.blocked_reason,
        rule_cited: complianceEval.rule_cited,
        evaluated_count: complianceEval.evaluated_count,
        exempt_count: complianceEval.exempt_count
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
