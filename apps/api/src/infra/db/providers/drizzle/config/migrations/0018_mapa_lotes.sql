CREATE TYPE "public"."mapa_grupo_etapa_type" AS ENUM('separacao', 'carregamento', 'conferencia');--> statement-breakpoint
CREATE TYPE "public"."mapa_grupo_etapa_status_type" AS ENUM('pendente', 'em_andamento', 'concluido', 'cancelado');--> statement-breakpoint
CREATE TABLE "expedicao"."mapa_lotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"config" jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"resumo" jsonb NOT NULL,
	"configuracao_impressao_id" uuid,
	"templates_html" jsonb,
	"criado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "expedicao"."mapa_lote_transportes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mapa_lote_id" uuid NOT NULL,
	"transporte_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mapa_lote_transportes_lote_transporte_unique" UNIQUE("mapa_lote_id","transporte_id")
);--> statement-breakpoint
CREATE TABLE "expedicao"."mapa_grupos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mapa_lote_id" uuid NOT NULL,
	"micro_uuid" varchar(120) NOT NULL,
	"transporte_id" uuid NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"subtitulo" varchar(255),
	"cabecalho" jsonb NOT NULL,
	"total_itens" integer NOT NULL,
	"peso_total" numeric(12, 3) NOT NULL,
	"sequencia" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mapa_grupos_micro_uuid_unique" UNIQUE("micro_uuid")
);--> statement-breakpoint
CREATE TABLE "expedicao"."mapa_grupo_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mapa_grupo_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"remessa" varchar(100) NOT NULL,
	"cliente" varchar(255) NOT NULL,
	"cod_cliente" varchar(50) NOT NULL,
	"empresa" varchar(100) NOT NULL,
	"categoria" varchar(100) NOT NULL,
	"lote" varchar(100),
	"data_fabricacao" date,
	"faixa" varchar(50),
	"quantidade" numeric(14, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"quantidade_normalizada_unidades" numeric(14, 3) NOT NULL,
	"peso" numeric(10, 3),
	"quebra_palete" boolean DEFAULT false NOT NULL,
	"breakdown" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "expedicao"."mapa_grupo_etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mapa_grupo_id" uuid NOT NULL,
	"etapa" "mapa_grupo_etapa_type" NOT NULL,
	"status" "mapa_grupo_etapa_status_type" DEFAULT 'pendente' NOT NULL,
	"iniciado_em" timestamp with time zone,
	"finalizado_em" timestamp with time zone,
	"iniciado_por" integer,
	"finalizado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mapa_grupo_etapas_grupo_etapa_unique" UNIQUE("mapa_grupo_id","etapa")
);--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "mapa_gerado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN "ultimo_mapa_lote_id" uuid;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lotes" ADD CONSTRAINT "mapa_lotes_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lotes" ADD CONSTRAINT "mapa_lotes_configuracao_impressao_id_configuracoes_impressao_id_fk" FOREIGN KEY ("configuracao_impressao_id") REFERENCES "expedicao"."configuracoes_impressao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lotes" ADD CONSTRAINT "mapa_lotes_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" ADD CONSTRAINT "mapa_lote_transportes_mapa_lote_id_mapa_lotes_id_fk" FOREIGN KEY ("mapa_lote_id") REFERENCES "expedicao"."mapa_lotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" ADD CONSTRAINT "mapa_lote_transportes_transporte_id_transportes_id_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_mapa_lote_id_mapa_lotes_id_fk" FOREIGN KEY ("mapa_lote_id") REFERENCES "expedicao"."mapa_lotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_transporte_id_transportes_id_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupo_itens" ADD CONSTRAINT "mapa_grupo_itens_mapa_grupo_id_mapa_grupos_id_fk" FOREIGN KEY ("mapa_grupo_id") REFERENCES "expedicao"."mapa_grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupo_etapas" ADD CONSTRAINT "mapa_grupo_etapas_mapa_grupo_id_mapa_grupos_id_fk" FOREIGN KEY ("mapa_grupo_id") REFERENCES "expedicao"."mapa_grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupo_etapas" ADD CONSTRAINT "mapa_grupo_etapas_iniciado_por_users_id_fk" FOREIGN KEY ("iniciado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupo_etapas" ADD CONSTRAINT "mapa_grupo_etapas_finalizado_por_users_id_fk" FOREIGN KEY ("finalizado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD CONSTRAINT "transportes_ultimo_mapa_lote_id_mapa_lotes_id_fk" FOREIGN KEY ("ultimo_mapa_lote_id") REFERENCES "expedicao"."mapa_lotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mapa_lotes_unidade_created_at_idx" ON "expedicao"."mapa_lotes" USING btree ("unidade_id","created_at" DESC);--> statement-breakpoint
CREATE INDEX "mapa_lote_transportes_transporte_id_idx" ON "expedicao"."mapa_lote_transportes" USING btree ("transporte_id");--> statement-breakpoint
CREATE INDEX "mapa_grupos_micro_uuid_idx" ON "expedicao"."mapa_grupos" USING btree ("micro_uuid");--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_transportes";--> statement-breakpoint
CREATE VIEW "expedicao"."vw_transportes" AS
SELECT
  t.id,
  t.unidade_id,
  t.upload_lote_id,
  t.rota,
  t.regiao,
  t.cidade,
  t.bairro,
  t.data_transporte,
  t.horario_expectativa_saida,
  t.peso_total,
  t.volume_total,
  t.distancia_km,
  t.dias_alocacao,
  t.perfil_esperado,
  t.status,
  t.placa,
  t.motorista,
  t.transportadora,
  t.perfil_pagamento_id,
  t.perfil_pagamento_nome,
  t.custo_previsto,
  t.frete_sem_custo,
  t.reentrega_exclusiva,
  t.mapa_gerado_em,
  t.ultimo_mapa_lote_id,
  t.created_at,
  t.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', r.id,
        'remessa', r.remessa,
        'empresa', r.empresa,
        'codCliente', r.cod_cliente,
        'cliente', r.cliente,
        'cidade', r.cidade,
        'peso', r.peso,
        'volume', r.volume,
        'origem', r.origem,
        'motivoReentrega', r.motivo_reentrega
      ) ORDER BY r.remessa
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) AS remessas
FROM expedicao.transportes t
LEFT JOIN expedicao.transporte_remessas tr ON tr.transporte_id = t.id
LEFT JOIN expedicao.remessas r ON r.id = tr.remessa_id
GROUP BY t.id;
