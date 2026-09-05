import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const query = searchParams.get('q')?.toLowerCase() || '';

    const subscriptions = db.prepare(`
      SELECT 
        s.*,
        i.action_type as last_action_type,
        i.outcome as last_action_outcome,
        p.state as ptp_state,
        p.promised_date as ptp_date
      FROM subscriptions s
      LEFT JOIN (
        SELECT subscription_id, action_type, outcome, MAX(id) as max_id
        FROM interventions
        GROUP BY subscription_id
      ) i ON s.subscription_id = i.subscription_id
      LEFT JOIN (
        SELECT subscription_id, state, promised_date, MAX(id) as max_id
        FROM promises_to_pay
        GROUP BY subscription_id
      ) p ON s.subscription_id = p.subscription_id
      ORDER BY s.amount DESC
    `).all() as any[];

    // Map each subscription to a rich status badge
    const enriched = subscriptions.map(sub => {
      let statusCategory = 'EXCEPTION';
      let statusBadge = 'Pending Review';
      let channel = 'GATEWAY_API';

      if (sub.mandate_status === 'recovered') {
        statusCategory = 'RECOVERED';
        statusBadge = sub.ptp_state === 'KEPT' ? 'Recovered via Voice (PTP)' : 'Recovered via Gateway';
        channel = sub.ptp_state === 'KEPT' ? 'HINGLISH_VOICE' : 'GATEWAY_API';
      } else if (sub.retry_count_so_far >= 3 || sub.failure_reason_code === 'mandate_revoked') {
        statusCategory = 'BLOCKED';
        statusBadge = sub.failure_reason_code === 'mandate_revoked' ? 'Blocked: Revoked Mandate' : 'Blocked: Max 3 Retries Exceeded';
        channel = 'SAFETY_GATE';
      } else if (sub.recent_contact_count_48h >= 2) {
        statusCategory = 'BLOCKED';
        statusBadge = 'Blocked: Frequency Cap Exceeded';
        channel = 'COMPLIANCE_GATE';
      } else if (sub.last_action_type === 'HINGLISH_VOICE_RECOVERY' || sub.ptp_state) {
        statusCategory = 'VOICE_ACTION';
        statusBadge = sub.ptp_state === 'BROKEN' ? 'PTP Broken (Penalized)' : (sub.ptp_state ? `PTP Due (${sub.ptp_date})` : 'Voice Outreach Dispatched');
        channel = 'HINGLISH_VOICE';
      } else if (sub.last_action_type?.includes('NUDGE')) {
        statusCategory = 'DISPATCHED';
        statusBadge = 'Payment Update Link Sent';
        channel = sub.customer_segment === 'high_value' ? 'WHATSAPP' : 'SMS';
      } else if (sub.last_action_outcome === 'FAILED') {
        statusCategory = 'ESCALATED';
        statusBadge = 'Gateway Retry Failed';
        channel = 'GATEWAY_API';
      }

      return {
        ...sub,
        status_category: statusCategory,
        status_badge: statusBadge,
        channel
      };
    });

    let filtered = enriched;

    if (filter === 'recovered') {
      filtered = filtered.filter(s => s.status_category === 'RECOVERED');
    } else if (filter === 'blocked') {
      filtered = filtered.filter(s => s.status_category === 'BLOCKED');
    } else if (filter === 'voice') {
      filtered = filtered.filter(s => s.channel === 'HINGLISH_VOICE' || s.status_category === 'VOICE_ACTION');
    } else if (filter === 'exception') {
      filtered = filtered.filter(s => s.status_category !== 'RECOVERED');
    }

    if (query) {
      filtered = filtered.filter(s => 
        s.customer_name.toLowerCase().includes(query) ||
        s.subscription_id.toLowerCase().includes(query) ||
        s.failure_reason_code.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ cases: filtered, total_count: filtered.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
