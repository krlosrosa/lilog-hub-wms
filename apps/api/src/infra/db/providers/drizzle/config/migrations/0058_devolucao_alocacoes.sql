CREATE TYPE "public"."devolucao_alocacao_funcao_type" AS ENUM('lider', 'conferente', 'auxiliar');
--> statement-breakpoint
CREATE TYPE "public"."devolucao_alocacao_status_type" AS ENUM('em_andamento', 'concluida', 'cancelada');
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD COLUMN IF NOT EXISTS "responsavel_operacao_id" integer;
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_alocacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"sessao_id" uuid NOT NULL,
	"sessao_funcionario_id" uuid NOT NULL,
	"funcao" "devolucao_alocacao_funcao_type" DEFAULT 'conferente' NOT NULL,
	"status" "devolucao_alocacao_status_type" DEFAULT 'em_andamento' NOT NULL,
	"atribuido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"inicio_em" timestamp with time zone,
	"fim_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD CONSTRAINT "demandas_devolucao_responsavel_operacao_id_users_id_fk" FOREIGN KEY ("responsavel_operacao_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_alocacoes" ADD CONSTRAINT "devolucao_alocacoes_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_alocacoes" ADD CONSTRAINT "devolucao_alocacoes_sessao_id_sessoes_trabalho_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "sessao_operacao"."sessoes_trabalho"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_alocacoes" ADD CONSTRAINT "devolucao_alocacoes_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devolucao_alocacoes_demanda_id_idx" ON "devolucao"."devolucao_alocacoes" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "devolucao_alocacoes_sessao_func_idx" ON "devolucao"."devolucao_alocacoes" USING btree ("sessao_id","sessao_funcionario_id");
