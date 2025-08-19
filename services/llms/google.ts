import { GoogleGenAI } from '@google/genai';

// Configure the client
export const google = new GoogleGenAI({
  apiKey: process.env['GOOGLE_API_KEY'] || '',
});
