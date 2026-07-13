CREATE TYPE "recebimento"."recebimento_alocacao_status_type" AS ENUM('atribuida', 'iniciada', 'cancelada');

CREATE TABLE "recebimento"."alocacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pre_recebimento_id" uuid NOT NULL,
	"sessao_id" uuid NOT NULL,
	"sessao_funcionario_id" uuid NOT NULL,
	"funcionario_id" integer NOT NULL,
	"status" "recebimento"."recebimento_alocacao_status_type" NOT NULL DEFAULT 'atribuida',
	"atribuido_por_user_id" integer,
	"atribuido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"inicio_em" timestamp with time zone,
	"cancelado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "recebimento"."alocacoes" ADD CONSTRAINT "alocacoes_pre_recebimento_id_pre_recebimentos_id_fk" FOREIGN KEY ("pre_recebimento_id") REFERENCES "recebimento"."pre_recebimentos"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recebimento"."alocacoes" ADD CONSTRAINT "alocacoes_sessao_id_sessoes_trabalho_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "sessao_operacao"."sessoes_trabalho"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "recebimento"."alocacoes" ADD CONSTRAINT "alocacoes_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "recebimento"."alocacoes" ADD CONSTRAINT "alocacoes_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "auth"."funcionarios"("id") ON DELETE restrict ON UPDATE no action;

CREATE UNIQUE INDEX "alocacoes_pre_recebimento_ativa_idx" ON "recebimento"."alocacoes" USING btree ("pre_recebimento_id") WHERE "recebimento"."alocacoes"."status" = 'atribuida';
CREATE INDEX "alocacoes_sessao_id_idx" ON "recebimento"."alocacoes" USING btree ("sessao_id");
CREATE INDEX "alocacoes_sessao_funcionario_id_idx" ON "recebimento"."alocacoes" USING btree ("sessao_funcionario_id");
