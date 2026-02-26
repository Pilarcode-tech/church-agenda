import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pastor_schedule"
      ADD COLUMN IF NOT EXISTS "requested_by_id" integer
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "pastor_schedule"
        ADD CONSTRAINT "pastor_schedule_requested_by_id_users_id_fk"
        FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "pastor_schedule_requested_by_idx"
      ON "pastor_schedule" USING btree ("requested_by_id")
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "pastor_schedule" DROP COLUMN IF EXISTS "requested_by_id"`)
}
