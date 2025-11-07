'use server';

import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

// Try different backend URLs based on environment
const BACKEND_API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000'  // Development (use localhost for consistency)
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // Production fallback

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

export async function runAnalysis(
  framework: 'general' | 'medtech',
  userData?: {
    uploadedFiles?: any[];
    importedUrls?: string[];
    submittedTexts?: string[];
    companyName?: string;
    companyDescription?: string;
  }
): Promise<ComprehensiveAnalysisOutput> {
  // 1. Input Validation
  if (!['general', 'medtech'].includes(framework)) {
    throw new Error(`Invalid framework: ${framework}`);
  }

  try {
    // Test basic connectivity first (non-blocking)
    console.log('Testing backend connectivity...');
    try {
      const healthCheck = await fetch(`${BACKEND_API_URL}/health`, {
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

    // Extract financial data from processed files
    const extractedFinancials = (processedFiles as any[]).reduce((acc: any, file: any) => {
      const financialData = (typeof file === 'object' && file !== null) ? (file.extracted_data?.financial_data || {}) : {};
      return {
        revenue: acc.revenue + (financialData.revenue || 0),
        burn_rate: acc.burn_rate + (financialData.burn_rate || 0),
        runway_months: Math.max(acc.runway_months, financialData.runway_months || 0)
      };
    }, { revenue: 0, burn_rate: 0, runway_months: 0 });

    // Prepare comprehensive analysis payload with all original configurations preserved
    const analysisPayload = {
      // Framework configuration
      framework,
      sector: backendSectorMap[framework],
      legacySector: sectorMap[framework], // Preserve original mapping

      // Company data structure - Use real user data if provided
      company_data: {
        name: userData?.companyName || 'Sample Company',
        description: userData?.companyDescription ||
          (processedTexts[0] ? (typeof processedTexts[0] === 'string' ? processedTexts[0] : String(processedTexts[0])) : '').slice(0, 200) ||
          'AI-powered startup using machine learning for optimization',
        stage: 'seed',
        sector: backendSectorMap[framework],
        framework: framework,
        processed_data: {
          files: processedFiles,
          urls: processedUrls,
          texts: processedTexts,
          extracted_financials: extractedFinancials
        }
      },

      // TCA Input structure - Use real user data if provided
      tcaInput: {
        founderQuestionnaire: userData?.submittedTexts?.[0] ||
          (processedTexts[0] ? (typeof processedTexts[0] === 'string' ? processedTexts[0] : String(processedTexts[0])) : '') ||
          'Our team has extensive experience in AI and SaaS. We are solving a major pain point in the market.',
        uploadedPitchDecks: userData?.uploadedFiles?.map(f => f.name).join(', ') || processedFiles.map((f: any) => f.name).join(', ') || 'Pitch deck contains market analysis, product roadmap, and financial projections.',
        financials: userData?.submittedTexts?.[1] || `Revenue: $${extractedFinancials.revenue}, Burn: $${extractedFinancials.burn_rate}/month, Runway: ${extractedFinancials.runway_months} months` || 'We have secured $500k in pre-seed funding and have a 12-month runway.',
        framework: framework,
        processed_files_count: processedFiles.length,
        processed_urls_count: processedUrls.length,
        processed_texts_count: processedTexts.length
      },      // Risk Input structure - Use real user data if provided
      riskInput: {
        uploadedDocuments: userData?.uploadedFiles?.map(f => f.name).join(', ') || 'Business plan, financial statements, and IP registrations.',
        complianceChecklists: userData?.submittedTexts?.[2] || 'GDPR, CCPA, and industry-specific regulations checklist reviewed.',
        framework: framework,
      },

      // Macro Input structure - Use real user data if provided
      macroInput: {
        companyDescription: userData?.companyDescription || 'A B2B SaaS company using AI to optimize supply chains.',
        newsFeedData: userData?.importedUrls?.join(', ') || 'Recent articles on supply chain disruptions and the rise of AI in logistics.',
        trendDatabaseData: 'Data from World Bank and IMF on global trade and technology adoption.',
        sector: framework,
      },

      // Benchmark Input structure (preserved from original)
      benchmarkInput: {
        sector: sectorMap[framework],
        stage: 'seed',
        businessModel: 'saas',
        metrics: {
          revenueGrowthRate: 1.2,
          customerGrowthRate: 0.15,
          ltvCacRatio: 3.5,
          netRetention: 1.1,
          burnMultiple: 1.2,
          runwayMonths: 18,
        },
      },

      // Additional input structures (preserved from original)
      growthInput: {},
      gapInput: {},
      founderFitInput: {},
      teamInput: {},
      strategicFitInput: {},

      // Analysis configuration
      stage: 'seed',
      companyName: 'Sample Company'
    };

    console.log('Making request to:', `${BACKEND_API_URL}/api/analysis/comprehensive`);
    console.log('Request payload:', JSON.stringify(analysisPayload, null, 2));

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;

    try {
      response = await fetch(`${BACKEND_API_URL}/api/analysis/comprehensive`, {
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
      if ((fetchError as Error).name === 'AbortError') {
        throw new Error('Backend request timed out after 30 seconds. Please check if the backend server is running and accessible.');
      }
      throw fetchError;
    }

    const backendData = await response.json();    // Transform backend response to match frontend schema expectations
    const comprehensiveData: ComprehensiveAnalysisOutput = {
      // TCA Scorecard Data
      tcaData: backendData.scorecard ? {
        categories: Object.entries(backendData.scorecard.categories || {}).map(([key, cat]: [string, any]) => ({
          category: cat.name || key,
          rawScore: cat.raw_score || 7.5,
          weight: (cat.weight || 0.1) * 100, // Convert to percentage
          weightedScore: cat.weighted_score || 7.5,
          interpretation: cat.notes || `Analysis for ${cat.name || key}`,
          flag: (cat.raw_score >= 8 ? 'green' : cat.raw_score >= 6 ? 'yellow' : 'red') as 'green' | 'yellow' | 'red',
          pestel: 'Technology and market trends favor this category',
          description: `Evaluation of ${cat.name || key} performance`,
          strengths: `Strong performance in ${cat.name || key}`,
          concerns: cat.raw_score < 6 ? `Improvement needed in ${cat.name || key}` : 'Minor areas for optimization',
          aiRecommendation: `Focus on strengthening ${cat.name || key} capabilities`
        })),
        compositeScore: backendData.final_tca_score || 75,
        summary: `TCA Analysis completed with score of ${backendData.final_tca_score || 75}/100. ${backendData.investment_recommendation || 'Further analysis recommended'}.`
      } : null,

      // Risk Assessment Data
      riskData: backendData.risk_assessment ? {
        riskSummary: `Overall risk level: ${backendData.risk_assessment.overall_risk_score}/10. ${Object.keys(backendData.risk_assessment.flags || {}).length} risk domains evaluated.`,
        riskFlags: Object.entries(backendData.risk_assessment.flags || {}).map(([domain, flag]: [string, any]) => ({
          domain: domain,
          flag: flag.level?.value || 'yellow' as 'red' | 'yellow' | 'green',
          trigger: flag.trigger || `Risk identified in ${domain}`,
          description: flag.impact || `${domain} risk requires attention`,
          impact: flag.severity_score ? `Severity: ${flag.severity_score}/10` : 'Medium impact',
          mitigation: flag.mitigation || `Address ${domain} concerns through targeted improvements`,
          aiRecommendation: flag.ai_recommendation || `Implement ${domain} risk mitigation strategies`,
          thresholds: `Risk thresholds based on ${domain} industry standards`
        }))
      } : null,

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
      growthData: backendData.growth_classification ? {} : null,

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
      strategicFitData: backendData.strategic_fit ? {} : null
    };

    return comprehensiveData;
  } catch (error) {
    console.error('Failed to run backend analysis:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again, or upgrade your plan for higher limits.');
      }
      throw new Error(`Backend analysis failed: ${error.message}`);
    } else {
      throw new Error(`Backend analysis failed: ${JSON.stringify(error)}`);
    }
  }
}
