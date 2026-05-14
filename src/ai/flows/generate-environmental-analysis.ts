'use server';

import { ai } from '@/ai/genkit';
import {
  EnvironmentalAnalysisInputSchema,
  type EnvironmentalAnalysisInput,
  EnvironmentalAnalysisOutputSchema,
  type EnvironmentalAnalysisOutput,
} from './schemas';

export async function generateEnvironmentalAnalysis(
  input: EnvironmentalAnalysisInput,
  modelName: string
): Promise<EnvironmentalAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateEnvironmentalAnalysisPrompt',
    input: { schema: EnvironmentalAnalysisInputSchema },
    output: { schema: EnvironmentalAnalysisOutputSchema },
    model: modelName,
    prompt: `You are an environmental, sustainability, and ESG analyst evaluating startups for investment readiness.
Analyze the provided company ESG, certifications, and environmental footprint data to produce a structured Environmental Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Impact** (0–10): Direct environmental footprint — carbon emissions, waste, water usage, land use
2. **Climate Risk** (0–10): Exposure to physical climate risks and transition risks (e.g., carbon pricing, stranded assets)
3. **Certification** (0–10): Environmental certifications held (ISO 14001, B-Corp, GRI, TCFD reporting, etc.)
4. **ESG Alignment** (0–10): Integration of ESG principles into operations, governance, and strategic roadmap

Signal thresholds:
- green  → score ≥ 7.5  (strong environmental profile)
- yellow → score 5.0–7.4 (material gaps to address)
- red    → score < 5.0   (significant environmental liabilities)

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence summary, up to five environmental risks, and up to five recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
