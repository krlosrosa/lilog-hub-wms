CREATE TYPE "public"."produto_endereco_papel_type" AS ENUM('picking_primario', 'picking_secundario', 'pulmao');--> statement-breakpoint
CREATE TABLE "master_data"."produto_enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"centro_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"endereco_id" uuid NOT NULL,
	"papel" "produto_endereco_papel_type" NOT NULL,
	"ordem" smallint DEFAULT 1 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produto_enderecos_produto_endereco_unique" UNIQUE("produto_id","endereco_id"),
	CONSTRAINT "produto_enderecos_centro_produto_ordem_unique" UNIQUE("centro_id","produto_id","ordem")
);
--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" ADD CONSTRAINT "produto_enderecos_centro_id_centros_id_fk" FOREIGN KEY ("centro_id") REFERENCES "master_data"."centros"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" ADD CONSTRAINT "produto_enderecos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" ADD CONSTRAINT "produto_enderecos_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "master_data"."enderecos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "produto_enderecos_centro_produto_picking_primario_unique" ON "master_data"."produto_enderecos" USING btree ("centro_id","produto_id") WHERE "master_data"."produto_enderecos"."papel" = 'picking_primario';