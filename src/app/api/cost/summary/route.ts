import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const fallbackSummary = {
  totalCost: 0,
  totalRequests: 0,
  billedUsers: 0,
  dailyAverage: 0,
  breakdown: [],
  trends: [],
  aiBreakdown: {
    totalAiCost: 0,
    costPerAnalysis: 0,
    inputTokens: 0,
    outputTokens: 0,
    models: [],
    costByUser: [],
    costByReportType: [],
  },
  dateRange: {
    start: '',
    end: '',
  },
  source: 'fallback',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const query = request.nextUrl.searchParams.toString();
  const querySuffix = query ? `?${query}` : '';

  const targets = [
    '/api/v1/cost/summary',
    '/api/v1/cost/summary/public',
  ];

  const errors: string[] = [];

  for (const path of targets) {
    try {
      const res = await fetch(`${BACKEND}${path}${querySuffix}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: auth } : {}),
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        errors.push(`${path}:${res.status}`);
        continue;
      }

      const payload = await res.json().catch(() => null);
      if (!payload) {
        errors.push(`${path}:invalid_json`);
        continue;
      }

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store',
        },
      });
    } catch (err) {
      errors.push(`${path}:${err instanceof Error ? err.message : 'request_failed'}`);
    }
  }

  return NextResponse.json(
    {
      ...fallbackSummary,
      warning: 'Cost service unavailable, returning fallback response',
      upstreamErrors: errors,
    },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store',
      },
    }
  );
}
