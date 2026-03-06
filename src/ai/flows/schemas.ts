
import {z} from 'genkit';

// TCA Scorecard Schemas
export const GenerateTcaScorecardInputSchema = z.object({
  founderQuestionnaire: z.string().describe('The founder questionnaire data.'),
  uploadedPitchDecks: z.string().describe('The uploaded pitch decks data.'),
  financials: z.string().describe('The financial data.'),
  framework: z
    .enum(['general', 'medtech'])
    .describe('The evaluation framework to use.'),
});
export type GenerateTcaScorecardInput = z.infer<
  typeof GenerateTcaScorecardInputSchema
>;

const TcaScorecardCategorySchema = z.object({
  category: z.string().describe('The name of the category.'),
  rawScore: z.number().describe('The raw score for the category (1-10).'),
  weight: z
    .number()
    .describe('The weight applied to the category as a percentage (e.g., 30 for 30%).'),
  weightedScore: z.number().describe('The weighted score for the category.'),
  interpretation: z
    .string()
    .describe('An interpretation of the category score.'),
  flag: z
    .enum(['green', 'yellow', 'red'])
    .describe('A color flag (green, yellow, red) based on the raw score.'),
  pestel: z
    .string()
    .describe('Relevant PESTEL factors influencing this category and the rationale.'),
  description: z
    .string()
    .describe('A brief description of what this category evaluates.'),
  strengths: z
    .string()
    .describe('Key strengths identified for this category.'),
  concerns: z
    .string()
    .describe('Key concerns or weaknesses identified for this category.'),
  aiRecommendation: z.string().describe("A concise, actionable recommendation from the AI for this specific category."),
});

export const GenerateTcaScorecardOutputSchema = z.object({
  categories: z
    .array(TcaScorecardCategorySchema)
    .describe('The list of TCA categories with scores and interpretations.'),
  compositeScore: z.number().describe('The overall composite TCA score.'),
  summary: z
    .string()
    .describe('A summary of the startup based on the TCA scorecard.'),
});
export type GenerateTcaScorecardOutput = z.infer<
  typeof GenerateTcaScorecardOutputSchema
>;

// Risk Flags Schemas
export const RiskFlagsAndMitigationInputSchema = z.object({
  uploadedDocuments: z.string().describe('The uploaded documents to scan.'),
  complianceChecklists: z
    .string()
    .describe('The compliance checklists to use.'),
  framework: z
    .enum(['general', 'medtech'])
    .describe('The risk framework to use (general or medtech).'),
});
export type RiskFlagsAndMitigationInput = z.infer<
  typeof RiskFlagsAndMitigationInputSchema
>;

export const RiskFlagsAndMitigationOutputSchema = z.object({
  riskSummary: z
    .string()
    .describe('A high-level summary of the top risks identified.'),
  riskFlags: z
    .array(
      z.object({
        domain: z.string().describe('The risk domain.'),
        flag: z
          .enum(['red', 'yellow', 'green'])
          .describe('The risk flag (red, yellow, or green).'),
        trigger: z
          .string()
          .describe('Description of what caused the risk flag.'),
        description: z
          .string()
          .describe('A more detailed description of the trigger.'),
        impact: z.string().describe('The severity of the risk.'),
        mitigation: z.string().describe('Potential fixes for the risk.'),
        aiRecommendation: z
          .string()
          .describe('AI-driven advice for the risk.'),
        thresholds: z
          .string()
          .describe(
            'The thresholds or criteria used to determine the flag color.'
          ),
      })
    )
    .describe('The risk flags and mitigation strategies for each domain.'),
});
export type RiskFlagsAndMitigationOutput = z.infer<
  typeof RiskFlagsAndMitigationOutputSchema
>;

// Macro Trend Schemas
export const AssessMacroTrendAlignmentInputSchema = z.object({
  companyDescription: z
    .string()
    .describe('A description of the company to assess.'),
  newsFeedData: z
    .string()
    .describe('News feed data related to the company and its industry.'),
  trendDatabaseData: z
    .string()
    .describe(
      'Data from trend databases like World Bank, IMF, and OECD, related to PESTEL factors.'
    ),
  sector: z.enum(['general', 'medtech']).describe('The company\'s sector, used to determine weighting.')
});
export type AssessMacroTrendAlignmentInput = z.infer<
  typeof AssessMacroTrendAlignmentInputSchema
>;

