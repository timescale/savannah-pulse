import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('responses')
    .addColumn('model', 'text')
    .dropColumn('provider')
    .execute();
  await db
    // @ts-expect-error tables are not typed here
    .updateTable('responses')
    // @ts-expect-error tables are not typed here
    .set({ model: 'openai:gpt-4o-mini-search-preview' })
    .execute();
  await db.schema
    .alterTable('responses')
    .alterColumn('model', (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('brand_sentiment').execute();
}
