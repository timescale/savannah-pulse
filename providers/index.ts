import { config } from 'dotenv';
import { join } from 'node:path';
import { OpenAI } from 'openai';

config({ path: join(__dirname, '..', '.env') });

export const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});
