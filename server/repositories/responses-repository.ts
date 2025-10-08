import type { Transaction } from 'kysely';

import { type Database, db, type NewResponse } from '../db';

export const getResponses = async () => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
    .orderBy('responses.created_at', 'desc')
    .execute();
};

export const getResponsesByProvider = async (provider: string) => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
    .where('responses.model', 'like', `${provider}%`)
    .orderBy('responses.created_at', 'desc')
    .execute();
};

export const getResponsesForTag = async (tagId: number) => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .innerJoin('prompts_tags', 'prompts.id', 'prompts_tags.prompt_id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
    .where('prompts_tags.tag_id', '=', tagId)
    .orderBy('responses.created_at', 'desc')
    .execute();
};

export const getResponsesByProviderAndTag = async (provider: string, tagId: number) => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .innerJoin('prompts_tags', 'prompts.id', 'prompts_tags.prompt_id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
    .where('responses.model', 'like', `${provider}%`)
    .where('prompts_tags.tag_id', '=', tagId)
    .orderBy('responses.created_at', 'desc')
    .execute();
};

export const getResponseById = async (id: number) => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
    .where('responses.id', '=', id)
    .executeTakeFirst();
};

export const insertResponse = async (
  response: NewResponse,
  trx?: Transaction<Database>,
) => {
  return await (trx || db)
    .insertInto('responses')
    .values(response)
    .returning(['id'])
    .executeTakeFirst();
};
