import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('links')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('response_id', 'integer', (col) => col.notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('hostname', 'text', (col) => col.notNull())
    .addForeignKeyConstraint('fk_response_id', ['response_id'], 'responses', [
      'id',
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('links').execute();
}
