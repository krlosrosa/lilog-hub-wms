ALTER TABLE "devolucao"."devolucao_faltas_peso" ADD COLUMN "zerar_quantidade_contabil" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
UPDATE "devolucao"."devolucao_faltas_peso"
SET "zerar_quantidade_contabil" = ("quantidade_contabil_considerada" = 0);
