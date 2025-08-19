import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

import { openai } from './llms';

const BrandSentiment = z.object({
  sentiments: z.array(
    z.object({
      brand: z.string(),
      sentiment: z.union([
        z.literal('positive'),
        z.literal('neutral'),
        z.literal('negative'),
      ]),
    }),
  ),
});

export const generateBrandSentiment = async (
  brands: string[],
  text: string,
) => {
  const response = await openai.chat.completions.parse({
    model: 'gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: `
You are an expert in brand sentiment analysis. Given a list of customers and some text,
return a list of the brands that were mentioned in the text along with the sentiment expressed
towards each brand. The sentiment should be one of the following: positive, neutral, or negative.
If a brand is not mentioned in the text, then do not include it in the response. If none of
the brands are mentioned, then return an empty list.
`.trim(),
      },
      {
        role: 'user',
        content: `
Brands: ${brands.join(', ')}

Text:

${text}
`.trim(),
      },
    ],
    response_format: zodResponseFormat(BrandSentiment, 'brandSentiment'),
  });

  return response.choices[0]?.message.parsed || { sentiments: [] };
};
