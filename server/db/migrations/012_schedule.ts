import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('prompts').addColumn('schedule', 'text').execute();

  await db.schema
    .alterTable('prompts')
    .addColumn('next_run_at', 'timestamp')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('prompts').dropColumn('next_run_at').execute();
  await db.schema.alterTable('prompts').dropColumn('schedule').execute();
}
