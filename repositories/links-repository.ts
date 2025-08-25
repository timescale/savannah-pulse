import type { Transaction } from 'kysely';

import { type Database, db, type NewLink } from '../db';

export const getLinks = async () => {
  return await db.selectFrom('links').selectAll().execute();
};

export const getRecentLinks = async () => {
  return await db
    .selectFrom('links')
    .innerJoin('responses', 'links.response_id', 'responses.id')
    .selectAll('links')
    .select(['responses.id as response_id', 'responses.created_at'])
    .orderBy('responses.created_at', 'desc')
    .limit(20)
    .execute();
};

export const getHostnameCount = async () => {
  return await db
    .selectFrom('links')
    .select(['hostname', db.fn.count('id').as('count')])
    .groupBy('hostname')
    .orderBy('count', 'desc')
    .execute();
};

export const getLinksByResponseId = async (responseId: number) => {
  return await db
    .selectFrom('links')
    .selectAll()
    .where('response_id', '=', responseId)
    .orderBy('hostname', 'asc')
    .execute();
};

export const insertLink = async (
  link: NewLink,
  trx?: Transaction<Database>,
) => {
  return await (trx || db)
    .insertInto('links')
    .values(link)
    .returning(['id'])
    .executeTakeFirst();
};
