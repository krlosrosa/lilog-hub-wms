CREATE TYPE "public"."deposito_finalidade_type" AS ENUM('transferencia', 'aguardando_armazenagem', 'geral', 'quarentena', 'debito_transportadora', 'acerto_transferencia', 'reserva', 'avaria', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."natureza_saldo_type" AS ENUM('fisico', 'debito');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimento_estoque_type" AS ENUM('ENTRADA', 'SAIDA', 'TRANSFERENCIA_DEPOSITO', 'AJUSTE', 'ESTORNO');--> statement-breakpoint
CREATE TABLE "estoque"."depositos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"finalidade" "deposito_finalidade_type" NOT NULL,
	"permite_venda" boolean DEFAULT false NOT NULL,
	"permite_picking" boolean DEFAULT false NOT NULL,
	"exige_endereco" boolean DEFAULT false NOT NULL,
	"conta_disponivel" boolean DEFAULT false NOT NULL,
	"sistema" boolean DEFAULT true NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "depositos_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "estoque"."movimentacoes_estoque" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"produto_id" uuid NOT NULL,
	"deposito_origem_id" uuid,
	"deposito_destino_id" uuid,
	"tipo_movimento" "tipo_movimento_estoque_type" NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"lote" varchar(100),
	"validade" timestamp with time zone,
	"numero_serie" varchar(100),
	"natureza" "natureza_saldo_type" DEFAULT 'fisico' NOT NULL,
	"documento_ref" varchar(255),
	"motivo" varchar(100) NOT NULL,
	"operator_id" integer,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque"."saldos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"produto_id" uuid NOT NULL,
	"deposito_id" uuid NOT NULL,
	"lote" varchar(100) DEFAULT '' NOT NULL,
	"validade" timestamp with time zone,
	"numero_serie" varchar(100) DEFAULT '' NOT NULL,
	"natureza" "natureza_saldo_type" DEFAULT 'fisico' NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saldos_unidade_produto_deposito_rastreio_unique" UNIQUE("unidade_id","produto_id","deposito_id","lote","numero_serie","natureza")
);
--> statement-breakpoint
ALTER TABLE "estoque"."depositos" ADD CONSTRAINT "depositos_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_deposito_origem_id_depositos_id_fk" FOREIGN KEY ("deposito_origem_id") REFERENCES "estoque"."depositos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_deposito_destino_id_depositos_id_fk" FOREIGN KEY ("deposito_destino_id") REFERENCES "estoque"."depositos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD CONSTRAINT "saldos_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD CONSTRAINT "saldos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD CONSTRAINT "saldos_deposito_id_depositos_id_fk" FOREIGN KEY ("deposito_id") REFERENCES "estoque"."depositos"("id") ON DELETE restrict ON UPDATE no action;