-- Permite tempo_restante_saida_min negativo para identificar meta já ultrapassada

CREATE OR REPLACE VIEW "expedicao"."vw_transporte_operacional" AS
WITH grupo_por_micro AS (
  SELECT
    mg.transporte_id,
    mg.micro_uuid,
    BOOL_OR(mg.processo = 'separacao' AND mg.finalizado_em IS NULL) AS sep_pendente,
    BOOL_OR(mg.processo = 'conferencia' AND mg.finalizado_em IS NULL) AS conf_pendente,
    BOOL_OR(mg.processo = 'carregamento' AND mg.finalizado_em IS NULL) AS carr_pendente,
    BOOL_OR(mg.processo = 'carregamento' AND mg.finalizado_em IS NOT NULL) AS carr_concluido
  FROM "expedicao"."mapa_grupos" mg
  GROUP BY mg.transporte_id, mg.micro_uuid
),
transporte_mapas AS (
  SELECT
    transporte_id,
    COUNT(*)::integer AS mapas_total,
    COUNT(*) FILTER (WHERE carr_concluido)::integer AS mapas_concluidos
  FROM grupo_por_micro
  GROUP BY transporte_id
),
transporte_etapa AS (
  SELECT
    g.transporte_id,
    CASE
      WHEN COUNT(*) = 0 THEN 'separacao'
      WHEN BOOL_OR(g.sep_pendente) THEN 'separacao'
      WHEN BOOL_OR(g.conf_pendente) THEN 'conferencia'
      WHEN BOOL_OR(g.carr_pendente) THEN 'carregamento'
      ELSE 'finalizado'
    END AS etapa_atual
  FROM grupo_por_micro g
  GROUP BY g.transporte_id
)
SELECT
  t.id AS transporte_id,
  t.unidade_id,
  t.upload_lote_id,
  t.rota AS codigo,
  COALESCE(t.placa, '') AS placa,
  COALESCE(t.transportadora, '') AS transportadora,
  t.horario_expectativa_saida,
  t.status AS status_alocacao,
  COALESCE(te.etapa_atual, 'separacao') AS etapa_atual,
  COALESCE(tm.mapas_total, 0) AS mapas_total,
  COALESCE(tm.mapas_concluidos, 0) AS mapas_concluidos,
  t.reentrega_exclusiva AS prioridade,
  (
    EXTRACT(
      EPOCH FROM (t.horario_expectativa_saida - NOW())
    ) / 60
  )::integer AS tempo_restante_saida_min
FROM "expedicao"."transportes" t
LEFT JOIN transporte_etapa te ON te.transporte_id = t.id
LEFT JOIN transporte_mapas tm ON tm.transporte_id = t.id;
