ALTER TYPE "public"."pre_recebimento_situacao_type" ADD VALUE IF NOT EXISTS 'aguardando';--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos"
  ADD COLUMN IF NOT EXISTS "motorista_nome" varchar(255),
  ADD COLUMN IF NOT EXISTS "motorista_telefone" varchar(20),
  ADD COLUMN IF NOT EXISTS "grau_prioridade" varchar(20);
