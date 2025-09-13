import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('search_queries')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('response_id', 'integer', (col) => col.notNull())
    .addColumn('query', 'text', (col) => col.notNull())
    .addForeignKeyConstraint('fk_response_id', ['response_id'], 'responses', [
      'id',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('search_queries').execute();
}
