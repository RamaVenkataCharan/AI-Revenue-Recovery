import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/db/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const eventType = searchParams.get('event_type') || '';
    const limit = Number(searchParams.get('limit')) || 100;

    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params: any[] = [];

    if (query) {
      sql += ' AND (subscription_id LIKE ? OR decision LIKE ? OR reasoning LIKE ? OR action_taken LIKE ? OR result LIKE ?)';
      const wildcard = `%${query}%`;
      params.push(wildcard, wildcard, wildcard, wildcard, wildcard);
    }

    if (eventType) {
      sql += ' AND event_type = ?';
      params.push(eventType);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const logs = db.prepare(sql).all(...params) as any[];

    return NextResponse.json({
      logs: logs.map(l => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : undefined
      })),
      total_count: logs.length
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
