CREATE SCHEMA "corte_operacional";
--> statement-breakpoint
CREATE TYPE "public"."corte_status_type" AS ENUM('solicitado', 'em_andamento', 'concluido', 'cancelado');
--> statement-breakpoint
CREATE TABLE "corte_operacional"."cortes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"mapa_grupo_id" uuid NOT NULL,
	"transporte_id" uuid NOT NULL,
	"mapa_grupo_micro_uuid" varchar(120) NOT NULL,
	"rota" varchar(100) NOT NULL,
	"doca" varchar(50),
	"status" "corte_status_type" DEFAULT 'solicitado' NOT NULL,
	"motivo" text,
	"observacao" text,
	"total_volumes" integer,
	"peso_total_kg" numeric(12, 3),
	"solicitado_por" integer NOT NULL,
	"solicitado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"realizado_por" integer,
	"realizado_em" timestamp with time zone,
	"cancelado_por" integer,
	"cancelado_em" timestamp with time zone,
	"motivo_cancelamento" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cortes_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "corte_operacional"."corte_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"corte_id" uuid NOT NULL,
	"mapa_grupo_item_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"descricao" varchar(500),
	"remessa" varchar(100) NOT NULL,
	"cliente" varchar(255) NOT NULL,
	"lote" varchar(100),
	"quantidade_mapa" numeric(14, 3) NOT NULL,
	"quantidade_corte" numeric(14, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"peso_kg" numeric(10, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_mapa_grupo_id_mapa_grupos_id_fk" FOREIGN KEY ("mapa_grupo_id") REFERENCES "expedicao"."mapa_grupos"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_transporte_id_transportes_id_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_solicitado_por_users_id_fk" FOREIGN KEY ("solicitado_por") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_realizado_por_users_id_fk" FOREIGN KEY ("realizado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_cancelado_por_users_id_fk" FOREIGN KEY ("cancelado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."corte_itens" ADD CONSTRAINT "corte_itens_corte_id_cortes_id_fk" FOREIGN KEY ("corte_id") REFERENCES "corte_operacional"."cortes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."corte_itens" ADD CONSTRAINT "corte_itens_mapa_grupo_item_id_mapa_grupo_itens_id_fk" FOREIGN KEY ("mapa_grupo_item_id") REFERENCES "expedicao"."mapa_grupo_itens"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cortes_unidade_status_idx" ON "corte_operacional"."cortes" USING btree ("unidade_id","status");
--> statement-breakpoint
CREATE INDEX "cortes_mapa_grupo_id_idx" ON "corte_operacional"."cortes" USING btree ("mapa_grupo_id");
