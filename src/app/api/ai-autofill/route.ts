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

function inferCompanyNameFromText(text: string): string {
  const patterns: RegExp[] = [
    /(?:company|startup|organization|legal)\s*(?:name)?\s*[:\-]\s*([^\n]{2,100})/i,
    /\b([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*,\s*(?:[A-Z][a-z]+ing\b[^\n]*)/,
    /(?:^|\n)\s*([A-Z][A-Za-z0-9&.'-]*(?:\s+[A-Z][A-Za-z0-9&.'-]*){0,3})\s*(?:\n|$)/m,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    const candidate = cleanCompanyName(match?.[1]);
    if (candidate) return candidate;
  }

  return '';
}

function normalizeWebsite(value: unknown): string {
  if (typeof value !== 'string') return '';
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/.*)?$/.test(raw)) return `https://${raw}`;
  return '';
}

function guessWebsiteFromCompanyName(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join('');
  if (slug.length < 3) return '';
  return `https://${slug}.com`;
}

function isWebsiteLikelyForCompany(website: string, companyName: string): boolean {
  try {
    const host = new URL(normalizeWebsite(website)).hostname.toLowerCase().replace(/^www\./, '');
    const companyTokens = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4);
    if (companyTokens.length === 0) return true;
    return companyTokens.some((token) => host.includes(token));
  } catch {
    return false;
  }
}

