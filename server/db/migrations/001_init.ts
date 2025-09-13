import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('prompts')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('prompt', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('responses')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('prompt_id', 'integer', (col) => col.notNull())
    .addColumn('provider', 'text', (col) => col.notNull())
    .addColumn('response', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addForeignKeyConstraint('fk_prompt_id', ['prompt_id'], 'prompts', ['id'])
    .execute();

  await db.schema
    .createTable('competitors')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('added_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('competitor_sentiments')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('competitor_id', 'integer', (col) => col.notNull())
    .addColumn('response_id', 'integer', (col) => col.notNull())
    .addColumn('sentiment', 'text', (col) => col.notNull())
    .addForeignKeyConstraint(
      'fk_competitor_id',
      ['competitor_id'],
      'competitors',
      ['id'],
    )
    .addForeignKeyConstraint('fk_response_id', ['response_id'], 'responses', [
      'id',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('competitor_sentiments').execute();
  await db.schema.dropTable('competitors').execute();
  await db.schema.dropTable('responses').execute();
  await db.schema.dropTable('prompts').execute();
}
