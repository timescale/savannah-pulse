import type {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface PromptTable {
  id: Generated<number>;
  prompt: string;
  models: string[];
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, Date>;
}
export type Prompt = Selectable<PromptTable>;
export type NewPrompt = Insertable<PromptTable>;
export type PromptUpdate = Updateable<PromptTable>;

export interface ResponseTable {
  id: Generated<number>;
  prompt_id: number;
  model: string;
  response: string;
  created_at: ColumnType<Date, never, never>;
}
export type Response = Selectable<ResponseTable>;
export type NewResponse = Insertable<ResponseTable>;
export type ResponseUpdate = Updateable<ResponseTable>;

export interface LinkTable {
  id: Generated<number>;
  response_id: number;
  url: string;
  hostname: string;
}
export type Link = Selectable<LinkTable>;
export type NewLink = Insertable<LinkTable>;
export type LinkUpdate = Updateable<LinkTable>;

export interface CompetitorTable {
  id: Generated<number>;
  name: string;
  url: string;
  added_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, Date>;
}
export type Competitors = Selectable<CompetitorTable>;
export type NewCompetitor = Insertable<CompetitorTable>;
export type CompetitorUpdate = Updateable<CompetitorTable>;

export interface BrandSentimentTable {
  id: Generated<number>;
  brand: string;
  response_id: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}
export type BrandSentiment = Selectable<BrandSentimentTable>;
export type NewBrandSentiment = Insertable<BrandSentimentTable>;
export type BrandSentimentUpdate = Updateable<BrandSentimentTable>;

export interface SearchQueryTable {
  id: Generated<number>;
  response_id: number;
  query: string;
}
export type SearchQuery = Selectable<SearchQueryTable>;
export type NewSearchQuery = Insertable<SearchQueryTable>;
export type SearchQueryUpdate = Updateable<SearchQueryTable>;

export interface Database {
  brand_sentiment: BrandSentimentTable;
  competitors: CompetitorTable;
  links: LinkTable;
  search_queries: SearchQueryTable;
  prompts: PromptTable;
  responses: ResponseTable;
}
