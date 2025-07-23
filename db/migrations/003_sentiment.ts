import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('brand_sentiment')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('response_id', 'integer', (col) => col.notNull())
    .addColumn('brand', 'text', (col) => col.notNull())
    .addColumn('sentiment', 'text', (col) => col.notNull())
    .addForeignKeyConstraint('fk_response_id', ['response_id'], 'responses', [
      'id',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('brand_sentiment').execute();
}
