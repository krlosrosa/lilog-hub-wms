DROP VIEW IF EXISTS "expedicao"."vw_transporte_operacional";
--> statement-breakpoint
CREATE VIEW "expedicao"."vw_transporte_operacional" AS
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
  (t.is_prioridade OR t.reentrega_exclusiva) AS prioridade,
  t.is_prioridade,
  t.nivel_prioridade,
  t.reentrega_exclusiva,
  (
    EXTRACT(
      EPOCH FROM (t.horario_expectativa_saida - NOW())
    ) / 60
  )::integer AS tempo_restante_saida_min
FROM "expedicao"."transportes" t
LEFT JOIN transporte_etapa te ON te.transporte_id = t.id
LEFT JOIN transporte_mapas tm ON tm.transporte_id = t.id;
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_mapas_pendentes";
--> statement-breakpoint
CREATE VIEW "expedicao"."vw_mapas_pendentes" AS
SELECT
  mg.id AS mapa_grupo_id,
  mg.mapa_lote_id,
  t.unidade_id,
  t.upload_lote_id,
  mg.transporte_id,
  t.rota AS transporte_codigo,
  mg.micro_uuid,
  mg.processo,
  mg.titulo,
  mg.tempo_esperado AS tempo_esperado_min,
  GREATEST(
    0,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(mg.iniciado_em, mg.created_at))) / 60
  )::integer AS tempo_parado_min,
  f.nome AS operador_nome,
  mg.sessao_funcionario_id,
  (t.is_prioridade OR t.reentrega_exclusiva) AS prioridade,
  t.is_prioridade,
  t.nivel_prioridade,
  t.reentrega_exclusiva
FROM "expedicao"."mapa_grupos" mg
INNER JOIN "expedicao"."transportes" t ON t.id = mg.transporte_id
LEFT JOIN "sessao_operacao"."sessao_funcionarios" sf ON sf.id = mg.sessao_funcionario_id
LEFT JOIN "auth"."funcionarios" f ON f.id = sf.funcionario_id
WHERE mg.finalizado_em IS NULL;
