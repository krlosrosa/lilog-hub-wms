CREATE SCHEMA IF NOT EXISTS "cobranca_transportadora";
--> statement-breakpoint
CREATE TYPE "public"."processo_debito_status_type" AS ENUM('aberto', 'em_analise', 'aprovado', 'incluido_em_documento', 'cancelado');
--> statement-breakpoint
CREATE TYPE "public"."debito_item_tipo_type" AS ENUM('falta', 'avaria');
--> statement-breakpoint
CREATE TYPE "public"."debito_item_status_type" AS ENUM('pendente', 'aprovado', 'rejeitado');
--> statement-breakpoint
CREATE TYPE "public"."documento_cobranca_status_type" AS ENUM('rascunho', 'emitido', 'enviado', 'pago', 'cancelado');
--> statement-breakpoint
CREATE TYPE "public"."cobranca_evento_entidade_tipo_type" AS ENUM('processo', 'documento');
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."processos_debito" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"demanda_id" uuid NOT NULL,
	"transporte_id" varchar(100),
	"transportadora_id" uuid,
	"transportadora_nome" varchar(255),
	"status" "processo_debito_status_type" DEFAULT 'aberto' NOT NULL,
	"valor_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"quantidade_itens" integer DEFAULT 0 NOT NULL,
	"observacao" text,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processos_debito_demanda_id_unique" UNIQUE("demanda_id")
);
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."processo_debito_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_debito_id" uuid NOT NULL,
	"demanda_id" uuid NOT NULL,
	"nota_fiscal_id" uuid,
	"item_id" uuid,
	"avaria_id" uuid,
	"falta_peso_id" uuid,
	"tipo" "debito_item_tipo_type" NOT NULL,
	"sku" varchar(50),
	"descricao_produto" varchar(500),
	"quantidade" numeric(14, 3),
	"peso_kg" numeric(10, 3),
	"valor_unitario" numeric(12, 2),
	"valor_debito" numeric(12, 2) DEFAULT '0' NOT NULL,
	"motivo" text,
	"observacao" text,
	"status" "debito_item_status_type" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."documentos_cobranca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"numero_documento" varchar(50) NOT NULL,
	"transportadora_id" uuid,
	"transportadora_nome" varchar(255) NOT NULL,
	"status" "documento_cobranca_status_type" DEFAULT 'rascunho' NOT NULL,
	"valor_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"quantidade_processos" integer DEFAULT 0 NOT NULL,
	"quantidade_itens" integer DEFAULT 0 NOT NULL,
	"emitido_por_user_id" integer,
	"emitido_em" timestamp with time zone,
	"enviado_em" timestamp with time zone,
	"pago_em" timestamp with time zone,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documentos_cobranca_unidade_numero_unique" UNIQUE("unidade_id","numero_documento")
);
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."documento_cobranca_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_cobranca_id" uuid NOT NULL,
	"processo_debito_id" uuid NOT NULL,
	"processo_debito_item_id" uuid NOT NULL,
	"valor_debito" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documento_cobranca_itens_doc_item_unique" UNIQUE("documento_cobranca_id","processo_debito_item_id")
);
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."cobranca_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidade_tipo" "cobranca_evento_entidade_tipo_type" NOT NULL,
	"entidade_id" uuid NOT NULL,
	"status_anterior" varchar(50),
	"status_novo" varchar(50) NOT NULL,
	"descricao" text,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processos_debito" ADD CONSTRAINT "processos_debito_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processos_debito" ADD CONSTRAINT "processos_debito_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processos_debito" ADD CONSTRAINT "processos_debito_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processos_debito" ADD CONSTRAINT "processos_debito_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens" ADD CONSTRAINT "processo_debito_itens_processo_debito_id_processos_debito_id_fk" FOREIGN KEY ("processo_debito_id") REFERENCES "cobranca_transportadora"."processos_debito"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens" ADD CONSTRAINT "processo_debito_itens_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens" ADD CONSTRAINT "processo_debito_itens_item_id_devolucao_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "devolucao"."devolucao_itens"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens" ADD CONSTRAINT "processo_debito_itens_avaria_id_devolucao_avarias_id_fk" FOREIGN KEY ("avaria_id") REFERENCES "devolucao"."devolucao_avarias"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens" ADD CONSTRAINT "processo_debito_itens_falta_peso_id_devolucao_faltas_peso_id_fk" FOREIGN KEY ("falta_peso_id") REFERENCES "devolucao"."devolucao_faltas_peso"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documentos_cobranca" ADD CONSTRAINT "documentos_cobranca_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documentos_cobranca" ADD CONSTRAINT "documentos_cobranca_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documentos_cobranca" ADD CONSTRAINT "documentos_cobranca_emitido_por_user_id_users_id_fk" FOREIGN KEY ("emitido_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documento_cobranca_itens" ADD CONSTRAINT "documento_cobranca_itens_documento_cobranca_id_documentos_cobranca_id_fk" FOREIGN KEY ("documento_cobranca_id") REFERENCES "cobranca_transportadora"."documentos_cobranca"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documento_cobranca_itens" ADD CONSTRAINT "documento_cobranca_itens_processo_debito_id_processos_debito_id_fk" FOREIGN KEY ("processo_debito_id") REFERENCES "cobranca_transportadora"."processos_debito"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."documento_cobranca_itens" ADD CONSTRAINT "documento_cobranca_itens_processo_debito_item_id_processo_debito_itens_id_fk" FOREIGN KEY ("processo_debito_item_id") REFERENCES "cobranca_transportadora"."processo_debito_itens"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."cobranca_eventos" ADD CONSTRAINT "cobranca_eventos_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "processos_debito_unidade_status_idx" ON "cobranca_transportadora"."processos_debito" USING btree ("unidade_id","status");
--> statement-breakpoint
CREATE INDEX "processos_debito_transportadora_id_idx" ON "cobranca_transportadora"."processos_debito" USING btree ("transportadora_id");
--> statement-breakpoint
CREATE INDEX "processo_debito_itens_processo_id_idx" ON "cobranca_transportadora"."processo_debito_itens" USING btree ("processo_debito_id");
--> statement-breakpoint
CREATE INDEX "processo_debito_itens_demanda_id_idx" ON "cobranca_transportadora"."processo_debito_itens" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "documentos_cobranca_unidade_status_idx" ON "cobranca_transportadora"."documentos_cobranca" USING btree ("unidade_id","status");
--> statement-breakpoint
CREATE INDEX "documento_cobranca_itens_documento_id_idx" ON "cobranca_transportadora"."documento_cobranca_itens" USING btree ("documento_cobranca_id");
--> statement-breakpoint
CREATE INDEX "cobranca_eventos_entidade_idx" ON "cobranca_transportadora"."cobranca_eventos" USING btree ("entidade_tipo","entidade_id");
