'use server';

import { ai } from '@/ai/genkit';
import {
  FinancialAnalysisInputSchema,
  type FinancialAnalysisInput,
  FinancialAnalysisOutputSchema,
  type FinancialAnalysisOutput,
} from './schemas';

export async function generateFinancialAnalysis(
  input: FinancialAnalysisInput,
  modelName: string
): Promise<FinancialAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateFinancialAnalysisPrompt',
    input: { schema: FinancialAnalysisInputSchema },
    output: { schema: FinancialAnalysisOutputSchema },
    model: modelName,
    prompt: `You are an expert financial analyst specializing in startup investment due diligence.
Analyze the provided company financial data and produce a structured Financial Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Revenue Model** (0–10): Quality and predictability of the revenue model (SaaS, marketplace, transactional, etc.)
2. **Unit Economics** (0–10): LTV/CAC ratio, gross margin, contribution margin health
3. **Projections** (0–10): Realism of financial forecasts, burn multiple, scenario planning quality
4. **Funding Requirements** (0–10): Clarity of capital needs, use of funds, runway adequacy

Signal thresholds:
- green  → score ≥ 7.5  (strong financial profile, low concern)
- yellow → score 5.0–7.4 (moderate risk, watch items present)
- red    → score < 5.0   (high risk, material weaknesses)

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence summary, up to five key risks, and up to five actionable recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
