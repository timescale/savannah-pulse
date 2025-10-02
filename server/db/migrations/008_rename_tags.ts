import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('categories').renameTo('tags').execute();

  await db.schema
    .alterTable('prompts')
    .renameColumn('categories', 'tags')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('tags').renameTo('categories').execute();

  await db.schema
    .alterTable('prompts')
    .renameColumn('tags', 'categories')
    .execute();
}
