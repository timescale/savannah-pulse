import { openai } from '../../providers';

import type { Response } from './types';

export const getResponse = async (
  prompt: string,
  model: string,
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
