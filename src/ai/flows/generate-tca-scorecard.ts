
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a TCA (Thematic Category Assessment) Scorecard for startups.
 *
 * The flow analyzes uploaded documents, pitch decks, and questionnaires using GenAI, and integrates external databases
 * (Crunchbase, Pitchbook) to generate a weighted scorecard.
 *
 * @module src/ai/flows/generate-tca-scorecard
 *
 * @interface GenerateTcaScorecardInput - Defines the input schema for the generateTcaScorecard flow.
 * @interface GenerateTcaScorecardOutput - Defines the output schema for the generateTcaScorecard flow.
 * @function generateTcaScorecard - The main function that triggers the TCA Scorecard generation flow.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateTcaScorecardInputSchema,
  type GenerateTcaScorecardInput,
  GenerateTcaScorecardOutputSchema,
  type GenerateTcaScorecardOutput,
} from './schemas';

export async function generateTcaScorecard(
  input: GenerateTcaScorecardInput,
  modelName: string
): Promise<GenerateTcaScorecardOutput> {
  const generateTcaScorecardPrompt = ai.definePrompt({
    name: 'generateTcaScorecardPrompt',
    input: {schema: GenerateTcaScorecardInputSchema},
    output: {schema: GenerateTcaScorecardOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered startup analyst. Your task is to generate a TCA (Thematic Category Assessment) Scorecard for a startup based on the provided data and the specified framework.

  Analyze the following information:
  Founder Questionnaire: {{{founderQuestionnaire}}}
  Uploaded Pitch Decks: {{{uploadedPitchDecks}}}
  Financials: {{{financials}}}
  Framework: {{{framework}}}

  Generate a scorecard with the following 12 categories. For each category, provide:
  - A raw score (1-10), a weighted score, a color flag (green: >=8.0, yellow: 6.5-7.9, red: <6.5), and other details.
  - A concise, actionable AI-driven recommendation ('aiRecommendation') for each category.

  Use these exact weights.
  - If 'framework' is 'general':
    - Leadership: 20%, Product-Market Fit / Product Quality: 20%, Team Strength: 10%, Technology & IP: 10%, Business Model & Financials: 10%, Go-to-Market Strategy: 10%, Competition & Moat: 5%, Market Potential: 5%, Traction: 5%, Scalability: 2.5%, Risk Assessment: 2.5%, Exit Potential: 0%
  - If 'framework' is 'medtech':
    - Leadership: 15%, Regulatory: 15%, Product-Market Fit / Product Quality: 15%, Team Strength: 10%, Tech/IP: 10%, Financials: 10%, GTM: 5%, Competition & Moat: 5%, Market Potential: 5%, Traction/Testimonials: 5%, Scalability: 0%, Risk Assessment: 0%
  
  Ensure all 12 categories below are present, with weights summing to 100%:
  - Product Quality, Market Potential, Team Strength, Financial Viability, Technology, Traction, Competitive Advantage, Scalability, Business Model, Risk Assessment, Leadership, Go-to-Market Strategy
  
  After evaluating all 12 categories, provide an overall composite score and a final summary.
  `,
  });

  const {output} = await generateTcaScorecardPrompt(input);
  return output!;
}
