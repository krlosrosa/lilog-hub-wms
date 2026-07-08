ALTER TABLE "recebimento"."pre_recebimentos"
  ADD COLUMN IF NOT EXISTS "doca_id" uuid DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos"
  ADD CONSTRAINT "pre_recebimentos_doca_id_docas_id_fk"
  FOREIGN KEY ("doca_id") REFERENCES "doca"."docas"("id")
  ON DELETE set null ON UPDATE no action;
