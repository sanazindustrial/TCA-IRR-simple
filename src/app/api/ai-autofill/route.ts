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

  // Founder names (lines with CEO/Founder/Co-Founder followed by a name)
  const founderMatches = text.match(/(?:ceo|cto|coo|cfo|founder|co-founder|cofounder)[:\s,–-]*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})/gi);
  if (founderMatches) {
    result.founder_names = founderMatches.map(m => m.replace(/(?:ceo|cto|coo|cfo|founder|co-founder|cofounder)[:\s,–-]*/gi, '').trim()).slice(0, 6).join(', ');
    result.founder_count = founderMatches.filter(m => /founder/i.test(m)).length || 1;
  }

  // Team size
  const teamSizeMatch = text.match(/(?:team\s+of|employees?|headcount|staff(?:\s+of)?)[:\s]*(\d+)/i);
  if (teamSizeMatch) result.team_size = parseInt(teamSizeMatch[1]);

  // Market size — TAM/SAM/SOM
  const tamMatch = text.match(/\bTAM[:\s]*\$?([\d,.]+)\s*(billion|million|b|m|B|M)/i);
  if (tamMatch) {
    let v = parseFloat(tamMatch[1].replace(/,/g, ''));
    const u = tamMatch[2].toLowerCase();
    if (u === 'billion' || u === 'b') v *= 1e9;
    else if (u === 'million' || u === 'm') v *= 1e6;
    result.tam = v;
  }
  const samMatch = text.match(/\bSAM[:\s]*\$?([\d,.]+)\s*(billion|million|b|m|B|M)/i);
  if (samMatch) {
    let v = parseFloat(samMatch[1].replace(/,/g, ''));
    const u = samMatch[2].toLowerCase();
    if (u === 'billion' || u === 'b') v *= 1e9;
    else if (u === 'million' || u === 'm') v *= 1e6;
    result.sam = v;
  }
  const somMatch = text.match(/\bSOM[:\s]*\$?([\d,.]+)\s*(billion|million|b|m|B|M)/i);
  if (somMatch) {
    let v = parseFloat(somMatch[1].replace(/,/g, ''));
    const u = somMatch[2].toLowerCase();
    if (u === 'billion' || u === 'b') v *= 1e9;
    else if (u === 'million' || u === 'm') v *= 1e6;
    result.som = v;
  }

  // Market growth rate
  const mgrMatch = text.match(/(?:market\s+growth|CAGR)[:\s]*(\d+(?:\.\d+)?)\s*%/i);
  if (mgrMatch) result.market_growth_rate = parseFloat(mgrMatch[1]);

  // Competitors
  const competitorMatch = text.match(/(?:competitors?|competing\s+with|vs\.?)[:\s]+([A-Za-z0-9\s,&.]+?)(?:\.|$|\n)/im);
  if (competitorMatch?.[1]) result.competitors = competitorMatch[1].trim();

  // Gross margin
  const gmMatch = text.match(/gross\s+margin[:\s]*(\d+(?:\.\d+)?)\s*%/i);
  if (gmMatch) result.gross_margin = parseFloat(gmMatch[1]);

  // CAC and LTV
  const cacMatch = text.match(/(?:CAC|customer\s+acquisition\s+cost)[:\s]*\$?([\d,.]+)/i);
  if (cacMatch) result.cac = parseFloat(cacMatch[1].replace(/,/g, ''));
  const ltvMatch = text.match(/(?:LTV|lifetime\s+value)[:\s]*\$?([\d,.]+)/i);
  if (ltvMatch) result.ltv = parseFloat(ltvMatch[1].replace(/,/g, ''));

  // Revenue growth rate
  const rgrMatch = text.match(/(?:revenue\s+growth|growing\s+at)[:\s]*(\d+(?:\.\d+)?)\s*%/i);
  if (rgrMatch) result.revenue_growth_rate = parseFloat(rgrMatch[1]);

  // Patents filed
  const patentMatch = text.match(/(\d+)\s+patents?(?:\s+filed)?/i);
  if (patentMatch) result.patents_filed = parseInt(patentMatch[1]);
  const ipMatch = text.match(/(?:IP|intellectual\s+property)[:\s]+([^\n.]{10,200})/i);
  if (ipMatch?.[1]) result.ip_strategy = ipMatch[1].trim();

  // Key risks
  const riskMatch = text.match(/(?:key\s+risks?|main\s+risks?|regulatory\s+risk)[:\s]+([^\n]{10,300})/i);
  if (riskMatch?.[1]) result.key_risks = riskMatch[1].trim();

  // Exit strategy
  const exitMatch = text.match(/(?:exit\s+strategy|exit\s+options?|IPO|acquisition)[:\s]*([^\n.]{5,200})/i);
  if (exitMatch?.[1]) result.exit_strategy = exitMatch[1].trim();

  // ESG / sustainability
  const esgMatch = text.match(/(?:ESG|sustainability|social\s+impact|environmental)[:\s]+([^\n.]{10,200})/i);
  if (esgMatch?.[1]) result.esg_notes = esgMatch[1].trim();

  // GTM strategy
  const gtmMatch = text.match(/(?:go-to-market|GTM\s+strategy|marketing\s+strategy)[:\s]+([^\n.]{10,300})/i);
  if (gtmMatch?.[1]) result.gtm_strategy = gtmMatch[1].trim();

  // USP / value proposition
  const uspMatch = text.match(/(?:unique\s+value|value\s+proposition|USP|differentiator)[:\s]+([^\n.]{10,300})/i);
  if (uspMatch?.[1]) result.unique_value_proposition = uspMatch[1].trim();

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
