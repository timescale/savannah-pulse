export interface xAIChatCompletionData {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  search_parameters?: {
    mode: 'auto' | 'off' | 'on';
    return_citations?: boolean;
  };
  model:
    | 'grok-4-fast-reasoning'
    | 'grok-4-fast-non-reasoning'
    | 'grok-4-0709'
    | 'grok-3-mini'
    | 'grok-3';
}

export interface xAIChatCompletion {
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
  }[];
  citations?: string[];
}

class xAI {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai';

  constructor(options: { apiKey?: string | undefined; baseUrl?: string }) {
    const apiKey = options.apiKey || process.env['XAI_API_KEY'];
    if (!apiKey) {
      throw new Error('xAI API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || this.baseUrl;
  }

  public async chatCompletion(
    data: xAIChatCompletionData,
  ): Promise<xAIChatCompletion> {
    const req = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!req.ok) {
      throw new Error('Failed to fetch perplexity chat completion');
    }
    return req.json() as Promise<xAIChatCompletion>;
  }
}

export const xai = new xAI({
  apiKey: process.env['XAI_API_KEY'],
});
