ALTER TABLE "expedicao"."remessa_itens" ADD COLUMN IF NOT EXISTS "data_fabricacao" date;--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" ADD COLUMN IF NOT EXISTS "faixa" varchar(50);
