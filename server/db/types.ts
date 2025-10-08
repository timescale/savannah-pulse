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
  schedule: string | null;
  next_run_at: ColumnType<Date | null, Date | null, Date | null>;
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
  raw: { [key: string]: any };
  created_at: ColumnType<Date, never, never>;
}
export type Response = Selectable<ResponseTable>;
export type NewResponse = Insertable<ResponseTable>;
export type ResponseUpdate = Updateable<ResponseTable>;

export interface ResponseFollowUpTable {
  id: Generated<number>;
  response_id: number;
  followup: { [key: string]: any }[];
  created_at: ColumnType<Date, never, never>;
  updated_at: ColumnType<Date, never, Date>;
}
export type ResponseFollowUp = Selectable<ResponseFollowUpTable>;
export type NewResponseFollowUp = Insertable<ResponseFollowUpTable>;
export type ResponseFollowUpUpdate = Updateable<ResponseFollowUpTable>;

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

export interface TagTable {
  id: Generated<number>;
  name: string;
}
export type Tag = Selectable<TagTable>;
export type NewTag = Insertable<TagTable>;
export type TagUpdate = Updateable<TagTable>;

export interface PromptTagsTable {
  prompt_id: number;
  tag_id: number;
}

export type PromptTag = Selectable<PromptTagsTable>;
export type NewPromptTag = Insertable<PromptTagsTable>;

export interface Database {
  brand_sentiment: BrandSentimentTable;
  competitors: CompetitorTable;
  tags: TagTable;
  links: LinkTable;
  search_queries: SearchQueryTable;
  prompts: PromptTable;
  prompts_tags: PromptTagsTable;
  response_followups: ResponseFollowUpTable;
  responses: ResponseTable;
}
