ALTER TABLE "devolucao"."devolucao_itens" ADD COLUMN IF NOT EXISTS "qtd_conferida" integer;
--> statement-breakpoint
CREATE TABLE "devolucao"."devolucao_avarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"item_id" uuid,
	"tipo" varchar(50) NOT NULL,
	"natureza" varchar(50),
	"causa" varchar(50),
	"quantidade_caixa" integer,
	"quantidade_unidade" integer,
	"observacao" text,
	"photo_urls" text[],
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_avarias" ADD CONSTRAINT "devolucao_avarias_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_avarias" ADD CONSTRAINT "devolucao_avarias_item_id_devolucao_itens_id_fk" FOREIGN KEY ("item_id") REFERENCES "devolucao"."devolucao_itens"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_avarias" ADD CONSTRAINT "devolucao_avarias_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devolucao_avarias_demanda_id_idx" ON "devolucao"."devolucao_avarias" USING btree ("demanda_id");
--> statement-breakpoint
CREATE INDEX "devolucao_avarias_item_id_idx" ON "devolucao"."devolucao_avarias" USING btree ("item_id");
