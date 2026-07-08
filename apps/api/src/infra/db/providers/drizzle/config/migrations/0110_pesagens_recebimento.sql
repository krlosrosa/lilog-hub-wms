DROP INDEX IF EXISTS "recebimento"."itens_recebimento_etiqueta_unidade_unique_idx";--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" DROP COLUMN IF EXISTS "etiqueta_codigo";--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recebimento"."pesagens_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_item_id" uuid NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"sequencia_caixa" integer DEFAULT 1 NOT NULL,
	"etiqueta_codigo" varchar(100),
	"peso_kg" numeric(12, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recebimento"."pesagens_recebimento" ADD CONSTRAINT "pesagens_recebimento_item_fk" FOREIGN KEY ("recebimento_item_id") REFERENCES "recebimento"."itens_recebimento"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recebimento"."pesagens_recebimento" ADD CONSTRAINT "pesagens_recebimento_unidade_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pesagens_recebimento_item_idx" ON "recebimento"."pesagens_recebimento" USING btree ("recebimento_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pesagens_recebimento_etiqueta_unidade_idx" ON "recebimento"."pesagens_recebimento" USING btree ("unidade_id","etiqueta_codigo") WHERE "etiqueta_codigo" is not null;
