import { perplexity, type PerplexityChatCompletionData } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
  priorMessages: any[],
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

  const urls = response.search_results.map((result) => result.url);

  return {
    content: response.choices[0].message.content,
    raw: {},
    searchQueries: [],
    urls: [...new Set(urls)],
  };
};
