import { db, type NewPrompt, type PromptUpdate } from '../db';

export const getPrompts = async () => {
  return await db
    .selectFrom('prompts')
    .selectAll()
    .orderBy('id', 'asc')
    .execute();
};

export const getPromptById = async (id: number) => {
  return await db
    .selectFrom('prompts')
    .leftJoin(
      (eb) =>
        eb
          .selectFrom('prompts_tags')
          .select(({ fn }) => [
            'prompt_id',
            fn.agg<number[]>('array_agg', ['prompts_tags.tag_id']).as('tags'),
          ])
          .groupBy('prompt_id')
          .as('pt'),
      (join) => join.onRef('pt.prompt_id', '=', 'prompts.id'),
    )
    .selectAll('prompts')
    .select(['pt.tags'])
    .where('id', '=', id)
    .executeTakeFirst();
};

export const insertPrompt = async (prompt: NewPrompt) => {
  return await db
    .insertInto('prompts')
    .values(prompt)
    .returning(['id'])
    .executeTakeFirstOrThrow();
};

export const updatePrompt = async (id: number, prompt: PromptUpdate) => {
  return await db
    .updateTable('prompts')
    .set(prompt)
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
};

export const getPromptsForTag = async (tagId: number) => {
  return await db
    .selectFrom('prompts')
    .innerJoin('prompts_tags', 'prompts.id', 'prompts_tags.prompt_id')
    .selectAll('prompts')
    .where('prompts_tags.tag_id', '=', tagId)
    .orderBy('id', 'asc')
    .execute();
};

export const deletePrompt = async (id: number) => {
  return await db.deleteFrom('prompts').where('id', '=', id).execute();
};
