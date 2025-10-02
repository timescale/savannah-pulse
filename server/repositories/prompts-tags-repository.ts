import { db, type NewPromptTag } from '../db';

export const insertPromptTag = async (promptTag: NewPromptTag) => {
  return await db.insertInto('prompts_tags').values(promptTag).execute();
};

export const getTagsForPrompt = async (promptId: number) => {
  return await db
    .selectFrom('prompts_tags')
    .innerJoin('tags', 'prompts_tags.tag_id', 'tags.id')
    .selectAll('tags')
    .where('prompts_tags.prompt_id', '=', promptId)
    .orderBy('tags.name', 'asc')
    .execute();
};

export const deletePromptTag = async (promptId: number, tagId: number) => {
  return await db
    .deleteFrom('prompts_tags')
    .where('prompt_id', '=', promptId)
    .where('tag_id', '=', tagId)
    .execute();
};
