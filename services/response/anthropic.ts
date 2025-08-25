import { anthropic, anthropicMaxTokens } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
): Promise<Response> => {
  if (!anthropicMaxTokens[model]) {
    throw new Error(`Unknown model: ${model}`);
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: anthropicMaxTokens[model],
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      },
    ],
  });

  let responseText = '';
  const searchQueries: string[] = [];
  const urls: string[] = [];

  for (const content of response.content) {
    if (content.type === 'server_tool_use' && content.name === 'web_search') {
      searchQueries.push((content.input as { query: string }).query);
    }

    if (content.type !== 'text') {
      continue;
    }
    responseText += content.text;
    for (const citation of content.citations || []) {
      if (citation.type === 'web_search_result_location') {
        urls.push(citation.url);
      }
    }
  }

  return {
    content: responseText,
    searchQueries,
    urls: [...new Set(urls)],
  };
};
