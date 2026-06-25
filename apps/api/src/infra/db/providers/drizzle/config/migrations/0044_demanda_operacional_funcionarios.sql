CREATE TYPE "public"."demanda_funcionario_papel_type" AS ENUM('responsavel', 'auxiliar');--> statement-breakpoint
CREATE TABLE "op_wms"."demanda_operacional_funcionarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"sessao_funcionario_id" uuid NOT NULL,
	"papel" "demanda_funcionario_papel_type" DEFAULT 'auxiliar' NOT NULL,
	"entrou_em" timestamp with time zone DEFAULT now() NOT NULL,
	"saiu_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demanda_oper_func_unique" UNIQUE("demanda_id","sessao_funcionario_id")
);
--> statement-breakpoint
ALTER TABLE "op_wms"."demanda_operacional_funcionarios" ADD CONSTRAINT "demanda_operacional_funcionarios_demanda_id_demandas_separacao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "op_wms"."demandas_separacao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "op_wms"."demanda_operacional_funcionarios" ADD CONSTRAINT "demanda_operacional_funcionarios_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demanda_oper_func_demanda_id_idx" ON "op_wms"."demanda_operacional_funcionarios" USING btree ("demanda_id");