const PESTELSchema = z.object({
  political: z
    .number().min(1).max(10)
    .describe('Alignment score (1-10) with political trends.'),
  economic: z
    .number().min(1).max(10)
    .describe('Alignment score (1-10) with economic trends.'),
  social: z
    .number().min(1).max(10)
    .describe('Alignment score (1-10) with social trends.'),
  technological: z
    .number().min(1).max(10)
    .describe('Alignment score (1-10) with technological trends.'),
  environmental: z
    .number().min(1).max(10)
    .describe('Alignment score (1-10) with environmental trends.'),
  legal: z.number().min(1).max(10).describe('Alignment score (1-10) with legal trends.'),
});

export const AssessMacroTrendAlignmentOutputSchema = z.object({
  pestelDashboard: PESTELSchema.describe(
    'PESTEL dashboard with alignment scores.'
  ),
  trendOverlayScore: z
    .number()
    .min(-0.05)
    .max(0.05)
    .describe(
      'Overall score indicating alignment with macro trends, from -0.05 to 0.05.'
    ),
  summary: z
    .string()
    .describe('A summary of the alignment with macro trends.'),
  sectorOutlook: z
    .string()
    .describe(
      'The outlook for the specific sector the startup is in, considering the PESTEL analysis.'
    ),
  trendSignals: z
    .array(z.string())
    .describe('Specific macro trend signals identified from the data.'),
});
export type AssessMacroTrendAlignmentOutput = z.infer<
  typeof AssessMacroTrendAlignmentOutputSchema
>;

// Benchmark Comparison Schemas
export const GenerateBenchmarkComparisonInputSchema = z.object({
  sector: z.enum(['tech', 'med_life']).describe('The startup\'s sector.'),
  stage: z
    .enum(['pre_seed', 'seed', 'series_a', 'series_b'])
    .describe('The startup\'s funding stage.'),
  businessModel: z
    .enum(['saas', 'marketplace', 'hardware', 'biotech', 'consumer'])
    .describe('The startup\'s business model.'),
  metrics: z.object({
    revenueGrowthRate: z.number().describe('Annual revenue growth rate (e.g., 1.5 for 150%).'),
    customerGrowthRate: z.number().describe('Monthly customer growth rate (e.g., 0.1 for 10%).'),
    ltvCacRatio: z.number().optional().describe('LTV to CAC ratio.'),
    netRetention: z.number().optional().describe('Net Revenue Retention (e.g., 1.1 for 110%).'),
    burnMultiple: z.number().describe('Burn Multiple (Net Burn / Net New ARR).'),
    runwayMonths: z.number().describe('Number of months of runway remaining.'),
    clinicalStageProgress: z.string().optional().describe('Current clinical trial stage for MedTech.'),
  }),
});
export type GenerateBenchmarkComparisonInput = z.infer<
  typeof GenerateBenchmarkComparisonInputSchema
>;

export const GenerateBenchmarkComparisonOutputSchema = z.object({
  benchmarkOverlay: z.array(
    z.object({
      category: z.string(),
      score: z.number(),
      avg: z.number(),
      percentile: z.number(),
      deviation: z.number(),
    })
  ).describe('A benchmark overlay comparing the startup to sector averages.'),
  competitorAnalysis: z.array(
    z.object({
      metric: z.string(),
      startup: z.number(),
      competitorA: z.number(),
      competitorB: z.number(),
    })
  ).describe('A spider-chart compatible analysis against two competitors.'),
  performanceSummary: z.string().describe('A summary of how the startup performs against its peers.'),
  overlayScore: z.number().min(-0.05).max(0.05).describe('The final overlay score adjustment (from -5% to +5%).'),
});

export type GenerateBenchmarkComparisonOutput = z.infer<
  typeof GenerateBenchmarkComparisonOutputSchema
>;

// Growth Classifier Schemas
export const GenerateGrowthClassifierInputSchema = z.object({});
export type GenerateGrowthClassifierInput = z.infer<typeof GenerateGrowthClassifierInputSchema>;
export const GenerateGrowthClassifierOutputSchema = z.object({}).optional();
export type GenerateGrowthClassifierOutput = z.infer<typeof GenerateGrowthClassifierOutputSchema>;

// Gap Analysis Schemas
export const GenerateGapAnalysisInputSchema = z.object({}).describe('Input for Gap Analysis.');
export type GenerateGapAnalysisInput = z.infer<typeof GenerateGapAnalysisInputSchema>;

