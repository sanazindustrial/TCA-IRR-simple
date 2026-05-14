// Server-side proxy for individual SSD audit log — keeps SSD_API_KEY off the client bundle
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://tcairrapiccontainer.azurewebsites.net';

const SSD_API_KEY = process.env.SSD_API_KEY;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SSD_API_KEY) {
    return NextResponse.json({ error: 'SSD service not configured' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/ssd/audit/logs/${encodeURIComponent(id)}`, {
      headers: { 'Accept': 'application/json', 'X-API-Key': SSD_API_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SSD_API_KEY) {
    return NextResponse.json({ error: 'SSD service not configured' }, { status: 503 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/ssd/audit/logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json', 'X-API-Key': SSD_API_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
