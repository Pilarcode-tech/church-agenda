import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('pastor', 'secretaria', 'lider');
  CREATE TYPE "public"."enum_spaces_type" AS ENUM('templo', 'sala', 'salao', 'estudio');
  CREATE TYPE "public"."enum_pastor_schedule_type" AS ENUM('reuniao', 'aconselhamento', 'pregacao', 'viagem', 'pessoal', 'bloqueio');
  CREATE TYPE "public"."enum_meeting_requests_status" AS ENUM('pendente', 'aprovado', 'recusado', 'reagendado');
  CREATE TYPE "public"."enum_reservations_event_type" AS ENUM('reuniao', 'evento', 'ensaio', 'gravacao', 'culto_especial', 'outro');
  CREATE TYPE "public"."enum_reservations_status" AS ENUM('pendente', 'aprovado', 'recusado', 'cancelado');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_users_role" DEFAULT 'lider' NOT NULL,
  	"ministerio" varchar,
  	"phone" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "spaces_resources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"resource" varchar
  );
  
  CREATE TABLE "spaces" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_spaces_type" NOT NULL,
  	"capacity" numeric,
  	"requires_approval" boolean DEFAULT false,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pastor_schedule" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"type" "enum_pastor_schedule_type" NOT NULL,
  	"start_date_time" timestamp(3) with time zone NOT NULL,
  	"end_date_time" timestamp(3) with time zone NOT NULL,
  	"is_public" boolean DEFAULT false,
  	"notes" varchar,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "meeting_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"requested_by_id" integer NOT NULL,
  	"reason" varchar NOT NULL,
  	"estimated_duration" numeric DEFAULT 30,
  	"suggested_date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_meeting_requests_status" DEFAULT 'pendente' NOT NULL,
  	"confirmed_date_time" timestamp(3) with time zone,
  	"response_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reservations_resources_needed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"resource" varchar
  );
  
  CREATE TABLE "reservations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"space_id" integer NOT NULL,
  	"requested_by_id" integer NOT NULL,
  	"event_type" "enum_reservations_event_type" NOT NULL,
  	"start_date_time" timestamp(3) with time zone NOT NULL,
  	"end_date_time" timestamp(3) with time zone NOT NULL,
  	"attendees_count" numeric,
  	"status" "enum_reservations_status" DEFAULT 'pendente' NOT NULL,
  	"response_note" varchar,
  	"approved_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"spaces_id" integer,
  	"pastor_schedule_id" integer,
  	"meeting_requests_id" integer,
  	"reservations_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "church_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"church_name" varchar DEFAULT 'Igreja Verbo da Vida',
  	"available_hours_start" varchar DEFAULT '08:00',
  	"available_hours_end" varchar DEFAULT '22:00',
  	"advance_booking_days" numeric DEFAULT 1,
  	"cancelation_deadline_hours" numeric DEFAULT 24,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "spaces_resources" ADD CONSTRAINT "spaces_resources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pastor_schedule" ADD CONSTRAINT "pastor_schedule_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations_resources_needed" ADD CONSTRAINT "reservations_resources_needed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spaces_fk" FOREIGN KEY ("spaces_id") REFERENCES "public"."spaces"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pastor_schedule_fk" FOREIGN KEY ("pastor_schedule_id") REFERENCES "public"."pastor_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_meeting_requests_fk" FOREIGN KEY ("meeting_requests_id") REFERENCES "public"."meeting_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservations_fk" FOREIGN KEY ("reservations_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "spaces_resources_order_idx" ON "spaces_resources" USING btree ("_order");
  CREATE INDEX "spaces_resources_parent_id_idx" ON "spaces_resources" USING btree ("_parent_id");
  CREATE INDEX "spaces_updated_at_idx" ON "spaces" USING btree ("updated_at");
  CREATE INDEX "spaces_created_at_idx" ON "spaces" USING btree ("created_at");
  CREATE INDEX "pastor_schedule_created_by_idx" ON "pastor_schedule" USING btree ("created_by_id");
  CREATE INDEX "pastor_schedule_updated_at_idx" ON "pastor_schedule" USING btree ("updated_at");
  CREATE INDEX "pastor_schedule_created_at_idx" ON "pastor_schedule" USING btree ("created_at");
  CREATE INDEX "meeting_requests_requested_by_idx" ON "meeting_requests" USING btree ("requested_by_id");
  CREATE INDEX "meeting_requests_updated_at_idx" ON "meeting_requests" USING btree ("updated_at");
  CREATE INDEX "meeting_requests_created_at_idx" ON "meeting_requests" USING btree ("created_at");
  CREATE INDEX "reservations_resources_needed_order_idx" ON "reservations_resources_needed" USING btree ("_order");
  CREATE INDEX "reservations_resources_needed_parent_id_idx" ON "reservations_resources_needed" USING btree ("_parent_id");
  CREATE INDEX "reservations_space_idx" ON "reservations" USING btree ("space_id");
  CREATE INDEX "reservations_requested_by_idx" ON "reservations" USING btree ("requested_by_id");
  CREATE INDEX "reservations_approved_by_idx" ON "reservations" USING btree ("approved_by_id");
  CREATE INDEX "reservations_updated_at_idx" ON "reservations" USING btree ("updated_at");
  CREATE INDEX "reservations_created_at_idx" ON "reservations" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_spaces_id_idx" ON "payload_locked_documents_rels" USING btree ("spaces_id");
  CREATE INDEX "payload_locked_documents_rels_pastor_schedule_id_idx" ON "payload_locked_documents_rels" USING btree ("pastor_schedule_id");
  CREATE INDEX "payload_locked_documents_rels_meeting_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("meeting_requests_id");
  CREATE INDEX "payload_locked_documents_rels_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("reservations_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "spaces_resources" CASCADE;
  DROP TABLE "spaces" CASCADE;
  DROP TABLE "pastor_schedule" CASCADE;
  DROP TABLE "meeting_requests" CASCADE;
  DROP TABLE "reservations_resources_needed" CASCADE;
  DROP TABLE "reservations" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "church_settings" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_spaces_type";
  DROP TYPE "public"."enum_pastor_schedule_type";
  DROP TYPE "public"."enum_meeting_requests_status";
  DROP TYPE "public"."enum_reservations_event_type";
  DROP TYPE "public"."enum_reservations_status";`)
}
