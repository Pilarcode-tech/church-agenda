import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_meeting_requests_meeting_with" AS ENUM('pastor', 'secretaria', 'lideranca');
  ALTER TABLE "meeting_requests" ADD COLUMN "meeting_with" "enum_meeting_requests_meeting_with" DEFAULT 'pastor' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "meeting_requests" DROP COLUMN "meeting_with";
  DROP TYPE "public"."enum_meeting_requests_meeting_with";`)
}
