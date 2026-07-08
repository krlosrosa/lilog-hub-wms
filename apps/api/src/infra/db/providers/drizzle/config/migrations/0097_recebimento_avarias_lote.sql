ALTER TABLE "recebimento"."recebimento_avarias" ADD COLUMN IF NOT EXISTS "lote" varchar(100);
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD COLUMN IF NOT EXISTS "validade" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD COLUMN IF NOT EXISTS "numero_serie" varchar(100);
