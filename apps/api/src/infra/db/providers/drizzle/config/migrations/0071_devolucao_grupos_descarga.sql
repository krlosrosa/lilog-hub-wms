CREATE TYPE "devolucao"."devolucao_grupo_descarga_status_type" AS ENUM(
  'rascunho',
  'aguardando_conferencia',
  'em_conferencia',
  'conferida',
  'concluida',
  'cancelada'
);
--> statement-breakpoint
CREATE TYPE "devolucao"."devolucao_item_nao_contabil_status_type" AS ENUM(
  'pendente',
  'conciliado',
  'descartado',
  'gerou_ocorrencia'
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_grupos_descarga" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "unidade_id" varchar(50) NOT NULL,
  "codigo_grupo" varchar(30) NOT NULL,
  "placa_descarga" varchar(20) NOT NULL,
  "doca" varchar(100),
  "carga_segregada" boolean DEFAULT false NOT NULL,
  "paletes_esperados" integer,
  "observacao" text,
  "status" "devolucao"."devolucao_grupo_descarga_status_type" DEFAULT 'rascunho' NOT NULL,
  "criado_por_user_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "finished_at" timestamp with time zone,
  CONSTRAINT "devolucao_grupos_descarga_unidade_codigo_unique" UNIQUE("unidade_id","codigo_grupo")
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_grupo_demandas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "grupo_id" uuid NOT NULL,
  "demanda_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "devolucao_grupo_demandas_demanda_unique" UNIQUE("demanda_id")
);
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_itens_nao_contabeis" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "unidade_id" varchar(50) NOT NULL,
  "grupo_descarga_id" uuid,
  "demanda_id" uuid,
  "sku" varchar(50) NOT NULL,
  "descricao_produto" varchar(500),
  "quantidade_conferida" numeric(14, 3) NOT NULL,
  "unidade_medida" varchar(20) NOT NULL,
  "lote" varchar(100),
  "data_fabricacao" date,
  "condicao" "devolucao_item_condicao_type" DEFAULT 'nao_identificado' NOT NULL,
  "observacao" text,
  "status" "devolucao"."devolucao_item_nao_contabil_status_type" DEFAULT 'pendente' NOT NULL,
  "criado_por_user_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_grupos_descarga" ADD CONSTRAINT "devolucao_grupos_descarga_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_grupos_descarga" ADD CONSTRAINT "devolucao_grupos_descarga_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_grupo_demandas" ADD CONSTRAINT "devolucao_grupo_demandas_grupo_id_devolucao_grupos_descarga_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "devolucao"."devolucao_grupos_descarga"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_grupo_demandas" ADD CONSTRAINT "devolucao_grupo_demandas_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens_nao_contabeis" ADD CONSTRAINT "devolucao_itens_nao_contabeis_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens_nao_contabeis" ADD CONSTRAINT "devolucao_itens_nao_contabeis_grupo_descarga_id_devolucao_grupos_descarga_id_fk" FOREIGN KEY ("grupo_descarga_id") REFERENCES "devolucao"."devolucao_grupos_descarga"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens_nao_contabeis" ADD CONSTRAINT "devolucao_itens_nao_contabeis_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens_nao_contabeis" ADD CONSTRAINT "devolucao_itens_nao_contabeis_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devolucao_grupos_descarga_unidade_status_idx" ON "devolucao"."devolucao_grupos_descarga" USING btree ("unidade_id","status","created_at");
--> statement-breakpoint
CREATE INDEX "devolucao_grupo_demandas_grupo_id_idx" ON "devolucao"."devolucao_grupo_demandas" USING btree ("grupo_id");
--> statement-breakpoint
CREATE INDEX "devolucao_itens_nao_contabeis_grupo_id_idx" ON "devolucao"."devolucao_itens_nao_contabeis" USING btree ("grupo_descarga_id");
--> statement-breakpoint
CREATE INDEX "devolucao_itens_nao_contabeis_demanda_id_idx" ON "devolucao"."devolucao_itens_nao_contabeis" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "devolucao_itens_nao_contabeis_unidade_status_idx" ON "devolucao"."devolucao_itens_nao_contabeis" USING btree ("unidade_id","status");
