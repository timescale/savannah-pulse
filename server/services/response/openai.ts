import OpenAI from 'openai';

import { openai } from '../llms';

import type { Response } from './types';

export const getResponse = async (
  model: string,
  prompt: string,
  priorMessages: any[],
): Promise<Response> => {
  const response = await openai.responses.create({
    model,
    tools: [{ type: 'web_search_preview' }],
    input: [...priorMessages, { role: 'user', content: prompt }],
  });

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
    raw: response,
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

const isResponse = (obj: any): obj is OpenAI.Responses.Response => {
  return obj && typeof obj === 'object' && 'object' in obj && 'output' in obj;
};

export const parseFollowUp = (
  prompt: string,
  raw: OpenAI.Responses.Response,
  followup: (OpenAI.Responses.Response | { [key: string]: any })[],
) => {
  const output: any[] = [
    {
      type: 'message',
      role: 'user',
      content: [
        {
          text: prompt,
        },
      ],
    },
    ...raw.output.filter((o) =>
      ['web_search_call', 'message'].includes(o.type),
    ),
  ];
  for (const result of followup) {
    if ('role' in result && result['role'] === 'user') {
      output.push(result);
      continue;
    }
    if (!isResponse(result)) {
      continue;
    }
    output.push(
      ...result.output.filter((o) =>
        ['web_search_call', 'message'].includes(o.type),
      ),
    );
  }
  return output;
};

export const getPriorMessages = (
  prompt: string,
  raw: OpenAI.Responses.Response,
  followup: any[],
) => {
  const messages = [
    {
      role: 'user',
      content: prompt,
    },
    ...raw.output,
  ];
  for (const item of followup) {
    if (isResponse(item)) {
      messages.push(...item.output);
    } else {
      messages.push(item);
    }
  }
  return messages;
};
