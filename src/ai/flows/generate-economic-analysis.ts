'use server';

import { ai } from '@/ai/genkit';
import {
  EconomicAnalysisInputSchema,
  type EconomicAnalysisInput,
  EconomicAnalysisOutputSchema,
  type EconomicAnalysisOutput,
} from './schemas';

export async function generateEconomicAnalysis(
  input: EconomicAnalysisInput,
  modelName: string
): Promise<EconomicAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateEconomicAnalysisPrompt',
    input: { schema: EconomicAnalysisInputSchema },
    output: { schema: EconomicAnalysisOutputSchema },
    model: modelName,
    prompt: `You are a macroeconomic and industry analyst specializing in startup market viability assessment.
Analyze the provided company and sector data and produce a structured Economic Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Industry Structure** (0–10): Porter's Five Forces — competitive intensity, barriers to entry, supplier/buyer power
2. **Pricing Power** (0–10): Ability to command premium pricing, price elasticity, value proposition strength
3. **Macro Indicators** (0–10): Alignment with GDP growth, inflation trends, interest rate environment, sector tailwinds
4. **Cycle Resilience** (0–10): Business model durability through economic downturns; defensiveness vs. cyclicality

Signal thresholds:
- green  → score ≥ 7.5
- yellow → score 5.0–7.4
- red    → score < 5.0

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence summary, up to five economic risks, and up to five recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
