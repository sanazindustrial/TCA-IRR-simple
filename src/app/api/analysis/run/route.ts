import { NextRequest, NextResponse } from 'next/server';

import { runAnalysis } from '@/app/analysis/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const framework = body?.framework;
    const userData = body?.userData;

    if (framework !== 'general' && framework !== 'medtech') {
      return NextResponse.json(
        { error: `Invalid framework: ${String(framework)}` },
        { status: 400 }
      );
    }

    const result = await runAnalysis(framework, userData);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Analysis run failed',
        message,
      },
      { status: 500 }
    );
  }
}
