import {
  parseFollowUp as anthropicParseFollowUp,
  getResponse as anthropicResponse,
} from './anthropic';
import { getResponse as googleResponse } from './google';
import {
  getPriorMessages as openAiGetPriorMessages,
  parseFollowUp as openAiParseFollowUp,
  getResponse as openAiResponse,
} from './openai';
import { getResponse as perplexityResponse } from './perplexity';
import type { Response } from './types';
import { getResponse as xAIResponse } from './xai';

export const SUPPORTED_RESPONSE_MODELS = [
  'anthropic:claude-sonnet-4-5-20250929',
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
  'xai:grok-4-fast-reasoning',
  'xai:grok-4-fast-non-reasoning',
  'xai:grok-4-0709',
  'xai:grok-3-mini',
  'xai:grok-3',
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
  'anthropic:claude-sonnet-4-5-20250929',
  'google:gemini-2.5-flash',
  'openai:gpt-5-mini',
  'perplexity:sonar',
  'xai:grok-4-fast-non-reasoning',
];

export const getResponse = async (
  prompt: string,
  model: string,
  priorMessages: any[] = [],
): Promise<Response> => {
  const [provider, modelName] = model.split(':');
  if (!provider || !modelName) {
    throw new Error(`Invalid model format: ${model}`);
  }
  switch (provider) {
    case 'anthropic':
      return anthropicResponse(modelName, prompt, priorMessages);
    case 'google':
      return googleResponse(modelName, prompt, priorMessages);
    case 'openai':
      return openAiResponse(modelName, prompt, priorMessages);
    case 'perplexity':
      return perplexityResponse(modelName, prompt, priorMessages);
    case 'xai':
      return xAIResponse(modelName, prompt, priorMessages);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
};

export const parseFollowUp = (
  model: string,
  prompt: string,
  raw: { [key: string]: any },
  followup: { [key: string]: any }[],
) => {
  const [provider, modelName] = model.split(':');
  if (!provider || !modelName) {
    throw new Error(`Invalid model format: ${model}`);
  }
  switch (provider) {
    case 'anthropic':
      return anthropicParseFollowUp(prompt, raw, followup);
    case 'openai':
      return openAiParseFollowUp(
        prompt,
        raw as Parameters<typeof openAiParseFollowUp>[1],
        followup,
      );
    default:
      throw new Error(`Unsupported model for follow-up parsing: ${model}`);
  }
};

export const getPriorMessages = (
  model: string,
  prompt: string,
  raw: any,
  followup: any[],
) => {
  const [provider, modelName] = model.split(':');
  if (!provider || !modelName) {
    throw new Error(`Invalid model format: ${model}`);
  }
  switch (provider) {
    case 'openai':
      return openAiGetPriorMessages(
        prompt,
        raw as Parameters<typeof openAiGetPriorMessages>[1],
        followup as Parameters<typeof openAiGetPriorMessages>[2],
      );
    default:
      throw new Error(`Unsupported model for prior messages: ${model}`);
  }
};
