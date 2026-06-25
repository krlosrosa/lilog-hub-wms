-- Torre de Controle — peso total e finalizado no turno

CREATE OR REPLACE VIEW "expedicao"."vw_turno_expedicao" AS
SELECT
  ul.id AS upload_lote_id,
  ul.unidade_id,
  ul.data_referencia,
  ul.horario_expectativa_saida,
  ul.created_at AS turno_inicio_em,
  COUNT(DISTINCT t.id)::integer AS total_transportes,
  COUNT(DISTINCT t.id) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM "expedicao"."mapa_grupos" mg_check
      WHERE mg_check.transporte_id = t.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "expedicao"."mapa_grupos" mg_open
      WHERE mg_open.transporte_id = t.id
        AND mg_open.finalizado_em IS NULL
    )
  )::integer AS transportes_finalizados,
  COUNT(DISTINCT mg.id) FILTER (WHERE mg.finalizado_em IS NULL)::integer AS mapas_pendentes,
  COUNT(DISTINCT mg.id) FILTER (WHERE mg.finalizado_em IS NOT NULL)::integer AS mapas_finalizados,
  COALESCE(SUM(t.peso_total), 0)::numeric(12, 3) AS peso_total_kg,
  COALESCE(
    SUM(t.peso_total) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM "expedicao"."mapa_grupos" mg_check
        WHERE mg_check.transporte_id = t.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "expedicao"."mapa_grupos" mg_open
        WHERE mg_open.transporte_id = t.id
          AND mg_open.finalizado_em IS NULL
      )
    ),
    0
  )::numeric(12, 3) AS peso_finalizado_kg
FROM "expedicao"."upload_lotes" ul
LEFT JOIN "expedicao"."transportes" t ON t.upload_lote_id = ul.id
LEFT JOIN "expedicao"."mapa_grupos" mg ON mg.transporte_id = t.id
GROUP BY ul.id;
