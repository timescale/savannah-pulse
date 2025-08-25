import { openai } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
): Promise<Response> => {
  const response = await openai.responses.create({
    model,
    tools: [{ type: 'web_search_preview' }],
    input: prompt,
  });

  console.log(JSON.stringify(response.output, null, 2));

  const urls = response.output.reduce((acc, output) => {
    if (output.type === 'message') {
      acc.push(
        ...output.content.reduce((innerAcc, content) => {
          if (content.type === 'output_text') {
            innerAcc.push(
              ...content.annotations.reduce((urlAcc, annotation) => {
                if (annotation.type === 'url_citation') {
                  urlAcc.push(
                    annotation.url.replace(/[?|&]utm_source=chatgpt\.com/, ''),
                  );
                }
                return urlAcc;
              }, [] as string[]),
            );
          }
          return innerAcc;
        }, [] as string[]),
      );
    }
    return acc;
  }, [] as string[]);

  return {
    content: response.output_text,
    searchQueries: response.output.reduce((acc, output) => {
      if (output.type === 'web_search_call' && output.status === 'completed') {
        // Incomplete typing from openai sdk so that `output.action` is not defined,
        // so have to hack around that.
        const castOutput = output as unknown as {
          action: { query: string } | undefined;
        };
        if (castOutput.action?.query) {
          acc.push(castOutput.action.query);
        }
      }
      return acc;
    }, [] as string[]),
    urls: [...new Set(urls)],
  };
};
