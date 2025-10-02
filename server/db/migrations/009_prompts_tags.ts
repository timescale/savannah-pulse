import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('prompts').dropColumn('tags').execute();

  await db.schema
    .createTable('prompts_tags')
    .addColumn('prompt_id', 'integer', (col) =>
      col.references('prompts.id').onDelete('cascade'),
    )
    .addColumn('tag_id', 'integer', (col) =>
      col.references('tags.id').onDelete('cascade'),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('prompts_tags').execute();

  await db.schema
    .alterTable('prompts')
    .addColumn('tags', sql`text[]`, (col) => col.defaultTo('ARRAY[]::text[]'))
    .execute();
}
