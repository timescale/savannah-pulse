import { perplexity, type PerplexityChatCompletionData } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
): Promise<Response> => {
  const response = await perplexity.chatCompletion({
    model: model as PerplexityChatCompletionData['model'],
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return {
    content: response.choices[0].message.content,
    urls: response.search_results.map((result) => result.url),
  };
};
