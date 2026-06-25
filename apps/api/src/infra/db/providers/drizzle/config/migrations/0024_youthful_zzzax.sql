CREATE SCHEMA "operacional";
--> statement-breakpoint
CREATE TABLE "operacional"."configuracoes_operacionais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"dominio" varchar(50) NOT NULL,
	"categoria" varchar(50) NOT NULL,
	"subtipo" varchar(50) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"descricao" text,
	"parametros" jsonb NOT NULL,
	"versao_schema" smallint DEFAULT 1 NOT NULL,
	"is_padrao" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "config_operacionais_unidade_dominio_categoria_subtipo_nome_unique" UNIQUE("unidade_id","dominio","categoria","subtipo","nome")
);
--> statement-breakpoint
ALTER TABLE "operacional"."configuracoes_operacionais" ADD CONSTRAINT "configuracoes_operacionais_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operacional"."configuracoes_operacionais" ADD CONSTRAINT "configuracoes_operacionais_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "config_operacionais_padrao_unique_idx" ON "operacional"."configuracoes_operacionais" USING btree ("unidade_id","dominio","categoria","subtipo") WHERE "operacional"."configuracoes_operacionais"."is_padrao" = true;