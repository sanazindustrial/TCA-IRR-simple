'use server';

import { ai } from '@/ai/genkit';
import {
  MarketingAnalysisInputSchema,
  type MarketingAnalysisInput,
  MarketingAnalysisOutputSchema,
  type MarketingAnalysisOutput,
} from './schemas';

export async function generateMarketingAnalysis(
  input: MarketingAnalysisInput,
  modelName: string
): Promise<MarketingAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateMarketingAnalysisPrompt',
    input: { schema: MarketingAnalysisInputSchema },
    output: { schema: MarketingAnalysisOutputSchema },
    model: modelName,
    prompt: `You are a marketing strategist and go-to-market analyst specializing in startup commercialization readiness.
Analyze the provided company marketing, GTM, and brand data to produce a structured Marketing Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Positioning** (0–10): Clarity of value proposition, differentiation from competitors, messaging consistency
2. **Digital Presence** (0–10): Website quality, SEO/content strategy, social media traction, online visibility
3. **Spend Efficiency** (0–10): Customer acquisition cost trends, marketing ROI, channel mix optimization
4. **GTM Execution** (0–10): Sales funnel health, channel partnerships, launch readiness, distribution strategy

Signal thresholds:
- green  → score ≥ 7.5  (strong marketing foundation)
- yellow → score 5.0–7.4 (improvement areas present)
- red    → score < 5.0   (significant GTM concerns)

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence summary, up to five marketing risks, and up to five actionable recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
