import type { Transaction } from 'kysely';

import { type Database, db, type NewSearchQuery } from '../db';

export const getSearchQueriesByResponseId = async (responseId: number) => {
  return await db
    .selectFrom('search_queries')
    .selectAll()
    .where('response_id', '=', responseId)
    .execute();
};

export const insertSearchQuery = async (
  searchQuery: NewSearchQuery,
  trx?: Transaction<Database>,
) => {
  return await (trx || db)
    .insertInto('search_queries')
    .values(searchQuery)
    .returning(['id'])
    .executeTakeFirst();
};
