import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('categories')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .alterTable('prompts')
    .addColumn('categories', sql`text[]`, (col) =>
      col.defaultTo(sql`ARRAY[]::text[]`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('categories').execute();
  await db.schema.alterTable('prompts').dropColumn('categories').execute();
}
