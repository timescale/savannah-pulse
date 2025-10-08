import { sql } from 'kysely';

import {
  db,
  type NewResponseFollowUp,
  type ResponseFollowUpUpdate,
} from '../db';

export const getResponseFollowUpsByResponseId = async (responseId: number) => {
  return await db
    .selectFrom('response_followups')
    .select([
      'id',
      'created_at',
      sql`array_length(followup, 1)`.as('followup_count'),
    ])
    .where('response_id', '=', responseId)
    .execute();
};

export const getResponseFollowUpById = async (id: number) => {
  return await db
    .selectFrom('response_followups')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const insertResponseFollowUp = async (followUp: NewResponseFollowUp) => {
  return await db
    .insertInto('response_followups')
    .values(followUp as NewResponseFollowUp)
    .returning(['id'])
    .executeTakeFirstOrThrow();
};

export const updateResponseFollowUp = async (
  id: number,
  followUp: ResponseFollowUpUpdate,
) => {
  followUp.updated_at = new Date();
  return await db
    .updateTable('response_followups')
    .set(followUp)
    .where('id', '=', id)
    .execute();
};

export const deleteResponseFollowUp = async (id: number) => {
  return await db
    .deleteFrom('response_followups')
    .where('id', '=', id)
    .execute();
};
