CREATE TYPE "recebimento"."temperatura_produto_etapa_type" AS ENUM('inicio', 'meio', 'fim');

CREATE TABLE "recebimento"."recebimento_temperaturas_produto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"etapa" "recebimento"."temperatura_produto_etapa_type" NOT NULL,
	"temperatura" numeric(5, 1) NOT NULL,
	"medido_em" timestamp with time zone DEFAULT now() NOT NULL,
	"operator_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "recebimento"."recebimento_temperaturas_produto" ADD CONSTRAINT "recebimento_temperaturas_produto_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "recebimento"."recebimento_temperaturas_produto" ADD CONSTRAINT "recebimento_temperaturas_produto_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "recebimento_temperaturas_produto_recebimento_etapa_unique_idx" ON "recebimento"."recebimento_temperaturas_produto" USING btree ("recebimento_id","etapa");

CREATE INDEX "recebimento_temperaturas_produto_recebimento_id_idx" ON "recebimento"."recebimento_temperaturas_produto" USING btree ("recebimento_id");
