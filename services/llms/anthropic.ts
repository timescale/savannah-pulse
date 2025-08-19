import { Anthropic } from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY']!,
});

export const anthropicMaxTokens: Record<string, number> = {
  'claude-opus-4-1': 32_000,
  'laude-sonnet-4-0': 64_000,
  'claude-3-7-sonnet-latest': 128_000,
  'claude-3-5-haiku-latest': 8192,
};
