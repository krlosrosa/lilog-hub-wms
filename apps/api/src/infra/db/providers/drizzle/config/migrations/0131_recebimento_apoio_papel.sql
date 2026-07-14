CREATE TYPE "recebimento"."recebimento_alocacao_papel_type" AS ENUM('responsavel', 'apoio');--> statement-breakpoint
ALTER TABLE "recebimento"."alocacoes" ADD COLUMN "papel" "recebimento"."recebimento_alocacao_papel_type" DEFAULT 'responsavel' NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "recebimento"."alocacoes_pre_recebimento_ativa_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "alocacoes_pre_recebimento_responsavel_ativa_idx" ON "recebimento"."alocacoes" USING btree ("pre_recebimento_id") WHERE "recebimento"."alocacoes"."status" = 'atribuida' AND "recebimento"."alocacoes"."papel" = 'responsavel';--> statement-breakpoint
CREATE UNIQUE INDEX "alocacoes_pre_recebimento_apoio_ativo_idx" ON "recebimento"."alocacoes" USING btree ("pre_recebimento_id","funcionario_id") WHERE "recebimento"."alocacoes"."papel" = 'apoio' AND "recebimento"."alocacoes"."status" in ('atribuida', 'iniciada');--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN "conferido_por_id" integer;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_conferido_por_id_funcionarios_id_fk" FOREIGN KEY ("conferido_por_id") REFERENCES "auth"."funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."pesagens_recebimento" ADD COLUMN "conferido_por_id" integer;--> statement-breakpoint
ALTER TABLE "recebimento"."pesagens_recebimento" ADD CONSTRAINT "pesagens_recebimento_conferido_por_id_funcionarios_id_fk" FOREIGN KEY ("conferido_por_id") REFERENCES "auth"."funcionarios"("id") ON DELETE set null ON UPDATE no action;
