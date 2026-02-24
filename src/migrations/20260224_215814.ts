import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_meeting_requests_modality" AS ENUM('presencial', 'online');
  CREATE TYPE "public"."enum_reservations_resources_needed" AS ENUM('projecao', 'som', 'microfone', 'foto_video', 'cozinha', 'comes_bebes', 'ar_condicionado', 'cadeiras_extras', 'mesas');
  CREATE TABLE "meeting_requests_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "reservations_resources_needed" DROP CONSTRAINT "reservations_resources_needed_parent_id_fk";
  
  DROP INDEX "reservations_resources_needed_parent_id_idx";
  DROP INDEX "reservations_resources_needed_order_idx";
  ALTER TABLE "reservations_resources_needed" ALTER COLUMN "id" SET DATA TYPE serial;
  ALTER TABLE "meeting_requests" ADD COLUMN "modality" "enum_meeting_requests_modality" DEFAULT 'presencial' NOT NULL;
  ALTER TABLE "meeting_requests" ADD COLUMN "is_all_day" boolean DEFAULT false;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "order" integer NOT NULL;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "parent_id" integer NOT NULL;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "value" "enum_reservations_resources_needed";
  ALTER TABLE "reservations" ADD COLUMN "resource_notes" varchar;
  ALTER TABLE "meeting_requests_rels" ADD CONSTRAINT "meeting_requests_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."meeting_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "meeting_requests_rels" ADD CONSTRAINT "meeting_requests_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "meeting_requests_rels_order_idx" ON "meeting_requests_rels" USING btree ("order");
  CREATE INDEX "meeting_requests_rels_parent_idx" ON "meeting_requests_rels" USING btree ("parent_id");
  CREATE INDEX "meeting_requests_rels_path_idx" ON "meeting_requests_rels" USING btree ("path");
  CREATE INDEX "meeting_requests_rels_users_id_idx" ON "meeting_requests_rels" USING btree ("users_id");
  ALTER TABLE "reservations_resources_needed" ADD CONSTRAINT "reservations_resources_needed_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reservations_resources_needed_parent_idx" ON "reservations_resources_needed" USING btree ("parent_id");
  CREATE INDEX "reservations_resources_needed_order_idx" ON "reservations_resources_needed" USING btree ("order");
  ALTER TABLE "meeting_requests" DROP COLUMN "meeting_with";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "_order";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "_parent_id";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "resource";
  DROP TYPE "public"."enum_meeting_requests_meeting_with";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_meeting_requests_meeting_with" AS ENUM('pastor', 'secretaria', 'lideranca');
  ALTER TABLE "meeting_requests_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "meeting_requests_rels" CASCADE;
  ALTER TABLE "reservations_resources_needed" DROP CONSTRAINT "reservations_resources_needed_parent_fk";
  
  DROP INDEX "reservations_resources_needed_parent_idx";
  DROP INDEX "reservations_resources_needed_order_idx";
  ALTER TABLE "reservations_resources_needed" ALTER COLUMN "id" SET DATA TYPE varchar;
  ALTER TABLE "meeting_requests" ADD COLUMN "meeting_with" "enum_meeting_requests_meeting_with" DEFAULT 'pastor' NOT NULL;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "_order" integer NOT NULL;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "_parent_id" integer NOT NULL;
  ALTER TABLE "reservations_resources_needed" ADD COLUMN "resource" varchar;
  ALTER TABLE "reservations_resources_needed" ADD CONSTRAINT "reservations_resources_needed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reservations_resources_needed_parent_id_idx" ON "reservations_resources_needed" USING btree ("_parent_id");
  CREATE INDEX "reservations_resources_needed_order_idx" ON "reservations_resources_needed" USING btree ("_order");
  ALTER TABLE "meeting_requests" DROP COLUMN "modality";
  ALTER TABLE "meeting_requests" DROP COLUMN "is_all_day";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "order";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "parent_id";
  ALTER TABLE "reservations_resources_needed" DROP COLUMN "value";
  ALTER TABLE "reservations" DROP COLUMN "resource_notes";
  DROP TYPE "public"."enum_meeting_requests_modality";
  DROP TYPE "public"."enum_reservations_resources_needed";`)
}
