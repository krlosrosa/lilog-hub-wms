ALTER TABLE "expedicao"."transportes" ADD COLUMN "doca_id" uuid;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "lacre_carregamento" varchar(100);--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD CONSTRAINT "transportes_doca_id_docas_id_fk" FOREIGN KEY ("doca_id") REFERENCES "doca"."docas"("id") ON DELETE set null ON UPDATE no action;
