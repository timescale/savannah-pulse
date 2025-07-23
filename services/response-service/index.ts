import { getResponse as chatGptResponse } from './chatgpt';
import type { Response } from './types';

export const getResponse = async (
  prompt: string,
  model: 'gpt-4o-search-preview' | 'gpt-4o-mini-search-preview',
): Promise<Response> => {
  switch (model) {
    case 'gpt-4o-search-preview':
    case 'gpt-4o-mini-search-preview':
      return chatGptResponse(prompt, model);
    default:
      throw new Error(`Unsupported model: ${model}`);
  }
};