async function enrichCompanyOnline(companyName: string): Promise<Record<string, unknown>> {
  const enriched: Record<string, unknown> = {};
  const query = companyName.trim();
  if (!query) return enriched;

  const pickBestWebsiteFromHtml = (html: string): string => {
    const matches = [...html.matchAll(/uddg=([^&"']+)/g)].map((m) => decodeURIComponent(m[1]));
    const blockedHosts = [
      'duckduckgo.com', 'google.com', 'bing.com', 'yahoo.com', 'wikipedia.org',
      'linkedin.com', 'facebook.com', 'instagram.com', 'youtube.com', 'news.ycombinator.com',
    ];
    for (const candidate of matches) {
      const normalized = normalizeWebsite(candidate);
      if (!normalized) continue;
      try {
        const host = new URL(normalized).hostname.toLowerCase();
        if (!blockedHosts.some((blocked) => host.includes(blocked))) {
          return normalized;
        }
      } catch {
        // ignore invalid URL
      }
    }
    return '';
  };

  const buildGuessedDomains = (name: string): string[] => {
    const slug = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).join('');
    if (!slug || slug.length < 3) return [];
    return [`https://${slug}.com`, `https://www.${slug}.com`];
  };

  const canReachDomain = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, cache: 'no-store' });
      clearTimeout(tid);
      return res.status >= 200 && res.status < 500;
    } catch {
      return false;
    }
  };

  // 1) Clearbit company autocomplete (public endpoint)
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json() as Array<{ name?: string; domain?: string }>;
      const top = Array.isArray(data) ? data[0] : undefined;
      if (top?.name) {
        enriched.legal_name = top.name;
      }
      if (top?.domain) {
        const site = normalizeWebsite(top.domain);
        if (site && isWebsiteLikelyForCompany(site, query)) enriched.website = site;
      }
    }
  } catch {
    // keep trying other strategies
  }

  // 2) Web search fallback for official website
  if (!enriched.website) {
    try {
      const res = await fetch(
        `https://duckduckgo.com/html/?q=${encodeURIComponent(`${query} official website`)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const html = await res.text();
        const picked = pickBestWebsiteFromHtml(html);
        if (picked && isWebsiteLikelyForCompany(picked, query)) enriched.website = picked;
      }
    } catch {
      // ignore and try domain guess
    }
  }

  // 3) Domain guess fallback for early-stage startups without public directory entries
  if (!enriched.website) {
    const guessed = buildGuessedDomains(query);
    for (const candidate of guessed) {
      if (await canReachDomain(candidate)) {
        enriched.website = candidate;
        break;
      }
    }
  }

  // If no legal name discovered, use a cleaned company name as fallback.
  if (!enriched.legal_name) {
    const cleaned = cleanCompanyName(query);
    if (cleaned) enriched.legal_name = cleaned;
  }

  return enriched;
}

function localExtract(text: string): Record<string, unknown> {
  const lower = text.toLowerCase();
  const result: Record<string, unknown> = {};

  // Company name — first capitalised line or "Company: X" pattern
  const inferredCompanyName = inferCompanyNameFromText(text);
  if (inferredCompanyName) result.company_name = inferredCompanyName;

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

  // Pre-money valuation (human-readable string for triage wizard form field)
  const preMoneyMatch =
    text.match(/pre[-\s]?money\s+valuation[:\s]*\$?([\d,.]+)\s*(million|m|billion|b|k|thousand)?/i) ??
    text.match(/valuation[:\s]*\$?([\d,.]+)\s*(million|m|billion|b|k|thousand)?/i);
  if (preMoneyMatch) {
    const raw = preMoneyMatch[1].replace(/,/g, '');
    const mul = preMoneyMatch[2]?.toLowerCase();
    let display = `$${raw}`;
    if (mul === 'million' || mul === 'm') display = `$${raw}M`;
    else if (mul === 'billion' || mul === 'b') display = `$${raw}B`;
    else if (mul === 'thousand' || mul === 'k') display = `$${raw}K`;
    result.pre_money_valuation = display;
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function flattenRecord(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  for (const value of Object.values(input)) {
    if (!isObjectRecord(value)) continue;
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      if (!(nestedKey in out) && nestedValue !== undefined) {
        out[nestedKey] = nestedValue;
      }
    }
  }
  return out;
}

function cleanCompanyName(value: unknown): string {
  if (typeof value !== 'string') return '';

  let candidate = value
    .replace(/\r\n/g, '\n')
    .split('\n')[0]
    .replace(/\s+/g, ' ')
    .trim();

  if (!candidate) return '';

  const separators = [' | ', ' - ', ' -', ' |', ' -- ', ' : ', ' - ', ' -'];
  for (const sep of separators) {
    const idx = candidate.indexOf(sep);
    if (idx > 2) {
      const left = candidate.slice(0, idx).trim();
      if (left.length >= 2) {
        candidate = left;
        break;
      }
    }
  }

  // Remove trailing sentence/tagline parts.
  candidate = candidate.split(/[.!?]/)[0].trim();
  if (candidate.includes(',')) {
    const [left, right = ''] = candidate.split(',', 2).map((part) => part.trim());
    if (left.length >= 2 && (right.split(/\s+/).length <= 2 || /ing$/i.test(right))) {
      candidate = left;
    }
  }
  candidate = candidate.replace(/\s+we\b.*$/i, '').trim();

  candidate = candidate.replace(/^['"`\s]+|['"`\s]+$/g, '').trim();
  if (!candidate) return '';

  const invalidSentenceHint = /(specializing|delivering|transforming|platform|solution|that\s+deliver|we\s+|our\s+)/i;
  if (invalidSentenceHint.test(candidate) && candidate.split(/\s+/).length > 4) {
    const titleLead = candidate.match(/^[A-Z0-9][A-Za-z0-9&.'-]*(?:\s+[A-Z0-9][A-Za-z0-9&.'-]*){0,3}/)?.[0] ?? '';
    candidate = titleLead || '';
  }

  if (!candidate) return '';
  if (candidate.length > 60) {
    const shortened = candidate.slice(0, 60);
    const wordSafe = shortened.slice(0, shortened.lastIndexOf(' ')).trim();
    candidate = wordSafe || shortened.trim();
  }

  if (/^[a-z]/.test(candidate) && candidate.split(/\s+/).length >= 4) {
    return '';
  }

  return candidate;
}

function inferBusinessModel(text: string): string {
  const lower = text.toLowerCase();
  if (/subscription|monthly|arr|mrr|saas|license/.test(lower)) return 'B2B SaaS subscription';
  if (/marketplace|take rate|buyer|seller/.test(lower)) return 'Marketplace';
  if (/enterprise|pilot|contracts|procurement/.test(lower)) return 'B2B enterprise sales';
  if (/consumer|direct-to-consumer|d2c|e-commerce/.test(lower)) return 'D2C / Consumer';
  if (/hospital|clinic|provider|medtech|device/.test(lower)) return 'Healthcare / MedTech sales';
  return '';
}

function improveCompanyInfoQuality(payload: Record<string, unknown>, sourceText: string): Record<string, unknown> {
  const improved: Record<string, unknown> = { ...payload };

  const cleanOneLine = (value: string): string => {
    return value
      .replace(/^company\s+name\s*:\s*/i, '')
      .replace(/^startup\s+name\s*:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const cleanedName = cleanCompanyName(improved.company_name ?? improved.companyName ?? improved.legal_name ?? improved.legalName);
  if (cleanedName) {
    improved.company_name = cleanedName;
    improved.companyName = cleanedName;
  } else {
    const inferredName = inferCompanyNameFromText(sourceText);
    if (inferredName) {
      improved.company_name = inferredName;
      improved.companyName = inferredName;
    }
  }

  if (!improved.business_model) {
    const inferred = inferBusinessModel(sourceText);
    if (inferred) {
      improved.business_model = inferred;
      improved.businessModel = inferred;
    }
  }

  if (!improved.legal_name) {
    const fallbackLegal = cleanCompanyName(String(improved.company_name ?? improved.companyName ?? ''));
    if (fallbackLegal) {
      improved.legal_name = fallbackLegal;
      improved.legalName = fallbackLegal;
    }
  }

  if (!improved.website) {
    const directUrl = sourceText.match(/https?:\/\/[^\s"'<>()]+\.[a-z]{2,}/i)?.[0] ?? '';
    const normalizedUrl = normalizeWebsite(directUrl);
    if (normalizedUrl) {
      improved.website = normalizedUrl;
    } else {
      const websiteGuess = guessWebsiteFromCompanyName(String(improved.company_name ?? improved.companyName ?? ''));
      if (websiteGuess) improved.website = websiteGuess;
    }
  }

  if (typeof improved.website === 'string' && typeof improved.company_name === 'string') {
    const normalized = normalizeWebsite(improved.website);
    if (!isWebsiteLikelyForCompany(normalized, improved.company_name)) {
      const websiteGuess = guessWebsiteFromCompanyName(improved.company_name);
      if (websiteGuess) improved.website = websiteGuess;
    } else {
      improved.website = normalized;
    }
  }

  if (!improved.annual_revenue) {
    const revenue = improved.revenue ?? improved.annualRevenue ?? improved.yearly_revenue ?? improved.yearlyRevenue;
    if (revenue !== undefined && revenue !== null && String(revenue).trim() !== '') {
      improved.annual_revenue = String(revenue);
      improved.annualRevenue = String(revenue);
    }
  }

  if (!improved.number_of_employees) {
    const fromTeamInfo = typeof improved.team_info === 'string'
      ? improved.team_info.match(/(?:team\s+size|employees?|headcount|staff)[:\s]*(\d{1,6})/i)?.[1]
      : undefined;
    const fromSource = sourceText.match(/(?:team\s+size|employees?|headcount|staff)[:\s]*(\d{1,6})/i)?.[1];
    const employees = fromTeamInfo ?? fromSource;
    if (employees) {
      improved.number_of_employees = employees;
      improved.numberOfEmployees = employees;
    }
  }

  if ((!improved.city || !improved.state || !improved.country) && typeof improved.location === 'string') {
    const parts = improved.location.split(',').map((p) => p.trim()).filter(Boolean);
    if (!improved.city && parts[0]) improved.city = parts[0];
    if (!improved.state && parts[1]) improved.state = parts[1];
    if (!improved.country && parts[2]) improved.country = parts[2];
  }

  if (!improved.one_line_description && typeof improved.pitch_summary === 'string') {
    const oneLine = improved.pitch_summary.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length >= 20 && s.length <= 160) ?? '';
    if (oneLine) {
      const cleaned = cleanOneLine(oneLine);
      improved.one_line_description = cleaned;
      improved.oneLineDescription = cleaned;
    }
  } else if (typeof improved.one_line_description === 'string') {
    const cleaned = cleanOneLine(improved.one_line_description);
    improved.one_line_description = cleaned;
    improved.oneLineDescription = cleaned;
  } else if (typeof improved.oneLineDescription === 'string') {
    const cleaned = cleanOneLine(improved.oneLineDescription);
    improved.one_line_description = cleaned;
    improved.oneLineDescription = cleaned;
  }

  if (!improved.company_description && typeof improved.pitch_summary === 'string') {
    const summary = String(improved.pitch_summary).trim();
    if (summary) {
      improved.company_description = summary.slice(0, 1500);
      improved.companyDescription = improved.company_description;
    }
  }

  if (!improved.product_description) {
    const fromProduct = typeof improved.productDescription === 'string' ? improved.productDescription : '';
    const fromOneLine = typeof improved.one_line_description === 'string' ? improved.one_line_description : '';
    const fromCompanyDesc = typeof improved.company_description === 'string' ? improved.company_description : '';
    const product = fromProduct || fromOneLine || fromCompanyDesc.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length >= 20) || '';
    if (product) {
      improved.product_description = product;
      improved.productDescription = product;
    }
  }

  if (typeof improved.company_name === 'string' && improved.company_name.includes(',')) {
    const concise = improved.company_name.split(',')[0].trim();
    if (concise.length >= 2) {
      improved.company_name = concise;
      improved.companyName = concise;
    }
  }

  return improved;
}

function normalizeExtractionPayload(input: Record<string, unknown>): Record<string, unknown> {
  const flat = flattenRecord(input);
  const normalized: Record<string, unknown> = { ...flat };

  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      const val = flat[key];
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return undefined;
  };

  const aliases: Record<string, string[]> = {
    company_name: ['company_name', 'companyName', 'startup_name', 'startupName', 'name', 'organization_name'],
    website: ['website', 'company_website', 'companyWebsite', 'url', 'domain'],
    sector: ['sector', 'industry', 'industry_vertical', 'industryVertical', 'vertical'],
    stage: ['stage', 'company_stage', 'companyStage', 'funding_stage', 'fundingStage', 'development_stage', 'developmentStage'],
    business_model: ['business_model', 'businessModel', 'model'],
    pitch_deck_path: ['pitch_deck_path', 'pitchDeckPath'],
    country: ['country'],
    state: ['state', 'province', 'region'],
    city: ['city'],
    location: ['location', 'hq', 'headquarters', 'headquarter_location', 'headquarterLocation', 'city_country'],
    company_description: ['company_description', 'companyDescription', 'description', 'about', 'startup_description', 'startupDescription'],
    one_line_description: ['one_line_description', 'oneLineDescription', 'tagline', 'summary_line', 'executive_summary_line'],
    pitch_summary: ['pitch_summary', 'pitchSummary', 'executive_summary', 'executiveSummary', 'summary', 'problemSolution'],
    key_metrics: ['key_metrics', 'keyMetrics', 'metrics', 'traction_metrics', 'tractionMetrics', 'cashFlow', 'fundingHistory'],
    team_info: ['team_info', 'teamInfo', 'team_background', 'teamBackground', 'founder_info', 'founderInfo', 'companyBackgroundTeam'],
    product_description: ['product_description', 'productDescription', 'product_overview', 'productOverview', 'solution_description', 'solutionDescription'],
    annual_revenue: ['annual_revenue', 'annualRevenue', 'yearly_revenue', 'yearlyRevenue'],
    pre_money_valuation: ['pre_money_valuation', 'preMoneyValuation'],
    legal_name: ['legal_name', 'legalName'],
    number_of_employees: ['number_of_employees', 'numberOfEmployees', 'team_size'],
  };

  for (const [canonical, keys] of Object.entries(aliases)) {
    const value = pick(...keys);
    if (value !== undefined) normalized[canonical] = value;
  }

  // Keep camelCase aliases expected by existing triage page logic.
  if (normalized.pitch_summary && !normalized.pitchSummary) normalized.pitchSummary = normalized.pitch_summary;
  if (normalized.key_metrics && !normalized.keyMetrics) normalized.keyMetrics = normalized.key_metrics;
  if (normalized.team_info && !normalized.teamInfo) normalized.teamInfo = normalized.team_info;
  if (normalized.product_description && !normalized.productDescription) normalized.productDescription = normalized.product_description;
  if (normalized.one_line_description && !normalized.oneLineDescription) normalized.oneLineDescription = normalized.one_line_description;
  if (normalized.business_model && !normalized.businessModel) normalized.businessModel = normalized.business_model;
  if (normalized.pitch_deck_path && !normalized.pitchDeckPath) normalized.pitchDeckPath = normalized.pitch_deck_path;
  if (normalized.sector && !normalized.industryVertical) normalized.industryVertical = normalized.sector;
  if (normalized.stage && !normalized.developmentStage) normalized.developmentStage = normalized.stage;
  if (normalized.company_description && !normalized.companyDescription) normalized.companyDescription = normalized.company_description;
  if (normalized.annual_revenue && !normalized.annualRevenue) normalized.annualRevenue = normalized.annual_revenue;
  if (normalized.pre_money_valuation && !normalized.preMoneyValuation) normalized.preMoneyValuation = normalized.pre_money_valuation;
  if (normalized.legal_name && !normalized.legalName) normalized.legalName = normalized.legal_name;
  if (normalized.number_of_employees && !normalized.numberOfEmployees) normalized.numberOfEmployees = normalized.number_of_employees;

  // Build location from SSD-style city/state/country fields when location is not provided.
  if (!normalized.location) {
    const city = typeof normalized.city === 'string' ? normalized.city.trim() : '';
    const state = typeof normalized.state === 'string' ? normalized.state.trim() : '';
    const country = typeof normalized.country === 'string' ? normalized.country.trim() : '';
    const parts = [city, state, country].filter(Boolean);
    if (parts.length > 0) {
      normalized.location = parts.join(', ');
    }
  }

  // Quality fallback: if pitch summary is missing, use company description.
  if (!normalized.pitch_summary && normalized.company_description) {
    normalized.pitch_summary = normalized.company_description;
    normalized.pitchSummary = normalized.company_description;
  }

  // If key metrics are empty, synthesize a compact metrics summary from numeric SSD fields.
  if (!normalized.key_metrics) {
    const snippets: string[] = [];
    if (normalized.annual_revenue !== undefined) snippets.push(`Annual Revenue: ${String(normalized.annual_revenue)}`);
    if (normalized.pre_money_valuation !== undefined) snippets.push(`Pre-money Valuation: ${String(normalized.pre_money_valuation)}`);
    if (normalized.monthlyRecurringRevenue !== undefined) snippets.push(`MRR: ${String(normalized.monthlyRecurringRevenue)}`);
    if (normalized.burnRate !== undefined || normalized.burn_rate !== undefined) snippets.push(`Burn Rate: ${String(normalized.burnRate ?? normalized.burn_rate)}`);
    if (snippets.length > 0) {
      normalized.key_metrics = snippets.join('\n');
      normalized.keyMetrics = normalized.key_metrics;
    }
  }

  return normalized;
}

// ── Call backend AI extraction ─────────────────────────────────────────────

async function callBackendAI(text: string, token?: string): Promise<Record<string, unknown> | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const endpoints = [
    '/api/v1/ai/extract',
    '/api/v1/ai/autofill',
    '/api/v1/analysis/ai-extract',
    '/api/v1/analysis/extract-company-info',
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
        body: JSON.stringify({
          text,
          max_tokens: 2500,
          temperature: 0.1,
          quality: 'high',
          output_format: 'json',
          schema: 'ssd_tca_tirr_v1',
          extraction_goal: 'Fill all startup steroid company information fields with concise, high-confidence values. Prefer canonical company name without marketing taglines.',
          required_fields: [
            'companyName',
            'legalName',
            'industryVertical',
            'developmentStage',
            'businessModel',
            'website',
            'country',
            'state',
            'city',
            'oneLineDescription',
            'companyDescription',
            'productDescription',
            'annualRevenue',
            'preMoneyValuation',
            'numberOfEmployees',
          ],
        }),
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
      companyHint?: string;
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

    const normalized = normalizeExtractionPayload(merged);
    const improved = improveCompanyInfoQuality(normalized, text);

    // If critical company fields are still missing, enrich via online company lookup.
    const companyHintRaw =
      (typeof body.companyHint === 'string' ? body.companyHint : '') ||
      (typeof improved.company_name === 'string' ? improved.company_name : '') ||
      (typeof improved.companyName === 'string' ? improved.companyName : '');

    if (companyHintRaw && (!improved.website || !improved.legal_name)) {
      const online = await enrichCompanyOnline(companyHintRaw);
      if (!improved.website && online.website) {
        improved.website = online.website;
      }
      if (!improved.legal_name && online.legal_name) {
        improved.legal_name = online.legal_name;
        if (!improved.legalName) improved.legalName = online.legal_name;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: improved,
        source: aiResult ? 'ai+local' : 'local',
        fieldsExtracted: Object.keys(improved).filter(k => improved[k] !== '' && improved[k] !== null && improved[k] !== undefined).length,
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
