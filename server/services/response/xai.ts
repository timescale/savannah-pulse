import { xai, type xAIChatCompletionData } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
  priorMessages: any[],
): Promise<Response> => {
  const response = await xai.chatCompletion({
    model: model as xAIChatCompletionData['model'],
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    search_parameters: {
      mode: 'auto',
      return_citations: true,
    },
  });

  const urls = response.citations || [];

  return {
    content: response.choices[0]?.message.content || '',
    raw: {},
    searchQueries: [],
    urls: [...new Set(urls)],
  };
};
