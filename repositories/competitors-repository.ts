import { db, type NewCompetitor } from '../db';

export const getCompetitors = async () => {
  return await db.selectFrom('competitors').selectAll().execute();
};

export const insertCompetitor = async (competitor: NewCompetitor) => {
  await db.insertInto('competitors').values(competitor).execute();
};
