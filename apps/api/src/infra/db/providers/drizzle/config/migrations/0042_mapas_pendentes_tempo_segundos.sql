-- Expose pending map durations in seconds for precise ETA formatting.
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
  mg.iniciado_em,
  GREATEST(0, mg.tempo_esperado)::integer AS tempo_esperado_seg,
  GREATEST(
    0,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(mg.iniciado_em, mg.created_at)))
  )::integer AS tempo_parado_seg,
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
