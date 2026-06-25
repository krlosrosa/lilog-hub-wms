CREATE SCHEMA "op_wms";
--> statement-breakpoint
CREATE TYPE "public"."demanda_separacao_status_type" AS ENUM('pendente', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TABLE "op_wms"."demandas_separacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"sessao_id" uuid NOT NULL,
	"mapa_grupo_id" uuid NOT NULL,
	"funcionario_id" integer NOT NULL,
	"status" "demanda_separacao_status_type" DEFAULT 'pendente' NOT NULL,
	"atribuido_por" integer,
	"atribuido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"iniciado_em" timestamp with time zone,
	"finalizado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demandas_separacao_mapa_grupo_unique" UNIQUE("mapa_grupo_id")
);
--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ADD CONSTRAINT "demandas_separacao_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ADD CONSTRAINT "demandas_separacao_sessao_id_sessoes_trabalho_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "sessao_operacao"."sessoes_trabalho"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ADD CONSTRAINT "demandas_separacao_mapa_grupo_id_mapa_grupos_id_fk" FOREIGN KEY ("mapa_grupo_id") REFERENCES "expedicao"."mapa_grupos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ADD CONSTRAINT "demandas_separacao_atribuido_por_users_id_fk" FOREIGN KEY ("atribuido_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demandas_separacao_sessao_id_idx" ON "op_wms"."demandas_separacao" USING btree ("sessao_id");--> statement-breakpoint
CREATE INDEX "demandas_separacao_funcionario_sessao_idx" ON "op_wms"."demandas_separacao" USING btree ("funcionario_id","sessao_id");--> statement-breakpoint
CREATE INDEX "demandas_separacao_unidade_id_idx" ON "op_wms"."demandas_separacao" USING btree ("unidade_id");