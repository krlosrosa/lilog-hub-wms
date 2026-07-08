ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN IF NOT EXISTS "unidade_id" varchar(50);--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN IF NOT EXISTS "etiqueta_codigo" varchar(100);--> statement-breakpoint
UPDATE recebimento.itens_recebimento ir
SET unidade_id = pr.unidade_id
FROM recebimento.recebimentos r
JOIN recebimento.pre_recebimentos pr ON pr.id = r.pre_recebimento_id
WHERE r.id = ir.recebimento_id AND ir.unidade_id IS NULL;--> statement-breakpoint
DELETE FROM recebimento.itens_recebimento ir
WHERE ir.unidade_id IS NULL;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ALTER COLUMN "unidade_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "itens_recebimento_unidade_id_idx" ON "recebimento"."itens_recebimento" USING btree ("unidade_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "itens_recebimento_etiqueta_unidade_unique_idx" ON "recebimento"."itens_recebimento" USING btree ("unidade_id","etiqueta_codigo") WHERE "etiqueta_codigo" is not null;
