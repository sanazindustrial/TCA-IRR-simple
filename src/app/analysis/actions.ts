'use server';

import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';
// Try different backend URLs based on environment
const BACKEND_API_URL = 'https://tcairrapiccontainer.azurewebsites.net'; // Production fallback
const API_VERSION = '/api/v1'; // API prefix with version

console.log('Backend API URL:', BACKEND_API_URL);
console.log('Environment:', process.env.NODE_ENV);

// Preserve original sector mapping for comprehensive analysis
const sectorMap = {
  general: 'tech',
  medtech: 'med_life'
} as const;

// Backend sector mapping for TCA analysis
const backendSectorMap = {
  general: 'technology_others',
  medtech: 'life_sciences_medical'
} as const;

// ============================================================================
// Free External Data Enrichment — auto-fetched for every analysis
// ============================================================================

/** Block private/internal URLs to prevent SSRF attacks */
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const h = parsed.hostname.toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false;
    if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
    if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.localhost')) return false;
    return true;
  } catch { return false; }
}

/** Fetch text content from a URL (company site, news article, etc.) */
async function fetchUrlContent(url: string): Promise<string> {
  if (!isSafeUrl(url)) return '';
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TCA-IRR-App/1.0 (Investment Analysis Tool)' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2500);
  } catch { return ''; }
}

/** Wikipedia REST API — company/sector summary (free, no auth required) */
async function fetchWikipediaSummary(query: string): Promise<string> {
  try {
    const title = encodeURIComponent(query.trim().replace(/\s+/g, '_'));
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return '';
    const data = await res.json();
    return ((data.extract as string) || '').slice(0, 1500);
  } catch { return ''; }
}

/** Hacker News Algolia API — community mentions (free, no auth required) */
async function fetchHackerNewsMentions(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=6`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const stories: any[] = data.hits || [];
    if (!stories.length) return '';
    return stories
      .map((s: any) => `- ${s.title} (${s.points || 0} pts, ${(s.created_at || '').split('T')[0]})`)
      .join('\n');
  } catch { return ''; }
}

/** GitHub public API — org/repo info (free, no auth for basic searches) */
async function fetchGitHubInfo(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.github.com/search/users?q=${encodeURIComponent(query)}+type:org&per_page=3`,
      { headers: { 'Accept': 'application/vnd.github.v3+json' }, signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const orgs: any[] = data.items || [];
    if (!orgs.length) return '';
    const orgRes = await fetch(orgs[0].url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!orgRes.ok) return `GitHub org found: ${orgs[0].login}`;
    const org = await orgRes.json();
    return `GitHub: ${org.name || org.login} — ${org.public_repos || 0} public repos, ${org.followers || 0} followers${org.blog ? `, site: ${org.blog}` : ''}${org.description ? `. ${org.description}` : ''}`;
  } catch { return ''; }
}

/** FRED economic data — GDP growth + Fed Funds Rate (free with DEMO_KEY) */
async function fetchFREDEconomicData(): Promise<string> {
  try {
    const [gdpRes, rateRes] = await Promise.all([
      fetch('https://api.stlouisfed.org/fred/series/observations?series_id=A191RL1A225NBEA&api_key=DEMO_KEY&file_type=json&limit=2&sort_order=desc', { signal: AbortSignal.timeout(6000) }),
      fetch('https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=DEMO_KEY&file_type=json&limit=1&sort_order=desc', { signal: AbortSignal.timeout(6000) }),
    ]);
    const parts: string[] = [];
    if (gdpRes.ok) {
      const d = await gdpRes.json();
      const latest = d.observations?.[0];
      if (latest?.value && latest.value !== '.') parts.push(`US Real GDP Growth: ${latest.value}% (${latest.date})`);
    }
    if (rateRes.ok) {
      const d = await rateRes.json();
      const latest = d.observations?.[0];
      if (latest?.value && latest.value !== '.') parts.push(`Fed Funds Rate: ${latest.value}% (${latest.date})`);
    }
    return parts.join('; ');
  } catch { return ''; }
}

