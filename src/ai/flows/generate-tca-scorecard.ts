
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

  Generate a scorecard with this exact 12-factor model. For each category, provide:
  - rawScore (1-10)
  - weight (percentage)
  - weightedScore = rawScore * (weight / 100)
  - flag (green/yellow/red)
  - confidence (0-1)
  - evidence (specific proof from the provided documents/data)
  - benchmarkPercentile (0-100, estimated if exact benchmark not available)
  - concise interpretation and actionable aiRecommendation

  Use this exact 12-factor list and weights (must sum to 100):
  1) Market Opportunity (15)
  2) Problem-Solution Fit (10)
  3) Product / Technology (10)
  4) Business Model (9)
  5) Competitive Advantage (8)
  6) Team & Founder Fit (13)
  7) Financial Health & Projection (10)
  8) Go-To-Market Strategy (8)
  9) Traction & Validation (10)
  10) Risk & Compliance (7)
  11) Strategic & Macro Alignment (5)
  12) Growth Potential / Scalability (5)

  Scoring band logic:
  - 9-10: Exceptional / investment-ready
  - 7-8: Strong but needs refinement
  - 5-6: Moderate / concerns exist
  - 3-4: Weak / high risk
  - 1-2: Critical failure / insufficient evidence

  Flag mapping by raw score:
  - green: rawScore >= 8.5
  - yellow: rawScore >= 7 and < 8.5
  - red: rawScore < 7

  Quality requirements:
  - Do not invent evidence; tie each score to concrete provided signals.
  - Avoid generic midpoint scoring unless evidence truly supports a mid-range score.
  - Ensure weightedScore values are mathematically correct and compositeScore = sum(weightedScore).
  
  After evaluating all 12 categories, provide compositeScore (0-10), overallScore (same value), and a final summary.
  `,
  });

  const {output} = await generateTcaScorecardPrompt(input);
  return output!;
}
