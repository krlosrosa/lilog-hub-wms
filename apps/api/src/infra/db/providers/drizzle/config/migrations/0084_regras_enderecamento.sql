CREATE TYPE "public"."regra_enderecamento_criterio_tipo" AS ENUM('grupo', 'categoria', 'produto');--> statement-breakpoint
CREATE TYPE "public"."regra_enderecamento_destino_tipo" AS ENUM('zona', 'endereco');--> statement-breakpoint
CREATE TABLE "armazenagem"."regras_enderecamento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"criterio_tipo" "public"."regra_enderecamento_criterio_tipo" NOT NULL,
	"criterio_valor" varchar(100) NOT NULL,
	"prioridade" integer DEFAULT 10 NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regras_enderecamento_unidade_criterio_unique" UNIQUE("unidade_id","criterio_tipo","criterio_valor")
);--> statement-breakpoint
CREATE TABLE "armazenagem"."regras_enderecamento_destinos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra_id" uuid NOT NULL,
	"prioridade" integer NOT NULL,
	"tipo" "public"."regra_enderecamento_destino_tipo" NOT NULL,
	"zona" varchar(100),
	"endereco_id" uuid,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "regras_enderecamento_destinos_regra_prioridade_unique" UNIQUE("regra_id","prioridade")
);--> statement-breakpoint
ALTER TABLE "armazenagem"."regras_enderecamento" ADD CONSTRAINT "regras_enderecamento_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."regras_enderecamento_destinos" ADD CONSTRAINT "regras_enderecamento_destinos_regra_id_regras_enderecamento_id_fk" FOREIGN KEY ("regra_id") REFERENCES "armazenagem"."regras_enderecamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."regras_enderecamento_destinos" ADD CONSTRAINT "regras_enderecamento_destinos_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;
