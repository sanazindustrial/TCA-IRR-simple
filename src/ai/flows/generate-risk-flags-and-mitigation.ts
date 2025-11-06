
'use server';

/**
 * @fileOverview Generates risk flags and mitigation strategies for a startup across 14 domains.
 *
 * - generateRiskFlagsAndMitigation - A function that generates risk flags and mitigation strategies.
 * - RiskFlagsAndMitigationInput - The input type for the generateRiskFlagsAndMitigation function.
 * - RiskFlagsAndMitigationOutput - The return type for the generateRiskFlagsAndMitigation function.
 */

import {ai} from '@/ai/genkit';
import {
  RiskFlagsAndMitigationInputSchema,
  type RiskFlagsAndMitigationInput,
  RiskFlagsAndMitigationOutputSchema,
  type RiskFlagsAndMitigationOutput,
} from './schemas';

export async function generateRiskFlagsAndMitigation(
  input: RiskFlagsAndMitigationInput,
  modelName: string
): Promise<RiskFlagsAndMitigationOutput> {
  const prompt = ai.definePrompt({
    name: 'generateRiskFlagsAndMitigationPrompt',
    input: {schema: RiskFlagsAndMitigationInputSchema},
    output: {schema: RiskFlagsAndMitigationOutputSchema},
    model: modelName,
    prompt: `You are an AI risk assessment assistant. Analyze a startup based on the provided documents and framework to identify and flag risks across 14 standard domains.
  
  Framework: {{{framework}}}
  Uploaded Documents: {{{uploadedDocuments}}}
  Compliance Checklists: {{{complianceChecklists}}}
  
  For each of the 14 risk domains below, you must provide:
  - A color flag ('red', 'yellow', or 'green').
  - A description of the trigger for the flag.
  - A more detailed description of the trigger.
  - The potential impact or severity of the risk.
  - Recommended mitigation strategies.
  - An AI-driven recommendation for handling the risk.
  - The thresholds used to determine the flag color.

  THE 14 TCA RISK DOMAINS (with framework-specific weights):
  1. Regulatory / Compliance (General: 5%, MedTech: 15%)
  2. Clinical / Safety / Product Safety (General: 5%, MedTech: 15%)
  3. Liability / Legal Exposure (General: 5%, MedTech: 10%)
  4. Technical Execution Risk (General: 12%, MedTech: 8%)
  5. Market Risk (General: 10%, MedTech: 8%)
  6. Go-To-Market (GTM) Risk (General: 10%, MedTech: 5%)
  7. Financial Risk (General: 10%, MedTech: 10%)
  8. Team / Execution Risk (General: 8%, MedTech: 8%)
  9. IP / Defensibility Risk (General: 8%, MedTech: 10%)
  10. Data Privacy / Governance (General: 7%, MedTech: 5%)
  11. Security / Cyber Risk (General: 7%, MedTech: 5%)
  12. Operational / Supply Chain (General: 5%, MedTech: 6%)
  13. Ethical / Societal Risk (General: 4%, MedTech: 3%)
  14. Adoption / Customer Retention Risk (General: 4%, MedTech: 2%)
  
  SPECIAL RULE: If 'framework' is 'medtech' and any domain is flagged as 'red', you must state that this requires "auto Hold / Admin Review".
  
  After analyzing all domains, provide a high-level summary of the top risks identified.
  `,
  });

  const {output} = await prompt(input);
  return output!;
}
