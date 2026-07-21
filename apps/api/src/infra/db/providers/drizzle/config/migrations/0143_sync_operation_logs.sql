CREATE TABLE IF NOT EXISTS "sync"."sync_operation_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "sync"."sync_batches"("id") ON DELETE CASCADE,
  "op_id" varchar(128) NOT NULL,
  "op_type" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL,
  "started_at" timestamptz NOT NULL,
  "finished_at" timestamptz NOT NULL,
  "duration_ms" integer NOT NULL DEFAULT 0,
  "attempt" integer NOT NULL DEFAULT 1,
  "error_message" text,
  "response" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_operation_logs_batch_idx"
  ON "sync"."sync_operation_logs" ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_operation_logs_op_idx"
  ON "sync"."sync_operation_logs" ("op_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_operation_logs_created_at_idx"
  ON "sync"."sync_operation_logs" ("created_at");
