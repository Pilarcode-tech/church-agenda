import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_type" AS ENUM(
        'REQUEST_CREATED',
        'REQUEST_APPROVED',
        'REQUEST_REJECTED',
        'REQUEST_RESCHEDULED',
        'RESERVATION_CREATED',
        'RESERVATION_APPROVED',
        'RESERVATION_REJECTED'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_notifications_source_collection" AS ENUM(
        'meeting-requests',
        'reservations'
      );
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "recipient_id" integer NOT NULL,
      "type" "public"."enum_notifications_type" NOT NULL,
      "message" varchar NOT NULL,
      "source_collection" "public"."enum_notifications_source_collection" NOT NULL,
      "source_id" numeric NOT NULL,
      "read" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" USING btree ("read")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" USING btree ("created_at")`)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "notifications"
        ADD CONSTRAINT "notifications_recipient_id_users_id_fk"
        FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "notifications_id" integer
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk"
        FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_notifications_id_idx"
      ON "payload_locked_documents_rels" USING btree ("notifications_id")
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "notifications_id"`)
  await db.execute(sql`DROP TABLE IF EXISTS "notifications"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_notifications_type"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_notifications_source_collection"`)
}
