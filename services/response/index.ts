import { getResponse as anthropicResponse } from './anthropic';
import { getResponse as googleResponse } from './google';
import { getResponse as openAiResponse } from './openai';
import { getResponse as perplexityResponse } from './perplexity';
import type { Response } from './types';

export const SUPPORTED_RESPONSE_MODELS = [
  'anthropic:claude-opus-4-1-120250805',
  'anthropic:claude-opus-4-20250514',
  'anthropic:claude-sonnet-4-20250514',
  'anthropic:claude-3-7-sonnet-latest',
  'anthropic:claude-3-5-haiku-latest',
  'google:gemini-2.5-pro',
  'google:gemini-2.5-flash',
  'google:gemini-2.5-flash-lite',
  'openai:gpt-5',
  'openai:gpt-5-mini',
  'openai:gpt-5-nano',
  'openai:o3-deep-research',
  'openai:o4-mini-deep-research',
  'openai:gpt-4.1',
  'openai:gpt-4.1-mini',
  'openai:gpt-4.1-nano',
  'perplexity:sonar',
  'perplexity:sonar-pro',
  'perplexity:sonar-reasoning',
  'perplexity:sonar-reasoning-pro',
];

export const SUPPORTED_RESPONSE_MODELS_BY_PROVIDER =
  SUPPORTED_RESPONSE_MODELS.reduce(
    (acc, model) => {
      const parts = model.split(':');
      const provider = parts[0] as string;
      acc[provider] = acc[provider] || [];
      acc[provider].push(parts[1] as string);
      return acc;
    },
    {} as { [provider: string]: string[] },
  );

export const DEFAULT_RESPONSE_MODELS = [
  'anthropic:claude-3-5-haiku-latest',
  'google:gemini-2.5-flash',
  'openai:gpt-5-mini',
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
