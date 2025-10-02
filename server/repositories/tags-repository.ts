import { db, type TagUpdate } from '../db';

export const getTags = async () => {
  return await db
    .selectFrom('tags')
    .selectAll()
    .orderBy('name', 'asc')
    .execute();
};

export const getTag = async (id: number) => {
  return await db
    .selectFrom('tags')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const insertTag = async (name: string) => {
  return await db
    .insertInto('tags')
    .values({ name })
    .returningAll()
    .executeTakeFirst();
};

export const updateTag = async (id: number, tag: TagUpdate) => {
  return await db
    .updateTable('tags')
    .set(tag)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteTag = async (id: number) => {
  return await db.deleteFrom('tags').where('id', '=', id).execute();
};
