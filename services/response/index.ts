import { getResponse as anthropicResponse } from './anthropic';
import { getResponse as googleResponse } from './google';
import { getResponse as openAiResponse } from './openai';
import { getResponse as perplexityResponse } from './perplexity';
import type { Response } from './types';

export const RESPONSE_MODELS = [
  'anthropic:claude-3-5-haiku-latest',
  'google:gemini-2.5-flash',
  'openai:gpt-5-nano',
  'perplexity:sonar',
];

export const getResponse = async (
  prompt: string,
  model: string,
): Promise<Response> => {
  const [provider, modelName] = model.split(':');
  if (!provider || !modelName) {
    throw new Error(`Invalid model format: ${model}`);
  }
  switch (provider) {
    case 'anthropic':
      return anthropicResponse(modelName, prompt);
    case 'google':
      return googleResponse(modelName, prompt);
    case 'openai':
      return openAiResponse(modelName, prompt);
    case 'perplexity':
      return perplexityResponse(modelName, prompt);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
};
