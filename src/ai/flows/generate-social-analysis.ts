'use server';

import { ai } from '@/ai/genkit';
import {
  SocialAnalysisInputSchema,
  type SocialAnalysisInput,
  SocialAnalysisOutputSchema,
  type SocialAnalysisOutput,
} from './schemas';

export async function generateSocialAnalysis(
  input: SocialAnalysisInput,
  modelName: string
): Promise<SocialAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'generateSocialAnalysisPrompt',
    input: { schema: SocialAnalysisInputSchema },
    output: { schema: SocialAnalysisOutputSchema },
    model: modelName,
    prompt: `You are an ESG and social impact analyst evaluating startups for investment readiness.
Analyze the provided company data and produce a structured Social Analysis report.

Input data:
{{{companyData}}}

Framework: {{{framework}}}

Evaluate across four key sub-dimensions:
1. **Social Impact** (0–10): Measurable positive contribution to society, UN SDG alignment, community benefit
2. **Demographic Fit** (0–10): Product-market fit with target demographics, inclusivity, accessibility
3. **Cultural Adoption** (0–10): Likelihood of adoption across cultural and geographic boundaries
4. **Stakeholder Trust** (0–10): Brand reputation, employee satisfaction signals, community goodwill, media sentiment

Signal thresholds:
- green  → score ≥ 7.5  (strong social profile)
- yellow → score 5.0–7.4 (moderate concerns)
- red    → score < 5.0   (material social risks)

Return a composite score (0–10), signal colour, all four sub-scores, a 3–5 sentence summary, up to five social risks, and up to five recommendations.`,
  });

  const { output } = await prompt(input);
  return output!;
}
