CREATE TYPE "public"."devolucao_falta_peso_status_type" AS ENUM('pendente', 'validada', 'rejeitada');
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_faltas_peso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"nota_fiscal_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"peso_esperado_kg" numeric(10, 3) NOT NULL,
	"peso_devolvido_kg" numeric(10, 3) NOT NULL,
	"peso_faltante_kg" numeric(10, 3) GENERATED ALWAYS AS ("peso_esperado_kg" - "peso_devolvido_kg") STORED,
	"motivo" text,
	"observacao" text,
	"status" "devolucao_falta_peso_status_type" DEFAULT 'pendente' NOT NULL,
	"registrado_por_user_id" integer,
	"registrado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"validado_por_user_id" integer,
	"validado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD CONSTRAINT "devolucao_faltas_peso_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD CONSTRAINT "devolucao_faltas_peso_nota_fiscal_id_devolucao_notas_fiscais_id_fk" FOREIGN KEY ("nota_fiscal_id") REFERENCES "devolucao"."devolucao_notas_fiscais"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD CONSTRAINT "devolucao_faltas_peso_item_id_devolucao_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "devolucao"."devolucao_itens"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD CONSTRAINT "devolucao_faltas_peso_registrado_por_user_id_users_id_fk" FOREIGN KEY ("registrado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD CONSTRAINT "devolucao_faltas_peso_validado_por_user_id_users_id_fk" FOREIGN KEY ("validado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devolucao_faltas_peso_demanda_id_idx" ON "devolucao"."devolucao_faltas_peso" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "devolucao_faltas_peso_item_id_idx" ON "devolucao"."devolucao_faltas_peso" USING btree ("item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "devolucao_faltas_peso_item_id_ativo_unique_idx" ON "devolucao"."devolucao_faltas_peso" USING btree ("item_id") WHERE "status" IN ('pendente', 'validada');
