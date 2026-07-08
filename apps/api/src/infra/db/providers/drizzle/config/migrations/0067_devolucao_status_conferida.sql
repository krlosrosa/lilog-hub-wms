ALTER TYPE "public"."demanda_devolucao_status_type" ADD VALUE IF NOT EXISTS 'conferida';
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD COLUMN IF NOT EXISTS "doca" varchar(100);
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD COLUMN IF NOT EXISTS "carga_segregada" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD COLUMN IF NOT EXISTS "paletes_esperados" integer;
