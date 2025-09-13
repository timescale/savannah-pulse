export interface PerplexityChatCompletionData {
  model:
    | 'sonar'
    | 'sonar-pro'
    | 'sonar-reasoning'
    | 'sonar-reasoning-pro'
    | 'sonar-deep-research';
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export interface PerplexityChatCompletion {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    search_context_size: string;
  };
  search_results: {
    title: string;
    url: string;
    date: string;
    last_updated: string;
  }[];
  object: 'chat.completion';
  choices: [
    {
      index: number;
      finish_reason: 'stop';
      message: {
        role: 'assistant';
        content: string;
      };
      delta: {
        role: 'assistant';
        content: string;
      };
    },
  ];
}

class Perplexity {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';

  constructor(options: { apiKey?: string | undefined; baseUrl?: string }) {
    const apiKey = options.apiKey || process.env['PERPLEXITY_API_KEY'];
    if (!apiKey) {
      throw new Error('Perplexity API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || this.baseUrl;
  }

  public async chatCompletion(
    data: PerplexityChatCompletionData,
  ): Promise<PerplexityChatCompletion> {
    const req = await fetch(`${this.baseUrl}/chat/completions`, {
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
    return req.json() as Promise<PerplexityChatCompletion>;
  }
}

export const perplexity = new Perplexity({
  apiKey: process.env['PERPLEXITY_API_KEY'],
});