type EnrichmentData = { urlContent: string; wikiSummary: string; hnMentions: string; githubData: string; fredData: string };

/** Aggregate all free external enrichment sources in parallel (10 s overall cap) */
async function enrichWithExternalData(params: { companyName: string; importedUrls: string[] }): Promise<EnrichmentData> {
  const { companyName, importedUrls } = params;
  const [urlRes, wikiRes, hnRes, githubRes, fredRes] = await Promise.allSettled([
    importedUrls.length > 0
      ? Promise.all(importedUrls.slice(0, 5).map(fetchUrlContent))
          .then(texts => texts.filter(Boolean).join('\n\n---\n\n').slice(0, 6000))
      : Promise.resolve(''),
    companyName ? fetchWikipediaSummary(companyName) : Promise.resolve(''),
    companyName ? fetchHackerNewsMentions(companyName) : Promise.resolve(''),
    companyName ? fetchGitHubInfo(companyName)         : Promise.resolve(''),
    fetchFREDEconomicData(),
  ]);
  return {
    urlContent:  urlRes.status    === 'fulfilled' ? urlRes.value    : '',
    wikiSummary: wikiRes.status   === 'fulfilled' ? wikiRes.value   : '',
    hnMentions:  hnRes.status     === 'fulfilled' ? hnRes.value     : '',
    githubData:  githubRes.status === 'fulfilled' ? githubRes.value : '',
    fredData:    fredRes.status   === 'fulfilled' ? fredRes.value   : '',
  };
}

