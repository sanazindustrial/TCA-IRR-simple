/**
 * AI Multi-Agent Auto-Fill API Route
 *
 * Receives extracted pitch deck text and uses the backend AI service to
 * extract structured company data for all triage wizard fields.
 *
 * Agents:
 *   - Company agent   → name, sector, stage, location, website, description
 *   - Financial agent → revenue, funding, MRR/ARR, burn rate, valuation
 *   - Team agent      → founders, co-founders, team size, backgrounds
 *   - Product agent   → product description, technology, IP, USP
 *   - Market agent    → TAM, SAM, competitors, market trends
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tcairrapiccontainer.azurewebsites.net';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// ── Regex-based local extraction fallback ─────────────────────────────────────

function localExtract(text: string): Record<string, unknown> {
  const lower = text.toLowerCase();
  const result: Record<string, unknown> = {};

  // Company name — first capitalised line or "Company: X" pattern
  const nameMatch =
    text.match(/company(?:\s+name)?[:\s]+([A-Za-z0-9\s&.,'-]{2,80})/i) ??
    text.match(/^([A-Z][A-Za-z0-9\s&.,'-]{2,60})[\r\n]/m);
  if (nameMatch?.[1]) result.company_name = nameMatch[1].trim();

  // Website
  const urlMatch = text.match(/https?:\/\/[^\s"'<>()]+\.[a-z]{2,}/i);
  if (urlMatch) result.website = urlMatch[0];

  // Stage
  const stages: [RegExp, string][] = [
    [/pre[-\s]?seed/i, 'Pre-seed'],
    [/\bseed\b/i, 'Seed'],
    [/series\s*a\b/i, 'Series A'],
    [/series\s*b\b/i, 'Series B'],
    [/series\s*c\b/i, 'Series C+'],
    [/\bgrowth\b/i, 'Growth'],
  ];
  for (const [re, label] of stages) {
    if (re.test(lower)) { result.stage = label; break; }
  }

  // Sector
  const sectorMap: [RegExp, string][] = [
    [/\bsaas\b|\bsoftware\b/i, 'Technology / SaaS'],
    [/\bmedtech\b|\bhealthcare\b|\bmedical\b/i, 'Healthcare / MedTech'],
    [/\bbiotech\b|\bbiotechnology\b|\bpharma\b/i, 'Biotechnology'],
    [/\bfintech\b|\bfinancial tech/i, 'FinTech'],
    [/\bcleantech\b|\bclean energy\b|\bclimate\b/i, 'CleanTech / Energy'],
    [/\becommerce\b|\be-commerce\b|\bretail\b/i, 'E-commerce / Retail'],
    [/\bmanufacturing\b/i, 'Manufacturing'],
    [/\bai\b|\bmachine learning\b|\bdeep tech\b/i, 'AI / Deep Tech'],
  ];
  for (const [re, label] of sectorMap) {
    if (re.test(lower)) { result.sector = label; break; }
  }

  // Location
  const locMatch =
    text.match(/(?:headquartered|based|located)\s+(?:in\s+)?([A-Za-z\s,]{3,60}(?:CA|NY|TX|FL|WA|MA|UK|US|USA))/i) ??
    text.match(/([A-Za-z]{3,},\s*(?:CA|NY|TX|FL|WA|MA|IL|GA|CO|UK))/);
  if (locMatch?.[1]) result.location = locMatch[1].trim();

  // Business model
  const bmMatch = text.match(/(?:business model|model)[:\s]+([^\n.]{5,120})/i);
  if (bmMatch?.[1]) result.business_model = bmMatch[1].trim();

  // One-liner — first substantive sentence
  const sentences = text.split(/[.!?\n]/).map(s => s.trim()).filter(s => s.length > 20 && s.length < 200);
  if (sentences[0]) result.one_line_description = sentences[0];

  // Description — first 1500 chars of text
  result.company_description = text.slice(0, 1500).trim();

  // Financial metrics
  const revenueMatch = text.match(/revenue[:\s]*\$?([\d,.]+)\s*(million|m|k|thousand)?/i);
  if (revenueMatch) {
    let amt = parseFloat(revenueMatch[1].replace(/,/g, ''));
    const mul = revenueMatch[2]?.toLowerCase();
    if (mul === 'million' || mul === 'm') amt *= 1_000_000;
    if (mul === 'thousand' || mul === 'k') amt *= 1_000;
    result.revenue = amt;
  }

  const fundingMatch = text.match(/(?:raised|funding|raised\s+\$?|total\s+funding)[:\s]*\$?([\d,.]+)\s*(million|m|k)?/i);
  if (fundingMatch) {
    let amt = parseFloat(fundingMatch[1].replace(/,/g, ''));
    const mul = fundingMatch[2]?.toLowerCase();
    if (mul === 'million' || mul === 'm') amt *= 1_000_000;
    if (mul === 'thousand' || mul === 'k') amt *= 1_000;
    result.total_funding = amt;
  }

  const mrrMatch = text.match(/mrr[:\s]*\$?([\d,.]+)\s*(k|thousand)?/i);
  if (mrrMatch) {
    let amt = parseFloat(mrrMatch[1].replace(/,/g, ''));
    if (mrrMatch[2]) amt *= 1_000;
    result.mrr = amt;
  }

  const arrMatch = text.match(/arr[:\s]*\$?([\d,.]+)\s*(million|m)?/i);
  if (arrMatch) {
    let amt = parseFloat(arrMatch[1].replace(/,/g, ''));
    if (arrMatch[2]) amt *= 1_000_000;
    result.arr = amt;
  }

  const burnMatch = text.match(/burn\s*rate[:\s]*\$?([\d,.]+)\s*(k|thousand)?\/\s*(?:month|mo)/i);
  if (burnMatch) {
    let amt = parseFloat(burnMatch[1].replace(/,/g, ''));
    if (burnMatch[2]) amt *= 1_000;
    result.burn_rate = amt;
  }

  const runwayMatch = text.match(/runway[:\s]*(\d+)\s*months?/i);
  if (runwayMatch) result.runway_months = parseInt(runwayMatch[1]);

  // Valuation
  const valMatch = text.match(/valuation[:\s]*\$?([\d,.]+)\s*(million|m|billion|b)?/i);
  if (valMatch) {
    let amt = parseFloat(valMatch[1].replace(/,/g, ''));
    const mul = valMatch[2]?.toLowerCase();
    if (mul === 'million' || mul === 'm') amt *= 1_000_000;
    if (mul === 'billion' || mul === 'b') amt *= 1_000_000_000;
    result.valuation = amt;
  }

  // Team info
  const teamMatches = text.match(/(?:team|founder|ceo|cto|co-founder)[^\n.]{0,200}/gi);
  if (teamMatches) result.team_info = teamMatches.slice(0, 5).join('\n');

  // Key metrics
  const metricsMatches = text.match(/(?:ARR|MRR|revenue|customers?|users?|growth|burn|runway)[^\n.]{0,120}/gi);
  if (metricsMatches) result.key_metrics = metricsMatches.slice(0, 6).join('\n');

  // Product description
  const prodMatch = text.match(/(?:product|platform|solution|service)[:\s]+([^\n.]{20,300})/i);
  if (prodMatch?.[1]) result.product_description = prodMatch[1].trim();

  // Pitch summary — first 4000 chars
  result.pitch_summary = text.slice(0, 4000).trim();

  return result;
}

// ── Call backend AI extraction ─────────────────────────────────────────────

async function callBackendAI(text: string, token?: string): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const endpoints = [
    '/api/v1/ai/extract',
    '/api/v1/ai/autofill',
    '/api/v1/analysis/ai-extract',
    '/api/v1/tca/extract-fields',
    '/api/v1/extract/ai',
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 20_000);
      const res = await fetch(`${BACKEND}${ep}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, max_tokens: 2000 }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (res.ok) {
        const data = await res.json();
        // Normalise common response shapes
        const d = data.data ?? data.extracted ?? data.result ?? data;
        if (typeof d === 'object' && d !== null && Object.keys(d).length > 2) {
          return d as Record<string, unknown>;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

// ── Main handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      text: string;
      filename?: string;
      token?: string;
    };

    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400, headers: corsHeaders });
    }

    const text = body.text.slice(0, 50_000); // cap at 50 k chars

    // Run AI extraction in parallel with local extraction
    const [aiResult, localResult] = await Promise.all([
      callBackendAI(text, body.token),
      Promise.resolve(localExtract(text)),
    ]);

    // Merge: AI result takes priority, local fills gaps
    const merged: Record<string, unknown> = { ...localResult };
    if (aiResult) {
      // Apply AI results only where they have non-empty values
      for (const [key, val] of Object.entries(aiResult)) {
        if (val !== null && val !== undefined && val !== '') {
          merged[key] = val;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: merged,
        source: aiResult ? 'ai+local' : 'local',
        fieldsExtracted: Object.keys(merged).filter(k => merged[k] !== '' && merged[k] !== null && merged[k] !== undefined).length,
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('[/api/ai-autofill] Error:', err);
    return NextResponse.json(
      { error: 'AI autofill failed', detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
