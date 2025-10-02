import { xai, type xAIChatCompletionData } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
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
    searchQueries: [],
    urls: [...new Set(urls)],
  };
};
