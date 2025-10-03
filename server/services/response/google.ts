import { google } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
  priorMessages: any[],
): Promise<Response> => {
  const response = await google.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const urls = await Promise.all(
    response.candidates?.[0]?.groundingMetadata?.groundingChunks?.reduce<
      Promise<string>[]
    >((acc, chunk) => {
      const uri = chunk.web?.uri;
      if (uri) {
        if (
          uri.includes('vertexaisearch.cloud.google.com/grounding-api-redirect')
        ) {
          acc.push(
            new Promise((resolve) => {
              fetch(uri, { redirect: 'manual' }).then((response) => {
                resolve(response.headers.get('location') || uri);
              });
            }),
          );
        } else {
          acc.push(Promise.resolve(uri));
        }
      }
      return acc;
    }, []) || [],
  );

  return {
    content: response.text || '',
    raw: {},
    searchQueries:
      response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
    urls: [...new Set(urls)],
  };
};
