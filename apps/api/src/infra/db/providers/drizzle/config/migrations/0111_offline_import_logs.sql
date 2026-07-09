CREATE TABLE IF NOT EXISTS "recebimento"."offline_import_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "export_id" varchar(64) NOT NULL,
  "demand_id" varchar(100) NOT NULL,
  "entry_key" varchar(128) NOT NULL,
  "endpoint" varchar(500) NOT NULL,
  "method" varchar(10) NOT NULL,
  "label" varchar(500) NOT NULL,
  "status" varchar(20) NOT NULL,
  "error_message" text,
  "user_id" integer,
  "applied_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "offline_import_logs_export_entry_uidx"
  ON "recebimento"."offline_import_logs" ("export_id", "entry_key");
