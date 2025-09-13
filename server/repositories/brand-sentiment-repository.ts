import type { Transaction } from 'kysely';

import { type Database, db, type NewBrandSentiment } from '../db';

export const getBrandSentiment = async () => {
  return await db
    .selectFrom('brand_sentiment')
    .select([
      'brand',
      db.fn
        .sum(
          db
            .case()
            .when('sentiment', '=', 'positive')
            .then(1)
            .when('sentiment', '=', 'neutral')
            .then(0)
            .when('sentiment', '=', 'negative')
            .then(-1)
            .end(),
        )
        .as('sentiment_score'),
    ])
    .groupBy('brand')
    .orderBy('sentiment_score', 'desc')
    .execute();
};

export const getBrandSentimentByResponseId = async (responseId: number) => {
  return await db
    .selectFrom('brand_sentiment')
    .selectAll()
    .where('response_id', '=', responseId)
    .execute();
};

export const insertBrandSentiment = async (
  brandSentiment: NewBrandSentiment,
  trx?: Transaction<Database>,
) => {
  return await (trx || db)
    .insertInto('brand_sentiment')
    .values(brandSentiment)
    .returning(['id'])
    .executeTakeFirst();
};
