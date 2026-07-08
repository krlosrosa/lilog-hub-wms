ALTER TABLE "devolucao"."demandas_devolucao"
  ADD COLUMN IF NOT EXISTS "placa" varchar(20);
--> statement-breakpoint
UPDATE "devolucao"."demandas_devolucao" d
SET placa = t.placa
FROM "devolucao"."devolucao_notas_fiscais" nf
JOIN "expedicao"."transportes" t ON nf.transporte_id = t.numero_transporte
WHERE nf.demanda_id = d.id
  AND d.placa IS NULL
  AND t.placa IS NOT NULL;
