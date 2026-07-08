CREATE TYPE "public"."status_saldo_endereco_type" AS ENUM('liberado', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."origem_modulo_saldo_tratativa_type" AS ENUM('recebimento', 'devolucao', 'inventario');--> statement-breakpoint
CREATE TYPE "public"."tipo_anomalia_saldo_tratativa_type" AS ENUM('falta', 'sobra', 'produto_nao_esperado');--> statement-breakpoint
CREATE TYPE "public"."status_saldo_tratativa_type" AS ENUM('pendente', 'em_analise', 'resolvido', 'cancelado');--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD COLUMN "status" "public"."status_saldo_endereco_type" DEFAULT 'liberado' NOT NULL;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" DROP CONSTRAINT "saldos_endereco_unique";--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_unique" UNIQUE("produto_id","deposito_id","endereco_id","lote","numero_serie","natureza","status");--> statement-breakpoint
CREATE TABLE "estoque"."saldos_tratativa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"produto_id" varchar(50) NOT NULL,
	"origem_modulo" "public"."origem_modulo_saldo_tratativa_type" NOT NULL,
	"origem_entidade_id" uuid NOT NULL,
	"origem_anomalia_id" uuid,
	"tipo_anomalia" "public"."tipo_anomalia_saldo_tratativa_type" NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"lote" varchar(100) DEFAULT '' NOT NULL,
	"validade" timestamp with time zone,
	"numero_serie" varchar(100) DEFAULT '' NOT NULL,
	"saldo_endereco_id" uuid,
	"deposito_id" uuid,
	"cnc_id" uuid,
	"status" "public"."status_saldo_tratativa_type" DEFAULT 'pendente' NOT NULL,
	"documento_ref" varchar(255) NOT NULL,
	"descricao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saldos_tratativa_documento_ref_unique" UNIQUE("documento_ref")
);--> statement-breakpoint
ALTER TABLE "estoque"."saldos_tratativa" ADD CONSTRAINT "saldos_tratativa_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_tratativa" ADD CONSTRAINT "saldos_tratativa_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_tratativa" ADD CONSTRAINT "saldos_tratativa_saldo_endereco_id_saldos_endereco_id_fk" FOREIGN KEY ("saldo_endereco_id") REFERENCES "estoque"."saldos_endereco"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_tratativa" ADD CONSTRAINT "saldos_tratativa_deposito_id_depositos_id_fk" FOREIGN KEY ("deposito_id") REFERENCES "estoque"."depositos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_tratativa" ADD CONSTRAINT "saldos_tratativa_cnc_id_nao_conformidades_id_fk" FOREIGN KEY ("cnc_id") REFERENCES "cnc"."nao_conformidades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saldos_tratativa_unidade_produto" ON "estoque"."saldos_tratativa" USING btree ("unidade_id","produto_id");--> statement-breakpoint
CREATE INDEX "idx_saldos_tratativa_origem" ON "estoque"."saldos_tratativa" USING btree ("origem_modulo","origem_entidade_id");--> statement-breakpoint
CREATE INDEX "idx_saldos_tratativa_status" ON "estoque"."saldos_tratativa" USING btree ("status");