export async function runAnalysis(
  framework: 'general' | 'medtech',
  userData?: {
    uploadedFiles?: any[];
    importedUrls?: string[];
    submittedTexts?: string[];
    companyName?: string;
    companyDescription?: string;
    /** Full processedFiles array from localStorage — includes extracted_data.text_content */
    processedFilesData?: any[];
    /** Auto-extraction schema from localStorage['current_extraction_data'] */
    extractionData?: any;
    // Allow extra context fields from triage/due-diligence/other report pages
    [key: string]: any;
  }
): Promise<ComprehensiveAnalysisOutput> {
  try {
    // 1. Input Validation - Now inside try-catch to prevent crash
    if (!['general', 'medtech'].includes(framework)) {
      throw new Error(`Invalid analysis framework: ${framework}. Must be 'general' or 'medtech'.`);
    }
    // Test basic connectivity first (non-blocking)
    console.log('Testing backend connectivity...');
    try {
      const healthCheck = await fetch(`${BACKEND_API_URL}${API_VERSION}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });
      console.log('Health check response:', healthCheck.status, healthCheck.statusText);
      if (!healthCheck.ok) {
        console.warn('Health check returned non-200 status, but continuing with analysis...');
      }
    } catch (healthError) {
      console.error('Health check failed, but continuing with analysis attempt:', healthError);
      // Don't throw error here, just log and continue
    }
    // Use userData if provided, otherwise use empty arrays (localStorage not available in server actions)
    const processedFiles = userData?.uploadedFiles || [];
    const processedUrls = userData?.importedUrls || [];
    const processedTexts = userData?.submittedTexts || [];

    // Use processedFilesData (full text content) when available; fall back to uploadedFiles metadata
    const processedFilesData: any[] = userData?.processedFilesData?.length
      ? userData.processedFilesData
      : processedFiles;

    // Auto-extraction structured schema (populated by client-side auto-extraction service)
    const extractionData: any = userData?.extractionData || {};
    const extractedCompany    = extractionData?.company_analysis    || {};
    const extractedFinSchema  = extractionData?.financial_score     || {};
    const extractedTeam       = extractionData?.team_assessment     || {};
    const extractedMarket     = extractionData?.market_trends       || {};
    const extractedCompetitive= extractionData?.competitive_analysis|| {};
    const extractedIP         = extractionData?.ip_strength         || {};

    // Build combined document text (sent to backend as rich context for all modules)
    const combinedDocumentText = processedFilesData
      .map((f: any) => f?.extracted_data?.text_content || '')
      .filter(Boolean)
      .join('\n\n---\n\n')
      .slice(0, 12000);

    const pitchDeckText = (
      processedFilesData
        .filter((f: any) => f?.isPitchDeck)
        .map((f: any) => f?.extracted_data?.text_content || '')
        .join('\n\n') || combinedDocumentText
    ).slice(0, 6000);

    // Aggregate raw financial data from processedFiles extracted_data
    const aggFin = processedFilesData.reduce((acc: any, file: any) => {
      const fd = file?.extracted_data?.financial_data || {};
      const km = file?.extracted_data?.key_metrics    || {};
      return {
        revenue:       acc.revenue       + (fd.revenue       || 0),
        burn_rate:     acc.burn_rate     + (fd.burn_rate     || 0),
        runway_months: Math.max(acc.runway_months, fd.runway_months || 0),
        mrr:           acc.mrr           + (fd.mrr || km.mrr || 0),
        arr:           acc.arr           + (fd.arr           || 0),
        funding:       acc.funding       + (fd.funding_raised || 0),
        team_size:     Math.max(acc.team_size, fd.team_size || km.team_size || 0),
      };
    }, { revenue: 0, burn_rate: 0, runway_months: 0, mrr: 0, arr: 0, funding: 0, team_size: 0 });

    // Resolve financial metrics — priority: extraction schema > processedFiles > null (no hardcoded guesses)
    const fin = {
      currentRevenue:    extractedFinSchema.current_revenue      || aggFin.revenue       || null,
      mrr:               extractedFinSchema.mrr                  || aggFin.mrr           || null,
      arr:               extractedFinSchema.arr                  || aggFin.arr           || null,
      totalFunding:      extractedFinSchema.total_funding_raised || aggFin.funding        || null,
      burnRate:          extractedFinSchema.burn_rate            || aggFin.burn_rate      || null,
      runwayMonths:      extractedFinSchema.runway_months        || aggFin.runway_months  || null,
      revenueGrowthRate: extractedFinSchema.revenue_growth_rate  || null,
      ltvCacRatio:       extractedFinSchema.ltv_cac_ratio        || null,
      netRetention:      extractedFinSchema.net_retention        || null,
      burnMultiple:      extractedFinSchema.burn_multiple        || null,
      teamSize:          extractedTeam.total_team_size           || aggFin.team_size      || null,
    };

    let companyDesc  = userData?.companyDescription
      || extractedCompany.company_description
      || pitchDeckText.slice(0, 800)
      || '';
    const companyStage = (extractedCompany.development_stage || 'seed').toLowerCase();

    console.log('[actions] processedFilesData count:', processedFilesData.length,
      '| combinedText chars:', combinedDocumentText.length,
      '| fin.currentRevenue:', fin.currentRevenue,
      '| fin.runwayMonths:', fin.runwayMonths);

    // Enrich with free external data sources (parallel, 10 s overall cap)
    const _fallbackEnrichment: EnrichmentData = { urlContent: '', wikiSummary: '', hnMentions: '', githubData: '', fredData: '' };
    const externalEnrichment = await Promise.race([
      enrichWithExternalData({
        companyName: userData?.companyName || extractedCompany.company_name || '',
        importedUrls: processedUrls,
      }),
      new Promise<EnrichmentData>(resolve => setTimeout(() => resolve(_fallbackEnrichment), 10000)),
    ]);
    // Use Wikipedia summary as company description fallback if none was provided
    if (!companyDesc && externalEnrichment.wikiSummary) {
      companyDesc = externalEnrichment.wikiSummary.slice(0, 800);
    }
    // Build enriched document text: original uploaded content + all fetched external data
    const enrichedDocumentText = [
      combinedDocumentText,
      externalEnrichment.urlContent  && `\n\n=== IMPORTED URL CONTENT ===\n${externalEnrichment.urlContent}`,
      externalEnrichment.wikiSummary && `\n\n=== COMPANY OVERVIEW (Wikipedia) ===\n${externalEnrichment.wikiSummary}`,
      externalEnrichment.hnMentions  && `\n\n=== COMMUNITY MENTIONS (HackerNews) ===\n${externalEnrichment.hnMentions}`,
      externalEnrichment.githubData  && `\n\n=== GITHUB DATA ===\n${externalEnrichment.githubData}`,
      externalEnrichment.fredData    && `\n\n=== ECONOMIC CONTEXT ===\n${externalEnrichment.fredData}`,
    ].filter(Boolean).join('').slice(0, 16000);
    console.log('[actions] External enrichment fetched:', {
      urlContentChars: externalEnrichment.urlContent.length,
      wikiChars: externalEnrichment.wikiSummary.length,
      hnMentions: externalEnrichment.hnMentions.length,
      githubData: externalEnrichment.githubData.length,
      fredData: externalEnrichment.fredData.length,
      enrichedDocChars: enrichedDocumentText.length,
    });

    // Prepare comprehensive analysis payload — all 9 modules receive real extracted data
    const analysisPayload = {
      // Framework configuration
      framework,
      sector: backendSectorMap[framework],
      legacySector: sectorMap[framework],

      // Company data — real data from uploaded documents
      company_data: {
        name: userData?.companyName || extractedCompany.company_name || '',
        description: companyDesc,
        stage: companyStage,
        sector: backendSectorMap[framework],
        framework,
        industry:       extractedCompany.industry_vertical || '',
        business_model: extractedCompany.business_model   || '',
        website:        extractedCompany.website           || '',
        employees:      fin.teamSize,
        processed_data: {
          files:                 processedFilesData,
          urls:                  processedUrls,
          texts:                 processedTexts,
          combined_document_text: enrichedDocumentText,
        },
      },

      // TCA Input — full pitch deck text + real financials
      tcaInput: {
        founderQuestionnaire: userData?.submittedTexts?.[0] || pitchDeckText || enrichedDocumentText.slice(0, 3000) || '',
        uploadedPitchDecks:   pitchDeckText || enrichedDocumentText,
        financials: userData?.submittedTexts?.[1] || (
          fin.currentRevenue || fin.mrr
            ? `Revenue: $${fin.currentRevenue ?? 0}, MRR: $${fin.mrr ?? 0}, ARR: $${fin.arr ?? 0}, Funding raised: $${fin.totalFunding ?? 0}, Burn rate: $${fin.burnRate ?? 0}/month, Runway: ${fin.runwayMonths ?? 0} months`
            : combinedDocumentText.slice(0, 1500)
        ),
        framework,
        processed_files_count: processedFilesData.length,
        processed_urls_count:  processedUrls.length,
        processed_texts_count: processedTexts.length,
      },

      // Risk Input — full document text so backend can assess real risks
      riskInput: {
        uploadedDocuments:    enrichedDocumentText || userData?.uploadedFiles?.map((f: any) => f.name).join(', ') || '',
        complianceChecklists: userData?.submittedTexts?.[2] || pitchDeckText.slice(0, 500) || '',
        framework,
        sector:        backendSectorMap[framework],
        technologies:  (extractedIP.primary_technologies || []).join(', '),
        funding_stage: extractedCompany.development_stage || 'seed',
        team_size:     fin.teamSize,
      },

      // Macro Input — company description + imported URLs
      macroInput: {
        companyDescription: companyDesc,
        newsFeedData: [
          externalEnrichment.hnMentions,
          externalEnrichment.fredData,
          externalEnrichment.urlContent.slice(0, 800),
        ].filter(Boolean).join('\n') || enrichedDocumentText.slice(0, 600),
        trendDatabaseData:  (extractedMarket.main_competitors || []).join(', ') || '',
        sector:   framework,
        industry: extractedCompany.industry_vertical || '',
        stage:    companyStage,
      },

      // Benchmark Input — real extracted financial metrics (no hardcoded numbers)
      benchmarkInput: {
        sector:        sectorMap[framework],
        stage:         companyStage,
        businessModel: extractedCompany.business_model?.toLowerCase() || 'saas',
        metrics: {
          revenueGrowthRate:  fin.revenueGrowthRate,
          customerGrowthRate: null,
          ltvCacRatio:        fin.ltvCacRatio,
          netRetention:       fin.netRetention,
          burnMultiple:       fin.burnMultiple,
          runwayMonths:       fin.runwayMonths,
          currentRevenue:     fin.currentRevenue,
          mrr:                fin.mrr,
          arr:                fin.arr,
          totalFundingRaised: fin.totalFunding,
          burnRate:           fin.burnRate,
        },
        document_context: enrichedDocumentText.slice(0, 2000),
      },

      // Growth Classifier Input — real company + financial data
      growthInput: {
        companyDescription: companyDesc,
        stage:  companyStage,
        sector: backendSectorMap[framework],
        financials: {
          currentRevenue:     fin.currentRevenue,
          mrr:                fin.mrr,
          arr:                fin.arr,
          revenueGrowthRate:  fin.revenueGrowthRate,
          burnRate:           fin.burnRate,
          runwayMonths:       fin.runwayMonths,
          totalFundingRaised: fin.totalFunding,
        },
        market: {
          tam:         extractedMarket.tam  || null,
          sam:         extractedMarket.sam  || null,
          competitors: extractedMarket.main_competitors || [],
        },
        document_context: enrichedDocumentText.slice(0, 2000),
      },

      // Gap Analysis Input — real company context for meaningful gap identification
      gapInput: {
        companyDescription: companyDesc,
        stage:    companyStage,
        sector:   backendSectorMap[framework],
        financials: {
          currentRevenue: fin.currentRevenue,
          runwayMonths:   fin.runwayMonths,
          burnRate:       fin.burnRate,
        },
        teamSize: fin.teamSize,
        market: {
          tam:                  extractedMarket.tam || null,
          competitors:          extractedMarket.main_competitors || [],
          competitiveAdvantages: extractedCompetitive.competitive_advantages
            || extractedMarket.competitive_advantages || [],
        },
        document_context: enrichedDocumentText.slice(0, 2000),
      },

      // Founder Fit Input — real founder/team data extracted from documents
      founderFitInput: {
        founders: (extractedTeam.founders || []).map((f: any) => ({
          name: f.name || '',
          role: f.role || 'Founder',
        })),
        questionnaire:    userData?.submittedTexts?.[0] || pitchDeckText.slice(0, 2000) || enrichedDocumentText.slice(0, 1000) || '',
        stage:    companyStage,
        sector:   backendSectorMap[framework],
        teamSize: fin.teamSize,
        document_context: (pitchDeckText || enrichedDocumentText).slice(0, 2000),
      },

      // Team Assessment Input — real team data extracted from documents
      teamInput: {
        founders: (extractedTeam.founders || []).map((f: any) => ({
          name: f.name || '',
          role: f.role || 'Founder',
        })),
        totalTeamSize:  fin.teamSize,
        leadershipTeam: extractedTeam.leadership_team || [],
        stage:  companyStage,
        sector: backendSectorMap[framework],
        document_context: enrichedDocumentText.slice(0, 2000),
      },

      // Strategic Fit Input — real company + market context
      strategicFitInput: {
        companyDescription: companyDesc,
        sector:        backendSectorMap[framework],
        stage:         companyStage,
        businessModel: extractedCompany.business_model || '',
        market: {
          tam:         extractedMarket.tam || null,
          sam:         extractedMarket.sam || null,
          competitors: extractedMarket.main_competitors || [],
          competitiveAdvantages: extractedCompetitive.competitive_advantages
            || extractedMarket.competitive_advantages || [],
          uniqueValueProposition: extractedCompetitive.unique_value_proposition || '',
        },
        technologies:     extractedIP.primary_technologies || [],
        document_context: enrichedDocumentText.slice(0, 2000),
      },

      // Analysis configuration
      stage:       companyStage,
      companyName: userData?.companyName || extractedCompany.company_name || '',
      ...(userData?.scoreOverrides && { module_score_overrides: userData.scoreOverrides }),
    };

    console.log('Making request to:', `${BACKEND_API_URL}${API_VERSION}/analysis/comprehensive`);
    console.log('Request payload:', JSON.stringify(analysisPayload, null, 2));

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;

    try {
      response = await fetch(`${BACKEND_API_URL}${API_VERSION}/analysis/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Backend analysis failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Backend fetch error:', fetchError);
      throw fetchError;
    }

    const backendData = await response.json();

    // Transform backend response to match frontend schema expectations
    // IMPORTANT: If backend data is incomplete, return sample data to prevent errors
    console.log('Backend response received:', JSON.stringify(backendData).slice(0, 500));

    // Process TCA categories — support both new (tca_data.categories array) and old (scorecard.categories object) API formats
    let tcaCategories: any[] = [];
    if (backendData.tca_data?.categories?.length > 0) {
      // New API format: pre-computed array
      tcaCategories = backendData.tca_data.categories.map((cat: any) => ({
        category: cat.category,
        rawScore: cat.rawScore,
        weight: cat.weight,
        weightedScore: cat.weightedScore,
        flag: cat.flag,
        interpretation: cat.interpretation || `Analysis for ${cat.category}`,
        pestel: 'Technology and market trends favor this category',
        description: cat.description || `Evaluation of ${cat.category} performance`,
        strengths: cat.strengths || `Strong performance in ${cat.category}`,
        concerns: cat.concerns || 'Minor areas for optimization',
        aiRecommendation: cat.aiRecommendation || `Focus on strengthening ${cat.category} capabilities`
      }));
    } else if (backendData.scorecard?.categories) {
      // Old API format: object keyed by category name
      tcaCategories = Object.entries(backendData.scorecard.categories).map(([key, cat]: [string, any]) => {
        const rawScore = cat.raw_score || 7.5;
        const weight = (cat.weight || 0.1) * 100;
        const weightedScore = rawScore * (weight / 100);
        return {
          category: cat.name || key,
          rawScore,
          weight,
          weightedScore,
          interpretation: cat.notes || `Analysis for ${cat.name || key}`,
          flag: (rawScore >= 8 ? 'green' : rawScore >= 6 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
          pestel: 'Technology and market trends favor this category',
          description: `Evaluation of ${cat.name || key} performance`,
          strengths: `Strong performance in ${cat.name || key}`,
          concerns: rawScore < 6 ? `Improvement needed in ${cat.name || key}` : 'Minor areas for optimization',
          aiRecommendation: `Focus on strengthening ${cat.name || key} capabilities`
        };
      });
    }

    // CRITICAL FIX: If no TCA categories from backend, throw error — must not save sample data to DB
    if (tcaCategories.length === 0) {
      throw new Error('No TCA categories returned from backend analysis. The backend may have returned an incomplete response.');
    }

    // Calculate composite score correctly: sum of weighted scores (0-10 scale)
    // If backend returns 0-100 scale, divide by 10
    let compositeScore = 0;
    if (tcaCategories.length > 0) {
      // Calculate from categories: sum of (rawScore * weight/100)
      compositeScore = tcaCategories.reduce((sum, cat) => sum + cat.weightedScore, 0);
    } else if (backendData.tca_data?.compositeScore || backendData.final_tca_score) {
      // Convert from 0-100 to 0-10 scale if needed
      const rawScore = backendData.tca_data?.compositeScore ?? backendData.final_tca_score;
      compositeScore = rawScore > 10 ? rawScore / 10 : rawScore;
    } else {
      compositeScore = 7.5; // Default fallback
    }
    // Ensure score is in valid 0-10 range
    compositeScore = Math.max(0, Math.min(10, compositeScore));
    // If weightedScore values were 0 but rawScores exist, recalculate from rawScore * weight/100
    if (compositeScore === 0 && tcaCategories.some(cat => (cat.rawScore || 0) > 0)) {
      compositeScore = tcaCategories.reduce((sum, cat) =>
        sum + ((cat.rawScore || 0) * ((cat.weight || 0) / 100)), 0);
      compositeScore = Math.max(0, Math.min(10, compositeScore));
    }

    const comprehensiveData: ComprehensiveAnalysisOutput = {
      // TCA Scorecard Data - ALWAYS return valid data (use sample fallback if needed)
      tcaData: {
        categories: tcaCategories,
        compositeScore,
        summary: `TCA Analysis completed with score of ${compositeScore.toFixed(2)}/10. ${backendData.executive_summary?.recommendation || backendData.investment_recommendation || 'Further analysis recommended'}.`
      },

      // Risk Assessment Data — support both new (risk_data) and old (risk_assessment) API formats
      riskData: (() => {
        const rd = backendData.risk_data;
        const ra = backendData.risk_assessment;
        if (rd) {
          return {
            riskSummary: rd.summary || `Overall risk level: ${rd.riskLevel}. ${rd.totalRisks || 0} risk factors evaluated.`,
            riskFlags: (rd.riskFlags || []).map((flag: any) => ({
              domain: flag.category,
              flag: (flag.severity === 'high' ? 'red' : flag.severity === 'medium' ? 'yellow' : 'green') as 'red' | 'yellow' | 'green',
              trigger: flag.description || `Risk identified in ${flag.category}`,
              description: flag.description || `${flag.category} risk requires attention`,
              impact: `Severity: ${flag.severity}`,
              mitigation: flag.mitigation || `Address ${flag.category} concerns through targeted improvements`,
              aiRecommendation: `Implement ${flag.category} risk mitigation strategies`,
              thresholds: `Risk thresholds based on ${flag.category} industry standards`
            }))
          };
        } else if (ra) {
          return {
            riskSummary: `Overall risk level: ${ra.overall_risk_score}/10. ${Object.keys(ra.flags || {}).length} risk domains evaluated.`,
            riskFlags: Object.entries(ra.flags || {}).map(([domain, flag]: [string, any]) => ({
              domain: domain,
              flag: flag.level?.value || 'yellow' as 'red' | 'yellow' | 'green',
              trigger: flag.trigger || `Risk identified in ${domain}`,
              description: flag.impact || `${domain} risk requires attention`,
              impact: flag.severity_score ? `Severity: ${flag.severity_score}/10` : 'Medium impact',
              mitigation: flag.mitigation || `Address ${domain} concerns through targeted improvements`,
              aiRecommendation: flag.ai_recommendation || `Implement ${domain} risk mitigation strategies`,
              thresholds: `Risk thresholds based on ${domain} industry standards`
            }))
          };
        }
        return null;
      })(),

      // Macro Trend Analysis Data
      macroData: backendData.pestel_analysis ? {
        pestelDashboard: {
          political: backendData.pestel_analysis.political || 7,
          economic: backendData.pestel_analysis.economic || 7,
          social: backendData.pestel_analysis.social || 7,
          technological: backendData.pestel_analysis.technological || 8,
          environmental: backendData.pestel_analysis.environmental || 6,
          legal: backendData.pestel_analysis.legal || 7
        },
        trendOverlayScore: ((backendData.pestel_analysis.composite_score || 70) - 70) * 0.001, // Convert to -0.05 to 0.05 range
        summary: `PESTEL analysis shows composite score of ${backendData.pestel_analysis.composite_score || 70}/100`,
        sectorOutlook: `${framework === 'medtech' ? 'Life Sciences' : 'Technology'} sector outlook is positive based on current trends`,
        trendSignals: Object.keys(backendData.pestel_analysis.trend_alignment || {}).slice(0, 5)
      } : null,

      // Benchmark Comparison Data
      benchmarkData: backendData.benchmark_analysis ? {
        benchmarkOverlay: Object.entries(backendData.benchmark_analysis.category_benchmarks || {}).map(([category, bench]: [string, any]) => ({
          category: category,
          score: bench.percentile_rank || 65,
          avg: bench.sector_average || 70,
          percentile: bench.percentile_rank || 65,
          deviation: bench.z_score || 0
        })),
        competitorAnalysis: [
          { metric: 'Growth Rate', startup: 85, competitorA: 75, competitorB: 80 },
          { metric: 'Market Position', startup: 70, competitorA: 85, competitorB: 75 },
          { metric: 'Technology', startup: 90, competitorA: 80, competitorB: 85 }
        ],
        performanceSummary: `Company performs at ${backendData.benchmark_analysis.overall_percentile || 65}th percentile in sector`,
        overlayScore: ((backendData.benchmark_analysis.overall_percentile || 65) - 50) * 0.001 // Convert percentile to overlay score
      } : null,

      // Growth Classification Data
      growthData: backendData.growth_classification ? {
        tier: backendData.growth_classification.tier || 3,
        confidence: backendData.growth_classification.confidence || 0.75,
        analysis: backendData.growth_classification.analysis || 'Growth analysis in progress',
        scenarios: backendData.growth_classification.scenarios || [],
        models: backendData.growth_classification.models || [],
        interpretation: backendData.growth_classification.interpretation || 'Growth potential assessment'
      } : null,

      // Gap Analysis Data
      gapData: backendData.gap_analysis ? {
        heatmap: (backendData.gap_analysis.gaps || []).slice(0, 5).map((gap: any) => ({
          category: gap.category || 'Performance',
          gap: gap.gap_size || 10,
          priority: (gap.priority || 'Medium') as 'High' | 'Medium' | 'Low',
          trend: gap.gap_percentage || 15,
          direction: 'up' as 'up' | 'down' | 'stable'
        })),
        roadmap: (backendData.gap_analysis.priority_areas || []).concat(backendData.gap_analysis.quick_wins || []).slice(0, 6).map((item: string, index: number) => ({
          area: item || 'Improvement Area',
          action: `Address ${item}`,
          type: (index < 2 ? 'Priority Area' : index < 4 ? 'Quick Win' : 'Improvement Roadmap') as 'Priority Area' | 'Quick Win' | 'Improvement Roadmap'
        })),
        interpretation: `${backendData.gap_analysis.total_gaps || 0} gaps identified with ${(backendData.gap_analysis.priority_areas || []).length} priority areas`
      } : null,

      // Founder Fit Analysis Data
      founderFitData: backendData.funder_analysis ? {
        readinessScore: backendData.funder_analysis.funding_readiness_score || 75,
        investorList: (backendData.funder_analysis.investor_matches || []).slice(0, 5).map((match: any) => ({
          name: match.investor_name || 'Strategic Investor',
          thesis: match.sector_focus || 'Technology growth investments',
          match: Math.round(match.fit_score || 75),
          stage: match.stage_match || 'Seed'
        })),
        interpretation: `Funding readiness score: ${backendData.funder_analysis.funding_readiness_score || 75}/100. Recommended round size: $${backendData.funder_analysis.recommended_round_size || 2}M`
      } : null,

      // Team Assessment Data
      teamData: backendData.team_analysis ? {
        members: (backendData.team_analysis.founders || []).map((founder: any, index: number) => ({
          id: `founder_${index}`,
          name: founder.name || `Founder ${index + 1}`,
          role: 'Founder',
          experience: `${founder.experience_score || 80}/100 experience score`,
          skills: founder.track_record || 'Experienced professional',
          avatarId: `avatar_${index}`
        })),
        interpretation: `Team completeness: ${backendData.team_analysis.team_completeness || 80}%. Diversity score: ${backendData.team_analysis.diversity_score || 70}%`
      } : null,

      // Strategic Fit Matrix Data
      strategicFitData: backendData.strategic_fit ? {} : null,

    };

    return comprehensiveData;
  } catch (error) {
    console.error('Failed to run backend analysis:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });

    const errMsg = (error as Error).message || 'Unknown error';
    throw new Error(
      `Backend analysis failed: ${errMsg}. ` +
      `Backend: ${BACKEND_API_URL}. ` +
      `Company: ${(userData as any)?.companyName || 'unknown'}. ` +
      `Timestamp: ${new Date().toISOString()}. ` +
      `Admin action: Check Azure App Service logs for tcairrapiccontainer, ` +
      `verify BACKEND_API_URL env var, and confirm the backend is running.`
    );
  }
}
