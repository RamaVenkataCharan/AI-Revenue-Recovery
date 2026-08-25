import { NextResponse } from 'next/server';
import { seedDatabase } from '@/db/seed';
import { RevenueRecoveryOrchestrator } from '@/agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Seed fresh synthetic data
    seedDatabase();

    // 2. Run the complete pipeline: Detect -> Diagnose -> Decide -> Gate -> Execute -> Track PTP -> Audit
    const report = await RevenueRecoveryOrchestrator.runBatch();

    return NextResponse.json({
      success: true,
      message: 'Batch run executed successfully.',
      report
    });
  } catch (error) {
    console.error('[API Batch Run Error]:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
