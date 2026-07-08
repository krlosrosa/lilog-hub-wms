CREATE TYPE "public"."inventario_divergencia_tipo" AS ENUM('falta', 'sobra', 'endereco_vazio', 'anomalia');--> statement-breakpoint
CREATE TYPE "public"."inventario_divergencia_status" AS ENUM('pendente', 'aprovada', 'reprovada', 'aplicada');--> statement-breakpoint
CREATE TABLE "estoque"."inventario_divergencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventario_id" uuid NOT NULL,
	"contagem_id" uuid,
	"endereco_id" uuid NOT NULL,
	"saldo_endereco_id" uuid,
	"deposito_id" uuid,
	"produto_id" varchar(50),
	"sku" varchar(100) NOT NULL,
	"produto_nome" varchar(255) NOT NULL,
	"quantidade_esperada" numeric NOT NULL,
	"quantidade_contada" numeric NOT NULL,
	"delta" numeric NOT NULL,
	"unidade_medida" varchar(20),
	"lote" varchar(100),
	"tipo" "public"."inventario_divergencia_tipo" NOT NULL,
	"status" "public"."inventario_divergencia_status" DEFAULT 'pendente' NOT NULL,
	"aprovada_por" integer,
	"aprovada_em" timestamp with time zone,
	"motivo_aprovacao" text,
	"reprovada_por" integer,
	"reprovada_em" timestamp with time zone,
	"motivo_reprovacao" text,
	"documento_ref" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventario_divergencias_documento_ref_unique" UNIQUE("documento_ref")
);--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "estoque"."inventarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_contagem_id_contagens_id_fk" FOREIGN KEY ("contagem_id") REFERENCES "estoque"."contagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "estoque"."enderecos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_saldo_endereco_id_saldos_endereco_id_fk" FOREIGN KEY ("saldo_endereco_id") REFERENCES "estoque"."saldos_endereco"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_deposito_id_depositos_id_fk" FOREIGN KEY ("deposito_id") REFERENCES "estoque"."depositos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_aprovada_por_users_id_fk" FOREIGN KEY ("aprovada_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencias" ADD CONSTRAINT "inventario_divergencias_reprovada_por_users_id_fk" FOREIGN KEY ("reprovada_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventario_divergencias_inventario_id_idx" ON "estoque"."inventario_divergencias" USING btree ("inventario_id");--> statement-breakpoint
CREATE INDEX "inventario_divergencias_status_idx" ON "estoque"."inventario_divergencias" USING btree ("status");
