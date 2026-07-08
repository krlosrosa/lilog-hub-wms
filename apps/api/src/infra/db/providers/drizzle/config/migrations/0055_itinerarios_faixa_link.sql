CREATE TABLE IF NOT EXISTS "transporte"."itinerarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(100) NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "itinerarios_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);--> statement-breakpoint
ALTER TABLE "transporte"."itinerarios" ADD CONSTRAINT "itinerarios_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transporte"."perfis_tarifas_faixas_km_itinerarios" (
	"faixa_km_id" uuid NOT NULL,
	"itinerario_id" uuid NOT NULL,
	CONSTRAINT "perfis_tarifas_faixas_km_itinerarios_pk" PRIMARY KEY("faixa_km_id","itinerario_id")
);--> statement-breakpoint
ALTER TABLE "transporte"."perfis_tarifas_faixas_km_itinerarios" ADD CONSTRAINT "perfis_tarifas_faixas_km_itinerarios_faixa_km_id_perfis_tarifas_faixas_km_id_fk" FOREIGN KEY ("faixa_km_id") REFERENCES "transporte"."perfis_tarifas_faixas_km"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transporte"."perfis_tarifas_faixas_km_itinerarios" ADD CONSTRAINT "perfis_tarifas_faixas_km_itinerarios_itinerario_id_itinerarios_id_fk" FOREIGN KEY ("itinerario_id") REFERENCES "transporte"."itinerarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."remessas" ADD COLUMN IF NOT EXISTS "itinerario_id" uuid;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN IF NOT EXISTS "itinerario_id" uuid;--> statement-breakpoint
ALTER TABLE "expedicao"."remessas" ADD CONSTRAINT "remessas_itinerario_id_itinerarios_id_fk" FOREIGN KEY ("itinerario_id") REFERENCES "transporte"."itinerarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD CONSTRAINT "transportes_itinerario_id_itinerarios_id_fk" FOREIGN KEY ("itinerario_id") REFERENCES "transporte"."itinerarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "transporte"."itinerarios" ("unidade_id", "codigo")
SELECT DISTINCT pt.unidade_id, lower(trim(f.itinerario))
FROM "transporte"."perfis_tarifas_faixas_km" f
INNER JOIN "transporte"."perfis_tarifas" pt ON pt.id = f.perfil_tarifa_id
WHERE f.itinerario IS NOT NULL AND trim(f.itinerario) <> ''
ON CONFLICT ("unidade_id", "codigo") DO NOTHING;--> statement-breakpoint
INSERT INTO "transporte"."perfis_tarifas_faixas_km_itinerarios" ("faixa_km_id", "itinerario_id")
SELECT f.id, i.id
FROM "transporte"."perfis_tarifas_faixas_km" f
INNER JOIN "transporte"."perfis_tarifas" pt ON pt.id = f.perfil_tarifa_id
INNER JOIN "transporte"."itinerarios" i
  ON i.unidade_id = pt.unidade_id AND i.codigo = lower(trim(f.itinerario))
WHERE f.itinerario IS NOT NULL AND trim(f.itinerario) <> ''
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "transporte"."itinerarios" ("unidade_id", "codigo")
SELECT DISTINCT t.unidade_id, lower(trim(t.itinerario))
FROM "expedicao"."transportes" t
WHERE t.itinerario IS NOT NULL AND trim(t.itinerario) <> ''
ON CONFLICT ("unidade_id", "codigo") DO NOTHING;--> statement-breakpoint
INSERT INTO "transporte"."itinerarios" ("unidade_id", "codigo")
SELECT DISTINCT ul.unidade_id, lower(trim(r.itinerario))
FROM "expedicao"."remessas" r
INNER JOIN "expedicao"."upload_lotes" ul ON ul.id = r.upload_lote_id
WHERE r.itinerario IS NOT NULL AND trim(r.itinerario) <> ''
ON CONFLICT ("unidade_id", "codigo") DO NOTHING;--> statement-breakpoint
UPDATE "expedicao"."transportes" t
SET itinerario_id = i.id
FROM "transporte"."itinerarios" i
WHERE t.itinerario IS NOT NULL
  AND trim(t.itinerario) <> ''
  AND i.unidade_id = t.unidade_id
  AND i.codigo = lower(trim(t.itinerario));--> statement-breakpoint
UPDATE "expedicao"."remessas" r
SET itinerario_id = i.id
FROM "expedicao"."upload_lotes" ul,
     "transporte"."itinerarios" i
WHERE r.upload_lote_id = ul.id
  AND i.unidade_id = ul.unidade_id
  AND i.codigo = lower(trim(r.itinerario))
  AND r.itinerario IS NOT NULL
  AND trim(r.itinerario) <> '';--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_transportes";--> statement-breakpoint
CREATE VIEW "expedicao"."vw_transportes" AS
SELECT
  t.numero_transporte,
  t.unidade_id,
  t.upload_lote_id,
  t.regiao,
  t.cidade,
  t.bairro,
  t.data_transporte,
  t.horario_expectativa_saida,
  t.peso_total,
  t.volume_total,
  t.distancia_km,
  t.itinerario,
  t.itinerario_id,
  t.perfil_esperado,
  t.status,
  t.placa,
  t.motorista,
  t.transportadora,
  t.perfil_pagamento_id,
  t.perfil_pagamento_nome,
  t.custo_previsto,
  t.frete_sem_custo,
  t.reentrega_exclusiva,
  t.is_prioridade,
  t.nivel_prioridade,
  t.mapa_gerado_em,
  t.ultimo_mapa_lote_id,
  t.created_at,
  t.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', r.id,
        'remessa', r.remessa,
        'empresa', r.empresa,
        'codCliente', r.cod_cliente,
        'cliente', r.cliente,
        'cidade', r.cidade,
        'peso', r.peso,
        'volume', r.volume,
        'origem', r.origem,
        'motivoReentrega', r.motivo_reentrega,
        'itinerario', r.itinerario,
        'itinerarioId', r.itinerario_id
      ) ORDER BY r.remessa
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) AS remessas
FROM expedicao.transportes t
LEFT JOIN expedicao.transporte_remessas tr ON tr.transporte_id = t.numero_transporte
LEFT JOIN expedicao.remessas r ON r.id = tr.remessa_id
GROUP BY t.numero_transporte;
