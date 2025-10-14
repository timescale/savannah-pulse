import { sql } from 'kysely';

import { db } from '../db';

export const getWeeklyLinkCounts = async () => {
  // First, get the top 5 hostnames from the most recent week
  const topHostnames = await db
    .selectFrom('links')
    .innerJoin('responses', 'links.response_id', 'responses.id')
    .select([
      'links.hostname',
      db.fn.count('links.id').as('count'),
    ])
    .where(
      sql`date_trunc('week', responses.created_at)`,
      '=',
      sql`date_trunc('week', (select max(created_at) from responses))`,
    )
    .groupBy('links.hostname')
    .orderBy('count', 'desc')
    .limit(5)
    .execute();

  const hostnameList = topHostnames.map((h) => h.hostname);

  if (hostnameList.length === 0) {
    return [];
  }

  // Then get all weekly counts for those top 5 hostnames
  return await db
    .selectFrom('links')
    .innerJoin('responses', 'links.response_id', 'responses.id')
    .select([
      sql<Date>`date_trunc('week', responses.created_at)`.as('week'),
      'links.hostname',
      db.fn.count('links.id').as('count'),
    ])
    .where('links.hostname', 'in', hostnameList)
    .groupBy([sql`date_trunc('week', responses.created_at)`, 'links.hostname'])
    .orderBy('week', 'desc')
    .orderBy('count', 'desc')
    .execute();
};

export const getWeeklyBrandSentimentCounts = async () => {
  // First, get the top 5 brands from the most recent week
  const topBrands = await db
    .selectFrom('brand_sentiment')
    .innerJoin('responses', 'brand_sentiment.response_id', 'responses.id')
    .select([
      'brand_sentiment.brand',
      db.fn.count('brand_sentiment.id').as('count'),
    ])
    .where(
      sql`date_trunc('week', responses.created_at)`,
      '=',
      sql`date_trunc('week', (select max(created_at) from responses))`,
    )
    .groupBy('brand_sentiment.brand')
    .orderBy('count', 'desc')
    .limit(5)
    .execute();

  const brandList = topBrands.map((b) => b.brand);

  if (brandList.length === 0) {
    return [];
  }

  // Then get all weekly counts for those top 5 brands
  return await db
    .selectFrom('brand_sentiment')
    .innerJoin('responses', 'brand_sentiment.response_id', 'responses.id')
    .select([
      sql<Date>`date_trunc('week', responses.created_at)`.as('week'),
      'brand_sentiment.brand',
      db.fn.count('brand_sentiment.id').as('count'),
    ])
    .where('brand_sentiment.brand', 'in', brandList)
    .groupBy([
      sql`date_trunc('week', responses.created_at)`,
      'brand_sentiment.brand',
    ])
    .orderBy('week', 'desc')
    .orderBy('count', 'desc')
    .execute();
};
