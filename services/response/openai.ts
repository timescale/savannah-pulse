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

  return {
    content: response.output_text,
    urls: response.output.reduce((acc, output) => {
      if (output.type === 'message') {
        acc.push(
          ...output.content.reduce((innerAcc, content) => {
            if (content.type === 'output_text') {
              innerAcc.push(
                ...content.annotations.reduce((urlAcc, annotation) => {
                  if (annotation.type === 'url_citation') {
                    urlAcc.push(annotation.url);
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
    }, [] as string[]),
  };
};
