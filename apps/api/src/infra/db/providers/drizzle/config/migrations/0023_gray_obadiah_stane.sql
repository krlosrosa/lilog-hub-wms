CREATE TYPE "public"."sessao_pausa_tipo_type" AS ENUM('termica', 'refeicao', 'outros');--> statement-breakpoint
CREATE TABLE "sessao_operacao"."sessao_funcionario_pausas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessao_funcionario_id" uuid NOT NULL,
	"tipo" "sessao_pausa_tipo_type" NOT NULL,
	"inicio" timestamp with time zone NOT NULL,
	"fim" timestamp with time zone,
	"registrado_por_user_id" integer,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionario_pausas" ADD CONSTRAINT "sessao_funcionario_pausas_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionario_pausas" ADD CONSTRAINT "sessao_funcionario_pausas_registrado_por_user_id_users_id_fk" FOREIGN KEY ("registrado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessao_funcionario_pausas_sessao_funcionario_id_idx" ON "sessao_operacao"."sessao_funcionario_pausas" USING btree ("sessao_funcionario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessao_funcionario_pausas_um_aberto_idx" ON "sessao_operacao"."sessao_funcionario_pausas" USING btree ("sessao_funcionario_id") WHERE "sessao_operacao"."sessao_funcionario_pausas"."fim" is null;