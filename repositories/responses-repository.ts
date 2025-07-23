import { db, type NewResponse } from '../db';

export const getResponses = async () => {
  return await db
    .selectFrom('responses')
    .innerJoin('prompts', 'responses.prompt_id', 'prompts.id')
    .selectAll('responses')
    .select(['prompts.id as prompt_id', 'prompts.prompt as prompt'])
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

export const insertResponse = async (response: NewResponse) => {
  return await db
    .insertInto('responses')
    .values(response)
    .returning(['id'])
    .executeTakeFirst();
};
