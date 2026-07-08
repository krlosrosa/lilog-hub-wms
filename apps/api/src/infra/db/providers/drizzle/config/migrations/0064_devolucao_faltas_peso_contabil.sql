ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD COLUMN "quantidade_fiscal_original" numeric(14, 3);
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD COLUMN "quantidade_contabil_considerada" numeric(14, 3) DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD COLUMN "tratativa_contabil" varchar(30) DEFAULT 'diferenca_peso' NOT NULL;
--> statement-breakpoint
UPDATE "devolucao"."devolucao_faltas_peso" AS fp
SET
  "quantidade_fiscal_original" = di."quantidade_normalizada_unidades",
  "quantidade_contabil_considerada" = 0,
  "tratativa_contabil" = 'diferenca_peso'
FROM "devolucao"."devolucao_itens" AS di
WHERE fp."item_id" = di."id";
