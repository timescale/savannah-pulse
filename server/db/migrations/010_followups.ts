import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('responses')
    .addColumn('raw', 'jsonb', (col) =>
      col.notNull().defaultTo(sql`'{}'::jsonb`),
    )
    .execute();

  await db.schema
    .createTable('response_followups')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('response_id', 'integer', (col) =>
      col.references('responses.id').onDelete('cascade'),
    )
    .addColumn('followup', sql`jsonb[]`)
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('responses').dropColumn('raw').execute();
  await db.schema.dropTable('response_followups').execute();
}
