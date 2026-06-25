CREATE SCHEMA "sessao_operacao";
--> statement-breakpoint
CREATE TYPE "public"."sessao_presenca_status_type" AS ENUM('esperado', 'presente', 'falta', 'atestado', 'folga', 'atraso');--> statement-breakpoint
CREATE TYPE "public"."sessao_trabalho_status_type" AS ENUM('planejada', 'aberta', 'encerrada', 'cancelada');--> statement-breakpoint
CREATE TABLE "sessao_operacao"."equipe_funcionarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"funcionario_id" integer NOT NULL,
	"vigencia_inicio" date,
	"vigencia_fim" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipe_funcionarios_equipe_funcionario_unique" UNIQUE("equipe_id","funcionario_id")
);
--> statement-breakpoint
CREATE TABLE "sessao_operacao"."equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"lider_user_id" integer,
	"area" varchar(50),
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipes_unidade_nome_unique" UNIQUE("unidade_id","nome")
);
--> statement-breakpoint
CREATE TABLE "sessao_operacao"."escalas_trabalho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"equipe_id" uuid NOT NULL,
	"nome" varchar(100) NOT NULL,
	"hora_inicio_planejada" time NOT NULL,
	"hora_fim_planejada" time NOT NULL,
	"cruza_meia_noite" boolean NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "escalas_trabalho_equipe_nome_unique" UNIQUE("equipe_id","nome")
);
--> statement-breakpoint
CREATE TABLE "sessao_operacao"."sessao_funcionarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessao_id" uuid NOT NULL,
	"funcionario_id" integer NOT NULL,
	"status" "sessao_presenca_status_type" DEFAULT 'esperado' NOT NULL,
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	"registrado_por_user_id" integer,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessao_funcionarios_sessao_funcionario_unique" UNIQUE("sessao_id","funcionario_id")
);
--> statement-breakpoint
CREATE TABLE "sessao_operacao"."sessoes_trabalho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"escala_id" uuid NOT NULL,
	"equipe_id" uuid NOT NULL,
	"data_referencia" date NOT NULL,
	"inicio_planejado" timestamp with time zone NOT NULL,
	"fim_planejado" timestamp with time zone NOT NULL,
	"inicio_real" timestamp with time zone,
	"fim_real" timestamp with time zone,
	"status" "sessao_trabalho_status_type" DEFAULT 'planejada' NOT NULL,
	"aberta_por_user_id" integer,
	"encerrada_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessoes_trabalho_escala_data_referencia_unique" UNIQUE("escala_id","data_referencia")
);
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."equipe_funcionarios" ADD CONSTRAINT "equipe_funcionarios_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "sessao_operacao"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."equipe_funcionarios" ADD CONSTRAINT "equipe_funcionarios_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "auth"."funcionarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."equipes" ADD CONSTRAINT "equipes_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."equipes" ADD CONSTRAINT "equipes_lider_user_id_users_id_fk" FOREIGN KEY ("lider_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."escalas_trabalho" ADD CONSTRAINT "escalas_trabalho_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."escalas_trabalho" ADD CONSTRAINT "escalas_trabalho_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "sessao_operacao"."equipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_sessao_id_sessoes_trabalho_id_fk" FOREIGN KEY ("sessao_id") REFERENCES "sessao_operacao"."sessoes_trabalho"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "auth"."funcionarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_registrado_por_user_id_users_id_fk" FOREIGN KEY ("registrado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessoes_trabalho" ADD CONSTRAINT "sessoes_trabalho_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessoes_trabalho" ADD CONSTRAINT "sessoes_trabalho_escala_id_escalas_trabalho_id_fk" FOREIGN KEY ("escala_id") REFERENCES "sessao_operacao"."escalas_trabalho"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessoes_trabalho" ADD CONSTRAINT "sessoes_trabalho_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "sessao_operacao"."equipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessoes_trabalho" ADD CONSTRAINT "sessoes_trabalho_aberta_por_user_id_users_id_fk" FOREIGN KEY ("aberta_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessoes_trabalho" ADD CONSTRAINT "sessoes_trabalho_encerrada_por_user_id_users_id_fk" FOREIGN KEY ("encerrada_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipe_funcionarios_funcionario_id_idx" ON "sessao_operacao"."equipe_funcionarios" USING btree ("funcionario_id");--> statement-breakpoint
CREATE INDEX "sessoes_trabalho_unidade_data_status_idx" ON "sessao_operacao"."sessoes_trabalho" USING btree ("unidade_id","data_referencia","status");--> statement-breakpoint
CREATE INDEX "sessoes_trabalho_equipe_data_idx" ON "sessao_operacao"."sessoes_trabalho" USING btree ("equipe_id","data_referencia");