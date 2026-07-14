ALTER TYPE "recebimento"."recebimento_alocacao_status_type" ADD VALUE IF NOT EXISTS 'encerrada';--> statement-breakpoint
ALTER TABLE "recebimento"."alocacoes" ADD COLUMN IF NOT EXISTS "encerrado_em" timestamp with time zone;
