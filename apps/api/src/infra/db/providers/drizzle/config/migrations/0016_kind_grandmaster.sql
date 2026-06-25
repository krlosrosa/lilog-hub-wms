CREATE TABLE "expedicao"."remessa_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"remessa_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"produto_id" uuid,
	"lote" varchar(100),
	"peso" numeric(10, 3),
	"quantidade" numeric(14, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"quantidade_normalizada_unidades" numeric(14, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "remessa_itens_remessa_sku_lote_unidade_unique" UNIQUE("remessa_id","sku","lote","unidade_medida")
);
--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" ADD CONSTRAINT "remessa_itens_remessa_id_remessas_id_fk" FOREIGN KEY ("remessa_id") REFERENCES "expedicao"."remessas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" ADD CONSTRAINT "remessa_itens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE set null ON UPDATE no action;