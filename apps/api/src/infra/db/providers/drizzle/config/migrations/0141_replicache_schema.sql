CREATE SCHEMA IF NOT EXISTS "replicache";

CREATE TABLE IF NOT EXISTS "replicache"."spaces" (
  "space_id" varchar(50) PRIMARY KEY NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "replicache"."clients" (
  "client_id" varchar(100) PRIMARY KEY NOT NULL,
  "client_group_id" varchar(100) NOT NULL,
  "last_mutation_id" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "replicache_clients_group_idx"
  ON "replicache"."clients" ("client_group_id");

CREATE TABLE IF NOT EXISTS "replicache"."changes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "space_id" varchar(50) NOT NULL,
  "version" integer NOT NULL,
  "key" varchar(255) NOT NULL,
  "op" varchar(10) NOT NULL,
  "value" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "replicache_changes_space_version_idx"
  ON "replicache"."changes" ("space_id", "version");
