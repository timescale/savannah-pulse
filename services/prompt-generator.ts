import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { openai } from './llms';

const PromptResponse = z.object({
  prompts: z.array(z.string()),
});

export const generatePrompts = async (input: string): Promise<string[]> => {
  const response = await openai.responses.parse({
    input,
    instructions:
      'For the given input, your response should be at most 10 generated prompts',
    model: 'gpt-4.1-mini',
    text: {
      format: zodTextFormat(PromptResponse, 'promptResponse'),
    },
    tools: [{ type: 'web_search_preview' }],
  });

  return response.output_parsed?.prompts || [];
};
