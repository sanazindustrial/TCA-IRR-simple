
'use server';

import {
  generateComprehensiveAnalysis,
} from '@/ai/flows/generate-comprehensive-analysis';
import type { ComprehensiveAnalysisOutput } from '@/ai/flows/schemas';

const sectorMap = {
  general: 'tech',
  medtech: 'med_life'
} as const;

export async function runAnalysis(
  framework: 'general' | 'medtech'
): Promise<ComprehensiveAnalysisOutput> {
  // 1. Input Validation
  if (!['general', 'medtech'].includes(framework)) {
    throw new Error(`Invalid framework: ${framework}`);
  }
  
  try {
    const comprehensiveData = await generateComprehensiveAnalysis({
      tcaInput: {
        founderQuestionnaire:
          'Our team has extensive experience in AI and SaaS. We are solving a major pain point in the market.',
        uploadedPitchDecks:
          'Pitch deck contains market analysis, product roadmap, and financial projections.',
        financials:
          'We have secured $500k in pre-seed funding and have a 12-month runway.',
        framework: framework,
      },
      riskInput: {
        uploadedDocuments:
          'Business plan, financial statements, and IP registrations.',
        complianceChecklists:
          'GDPR, CCPA, and industry-specific regulations checklist reviewed.',
        framework: framework,
      },
      macroInput: {
        companyDescription:
          'A B2B SaaS company using AI to optimize supply chains.',
        newsFeedData:
          'Recent articles on supply chain disruptions and the rise of AI in logistics.',
        trendDatabaseData:
          'Data from World Bank and IMF on global trade and technology adoption.',
        sector: framework,
      },
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
      growthInput: {},
      gapInput: {},
      founderFitInput: {},
      teamInput: {},
      strategicFitInput: {},
    });
    return comprehensiveData;
  } catch (error) {
    console.error('Failed to run analysis:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        timestamp: new Date().toISOString(),
    });

    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again, or upgrade your plan for higher limits.');
      }
      throw new Error(`Analysis failed: ${error.message}`);
    } else {
      throw new Error(`Analysis failed: ${JSON.stringify(error)}`);
    }
  }
}
