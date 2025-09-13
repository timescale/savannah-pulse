import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('prompts')
    .addColumn('models', sql`text[]`)
    .execute();

  await db
    // @ts-expect-error tables are not typed here
    .updateTable('prompts')
    .set({
      // @ts-expect-error tables are not typed here
      models: [
        'anthropic:claude-3-5-haiku-latest',
        'google:gemini-2.5-flash',
        'openai:gpt-5-nano',
        'perplexity:sonar',
      ],
    })
    .execute();

  await db.schema
    .alterTable('prompts')
    .alterColumn('models', (col) => col.setNotNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('prompts').dropColumn('models').execute();
}
