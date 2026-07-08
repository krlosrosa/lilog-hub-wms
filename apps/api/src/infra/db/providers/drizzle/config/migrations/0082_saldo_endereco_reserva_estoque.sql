CREATE TYPE "public"."reserva_status_type" AS ENUM('ativa', 'parcial', 'atendida', 'cancelada', 'expirada');--> statement-breakpoint
CREATE TYPE "public"."reserva_origem_type" AS ENUM('pedido', 'separacao', 'manual', 'inventario');--> statement-breakpoint
CREATE TABLE "estoque"."saldos_endereco" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"produto_id" varchar(50) NOT NULL,
	"deposito_id" uuid NOT NULL,
	"endereco_id" uuid NOT NULL,
	"lote" varchar(100) DEFAULT '' NOT NULL,
	"validade" timestamp with time zone,
	"numero_serie" varchar(100) DEFAULT '' NOT NULL,
	"natureza" "public"."natureza_saldo_type" DEFAULT 'fisico' NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saldos_endereco_unique" UNIQUE("produto_id","deposito_id","endereco_id","lote","numero_serie","natureza")
);--> statement-breakpoint
CREATE TABLE "estoque"."reservas_estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"produto_id" varchar(50) NOT NULL,
	"deposito_id" uuid NOT NULL,
	"endereco_id" uuid,
	"lote" varchar(100),
	"numero_serie" varchar(100),
	"quantidade" numeric(18, 4) NOT NULL,
	"quantidade_atendida" numeric(18, 4) DEFAULT '0' NOT NULL,
	"status" "public"."reserva_status_type" DEFAULT 'ativa' NOT NULL,
	"origem" "public"."reserva_origem_type" NOT NULL,
	"documento_ref" varchar(255) NOT NULL,
	"motivo" varchar(100),
	"operator_id" integer,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD COLUMN "endereco_origem_id" uuid;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD COLUMN "endereco_destino_id" uuid;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_deposito_id_depositos_id_fk" FOREIGN KEY ("deposito_id") REFERENCES "estoque"."depositos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "estoque"."enderecos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."reservas_estoque" ADD CONSTRAINT "reservas_estoque_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."reservas_estoque" ADD CONSTRAINT "reservas_estoque_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."reservas_estoque" ADD CONSTRAINT "reservas_estoque_deposito_id_depositos_id_fk" FOREIGN KEY ("deposito_id") REFERENCES "estoque"."depositos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."reservas_estoque" ADD CONSTRAINT "reservas_estoque_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."reservas_estoque" ADD CONSTRAINT "reservas_estoque_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_endereco_origem_id_enderecos_id_fk" FOREIGN KEY ("endereco_origem_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_endereco_destino_id_enderecos_id_fk" FOREIGN KEY ("endereco_destino_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saldos_endereco_endereco" ON "estoque"."saldos_endereco" USING btree ("endereco_id");--> statement-breakpoint
CREATE INDEX "idx_saldos_endereco_produto_deposito" ON "estoque"."saldos_endereco" USING btree ("produto_id","deposito_id");--> statement-breakpoint
CREATE INDEX "idx_reservas_estoque_produto_deposito_status" ON "estoque"."reservas_estoque" USING btree ("produto_id","deposito_id","status");--> statement-breakpoint
CREATE INDEX "idx_reservas_estoque_documento_ref" ON "estoque"."reservas_estoque" USING btree ("documento_ref");
