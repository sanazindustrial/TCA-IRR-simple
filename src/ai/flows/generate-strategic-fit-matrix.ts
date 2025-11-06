
'use server';

import {ai} from '@/ai/genkit';
import {
  GenerateStrategicFitMatrixInputSchema,
  type GenerateStrategicFitMatrixInput,
  GenerateStrategicFitMatrixOutputSchema,
  type GenerateStrategicFitMatrixOutput,
} from './schemas';

export async function generateStrategicFitMatrix(
  input: GenerateStrategicFitMatrixInput,
  modelName: string
): Promise<GenerateStrategicFitMatrixOutput> {
  const prompt = ai.definePrompt({
    name: 'generateStrategicFitMatrixPrompt',
    input: {schema: GenerateStrategicFitMatrixInputSchema},
    output: {schema: GenerateStrategicFitMatrixOutputSchema},
    model: modelName,
    prompt: `You are an AI-powered startup analyst. Your task is to generate a strategic fit matrix for a startup.
    
    Analyze the provided data and generate a strategic fit score.`,
  });

  const {output} = await prompt(input);
  return output!;
}
