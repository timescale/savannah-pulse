import { db, type NewPrompt } from '../db';

export const getPrompts = async () => {
  return await db.selectFrom('prompts').selectAll().execute();
};

export const getPromptById = async (id: number) => {
  return await db
    .selectFrom('prompts')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const insertPrompt = async (prompt: NewPrompt) => {
  return await db.insertInto('prompts').values(prompt).execute();
};

export const deletePrompt = async (id: number) => {
  return await db.deleteFrom('prompts').where('id', '=', id).execute();
};
