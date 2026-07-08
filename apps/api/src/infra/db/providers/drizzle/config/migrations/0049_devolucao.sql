CREATE SCHEMA "devolucao";
--> statement-breakpoint
CREATE TYPE "public"."demanda_devolucao_status_type" AS ENUM('rascunho', 'aberta', 'em_analise', 'em_execucao', 'concluida', 'cancelada');
--> statement-breakpoint
CREATE TYPE "public"."devolucao_nota_fiscal_tipo_type" AS ENUM('reentrega', 'devolucao_parcial', 'devolucao_total');
--> statement-breakpoint
CREATE TYPE "public"."devolucao_item_condicao_type" AS ENUM('integro', 'avariado', 'vencido', 'violado', 'nao_identificado');
--> statement-breakpoint
CREATE TABLE "devolucao"."demandas_devolucao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo_demanda" varchar(30) NOT NULL,
	"status" "demanda_devolucao_status_type" DEFAULT 'rascunho' NOT NULL,
	"aberta_por_user_id" integer,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"concluida_at" timestamp with time zone,
	CONSTRAINT "demandas_devolucao_unidade_codigo_unique" UNIQUE("unidade_id","codigo_demanda")
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_notas_fiscais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"numero_nf" varchar(20) NOT NULL,
	"chave_acesso" varchar(44),
	"tipo" "devolucao_nota_fiscal_tipo_type" NOT NULL,
	"motivo" text NOT NULL,
	"cliente" varchar(255),
	"cod_cliente" varchar(50),
	"remessa_id" uuid,
	"transporte_id" uuid,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"devolucao_nf_id" uuid NOT NULL,
	"produto_id" uuid,
	"sku" varchar(50) NOT NULL,
	"descricao_produto" varchar(500),
	"lote" varchar(100),
	"quantidade" numeric(14, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"quantidade_normalizada_unidades" numeric(14, 3) NOT NULL,
	"motivo_item" text,
	"condicao" "devolucao_item_condicao_type" DEFAULT 'integro' NOT NULL,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"status_anterior" "demanda_devolucao_status_type",
	"status_novo" "demanda_devolucao_status_type" NOT NULL,
	"descricao" text,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD CONSTRAINT "demandas_devolucao_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."demandas_devolucao" ADD CONSTRAINT "demandas_devolucao_aberta_por_user_id_users_id_fk" FOREIGN KEY ("aberta_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" ADD CONSTRAINT "devolucao_notas_fiscais_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" ADD CONSTRAINT "devolucao_notas_fiscais_remessa_id_remessas_id_fk" FOREIGN KEY ("remessa_id") REFERENCES "expedicao"."remessas"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" ADD CONSTRAINT "devolucao_notas_fiscais_transporte_id_transportes_id_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" ADD CONSTRAINT "devolucao_itens_devolucao_nf_id_devolucao_notas_fiscais_id_fk" FOREIGN KEY ("devolucao_nf_id") REFERENCES "devolucao"."devolucao_notas_fiscais"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" ADD CONSTRAINT "devolucao_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_eventos" ADD CONSTRAINT "devolucao_eventos_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_eventos" ADD CONSTRAINT "devolucao_eventos_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "demandas_devolucao_unidade_status_created_idx" ON "devolucao"."demandas_devolucao" USING btree ("unidade_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "devolucao_notas_fiscais_demanda_id_idx" ON "devolucao"."devolucao_notas_fiscais" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "devolucao_notas_fiscais_numero_nf_idx" ON "devolucao"."devolucao_notas_fiscais" USING btree ("numero_nf");
--> statement-breakpoint
CREATE UNIQUE INDEX "devolucao_notas_fiscais_chave_acesso_unique_idx" ON "devolucao"."devolucao_notas_fiscais" USING btree ("chave_acesso") WHERE "chave_acesso" is not null;
--> statement-breakpoint
CREATE INDEX "devolucao_itens_devolucao_nf_id_idx" ON "devolucao"."devolucao_itens" USING btree ("devolucao_nf_id");
--> statement-breakpoint
CREATE INDEX "devolucao_itens_produto_id_idx" ON "devolucao"."devolucao_itens" USING btree ("produto_id");
--> statement-breakpoint
CREATE INDEX "devolucao_itens_sku_idx" ON "devolucao"."devolucao_itens" USING btree ("sku");
--> statement-breakpoint
CREATE INDEX "devolucao_eventos_demanda_id_idx" ON "devolucao"."devolucao_eventos" USING btree ("demanda_id");
