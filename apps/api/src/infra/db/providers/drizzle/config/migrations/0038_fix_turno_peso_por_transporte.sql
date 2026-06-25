-- Corrige peso_total_kg e peso_finalizado_kg: somar por transporte, não por mapa_grupo/processo

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
  (
    SELECT COUNT(*)::integer
    FROM "expedicao"."mapa_grupos" mg_p
    INNER JOIN "expedicao"."transportes" t_p ON t_p.id = mg_p.transporte_id
    WHERE t_p.upload_lote_id = ul.id
      AND mg_p.finalizado_em IS NULL
  ) AS mapas_pendentes,
  (
    SELECT COUNT(*)::integer
    FROM "expedicao"."mapa_grupos" mg_f
    INNER JOIN "expedicao"."transportes" t_f ON t_f.id = mg_f.transporte_id
    WHERE t_f.upload_lote_id = ul.id
      AND mg_f.finalizado_em IS NOT NULL
  ) AS mapas_finalizados,
  COALESCE(
    (
      SELECT SUM(t_peso.peso_total)
      FROM "expedicao"."transportes" t_peso
      WHERE t_peso.upload_lote_id = ul.id
    ),
    0
  )::numeric(12, 3) AS peso_total_kg,
  COALESCE(
    (
      SELECT SUM(t_peso.peso_total)
      FROM "expedicao"."transportes" t_peso
      WHERE t_peso.upload_lote_id = ul.id
        AND EXISTS (
          SELECT 1
          FROM "expedicao"."mapa_grupos" mg_check
          WHERE mg_check.transporte_id = t_peso.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "expedicao"."mapa_grupos" mg_open
          WHERE mg_open.transporte_id = t_peso.id
            AND mg_open.finalizado_em IS NULL
        )
    ),
    0
  )::numeric(12, 3) AS peso_finalizado_kg
FROM "expedicao"."upload_lotes" ul
LEFT JOIN "expedicao"."transportes" t ON t.upload_lote_id = ul.id
GROUP BY ul.id;
