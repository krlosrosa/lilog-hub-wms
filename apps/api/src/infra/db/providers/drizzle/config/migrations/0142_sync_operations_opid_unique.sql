CREATE UNIQUE INDEX IF NOT EXISTS "sync_operations_op_uidx"
  ON "sync"."sync_operations" ("op_id");
