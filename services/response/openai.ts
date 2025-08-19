import { openai } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
): Promise<Response> => {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    web_search_options: {},
  });

  if (!response.choices[0]?.message.content) {
    throw new Error('No response content found');
  }

  return {
    content: response.choices[0].message.content,
    urls: (response.choices[0].message.annotations || []).map(
      (annotation) => annotation.url_citation.url,
    ),
  };
};
