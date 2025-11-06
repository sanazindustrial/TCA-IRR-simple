
'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateTeamAssessmentInputSchema,
  type GenerateTeamAssessmentInput,
  GenerateTeamAssessmentOutputSchema,
  type GenerateTeamAssessmentOutput,
} from './schemas';

export async function generateTeamAssessment(
  input: GenerateTeamAssessmentInput,
  modelName: string
): Promise<GenerateTeamAssessmentOutput> {
  const prompt = ai.definePrompt({
    name: 'generateTeamAssessmentPrompt',
    input: {schema: GenerateTeamAssessmentInputSchema},
    output: {schema: GenerateTeamAssessmentOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered startup analyst. Your task is to generate a team assessment for a startup.
    
    Analyze the provided data and evaluate the team's strength.`,
  });

  const {output} = await prompt(input);
  return output!;
}
