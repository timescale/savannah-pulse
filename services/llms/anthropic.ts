import { Anthropic } from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY']!,
  // Lower timeout to less than 10 minutes to avoid error about streaming
  timeout: 5 * 60 * 1000,
});

export const anthropicMaxTokens: Record<string, number> = {
  'claude-opus-4-1-120250805': 32_000,
  'claude-opus-4-20250514': 32_000,
  'claude-sonnet-4-20250514': 64_000,
  'claude-3-7-sonnet-latest': 128_000,
  'claude-3-5-haiku-latest': 8192,
};
