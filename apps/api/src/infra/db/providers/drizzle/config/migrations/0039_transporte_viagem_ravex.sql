ALTER TABLE "expedicao"."transportes" ADD COLUMN "viagem_id" integer;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "viagem_inicio_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "viagem_fim_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "anomalia" varchar(500);
