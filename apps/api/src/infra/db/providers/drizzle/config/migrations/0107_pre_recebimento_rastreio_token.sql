ALTER TABLE "recebimento"."pre_recebimentos"
  ADD COLUMN IF NOT EXISTS "rastreio_token" uuid DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "pre_recebimentos_rastreio_token_unique_idx"
  ON "recebimento"."pre_recebimentos" ("rastreio_token")
  WHERE "rastreio_token" IS NOT NULL;