export const GenerateGapAnalysisOutputSchema = z.object({
  heatmap: z.array(z.object({
    category: z.string(),
    gap: z.number(),
    priority: z.enum(['High', 'Medium', 'Low']),
    trend: z.number(),
    direction: z.enum(['up', 'down', 'stable']),
  })),
  roadmap: z.array(z.object({
    area: z.string(),
    action: z.string(),
    type: z.enum(['Priority Area', 'Quick Win', 'Improvement Roadmap']),
  })),
  interpretation: z.string(),
}).describe('Output for Gap Analysis.');
export type GenerateGapAnalysisOutput = z.infer<typeof GenerateGapAnalysisOutputSchema>;

// Funder Fit Schemas
export const GenerateFounderFitAnalysisInputSchema = z.object({});
export type GenerateFounderFitAnalysisInput = z.infer<typeof GenerateFounderFitAnalysisInputSchema>;
export const GenerateFounderFitAnalysisOutputSchema = z.object({
  readinessScore: z.number().describe("Funding readiness score from 0 to 100."),
  investorList: z.array(z.object({
    name: z.string().describe("Name of the investment firm."),
    thesis: z.string().describe("Investment thesis of the firm."),
    match: z.number().describe("Match percentage (0-100)."),
    stage: z.string().describe("Typical investment stage (e.g., Seed, Series A)."),
  })),
  interpretation: z.string().describe("AI-driven analysis of funding readiness and investor fit."),
}).describe('Output for Funder Fit Analysis.');
export type GenerateFounderFitAnalysisOutput = z.infer<typeof GenerateFounderFitAnalysisOutputSchema>;

// Team Assessment Schemas
export const GenerateTeamAssessmentInputSchema = z.object({
  teamInfo: z.string().describe("JSON string of team member information, including roles, experience, and skills."),
  companyDescription: z.string().describe("Description of the company and its goals."),
}).describe('Input for Team Assessment.');
export type GenerateTeamAssessmentInput = z.infer<typeof GenerateTeamAssessmentInputSchema>;

export const GenerateTeamAssessmentOutputSchema = z.object({
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    experience: z.string(),
    skills: z.string(),
    avatarId: z.string(),
  })),
  interpretation: z.string().describe("AI-driven analysis of the team's strengths, weaknesses, and overall fit."),
}).describe('Output for Team Assessment.');
export type GenerateTeamAssessmentOutput = z.infer<typeof GenerateTeamAssessmentOutputSchema>;

// Strategic Fit Schemas
export const GenerateStrategicFitMatrixInputSchema = z.object({});
export type GenerateStrategicFitMatrixInput = z.infer<typeof GenerateStrategicFitMatrixInputSchema>;
export const GenerateStrategicFitMatrixOutputSchema = z.object({}).optional();
export type GenerateStrategicFitMatrixOutput = z.infer<typeof GenerateStrategicFitMatrixOutputSchema>;


// Comprehensive Schemas
export const ComprehensiveAnalysisInputSchema = z.object({
  tcaInput: GenerateTcaScorecardInputSchema,
  riskInput: RiskFlagsAndMitigationInputSchema,
  macroInput: AssessMacroTrendAlignmentInputSchema,
  benchmarkInput: GenerateBenchmarkComparisonInputSchema,
  growthInput: GenerateGrowthClassifierInputSchema.optional(),
  gapInput: GenerateGapAnalysisInputSchema.optional(),
  founderFitInput: GenerateFounderFitAnalysisInputSchema.optional(),
  teamInput: GenerateTeamAssessmentInputSchema.optional(),
  strategicFitInput: GenerateStrategicFitMatrixInputSchema.optional(),
});

export type ComprehensiveAnalysisInput = z.infer<
  typeof ComprehensiveAnalysisInputSchema
>;

export const ComprehensiveAnalysisOutputSchema = z.object({
  tcaData: GenerateTcaScorecardOutputSchema.nullable(),
  riskData: RiskFlagsAndMitigationOutputSchema.nullable(),
  macroData: AssessMacroTrendAlignmentOutputSchema.nullable(),
  benchmarkData: GenerateBenchmarkComparisonOutputSchema.nullable(),
  growthData: GenerateGrowthClassifierOutputSchema.nullable(),
  gapData: GenerateGapAnalysisOutputSchema.nullable(),
  founderFitData: GenerateFounderFitAnalysisOutputSchema.nullable(),
  teamData: GenerateTeamAssessmentOutputSchema.nullable(),
  strategicFitData: GenerateStrategicFitMatrixOutputSchema.nullable(),
});

export type ComprehensiveAnalysisOutput = z.infer<
  typeof ComprehensiveAnalysisOutputSchema
>;
