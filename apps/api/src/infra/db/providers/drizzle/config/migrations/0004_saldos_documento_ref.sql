ALTER TABLE "estoque"."saldos" DROP CONSTRAINT "saldos_unidade_produto_deposito_rastreio_unique";--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD COLUMN "documento_ref" varchar(255) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD CONSTRAINT "saldos_unidade_produto_deposito_rastreio_unique" UNIQUE("unidade_id","produto_id","deposito_id","lote","numero_serie","natureza","documento_ref");
