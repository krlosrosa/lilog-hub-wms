-- Migration 0052: transportes.numero_transporte vira PK; FKs filhas passam a referenciar numero_transporte (varchar) com ON DELETE CASCADE

--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_transportes";
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_transporte_operacional";
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_mapas_pendentes";
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_pipeline_turno";
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_timeline_finalizacao_hora";
--> statement-breakpoint
DROP VIEW IF EXISTS "expedicao"."vw_turno_expedicao";

--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" DROP CONSTRAINT IF EXISTS "transporte_remessas_transporte_id_transportes_id_fk";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" DROP CONSTRAINT IF EXISTS "mapa_lote_transportes_transporte_id_transportes_id_fk";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" DROP CONSTRAINT IF EXISTS "mapa_grupos_transporte_id_transportes_id_fk";
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" DROP CONSTRAINT IF EXISTS "cortes_transporte_id_transportes_id_fk";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" DROP CONSTRAINT IF EXISTS "devolucao_notas_fiscais_transporte_id_transportes_id_fk";

--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" ADD COLUMN "transporte_id_new" varchar(100);
--> statement-breakpoint
UPDATE "expedicao"."transporte_remessas" tr SET "transporte_id_new" = t."rota" FROM "expedicao"."transportes" t WHERE tr."transporte_id" = t."id";
--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" DROP COLUMN "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" RENAME COLUMN "transporte_id_new" TO "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" ALTER COLUMN "transporte_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" ADD COLUMN "transporte_id_new" varchar(100);
--> statement-breakpoint
UPDATE "expedicao"."mapa_lote_transportes" mlt SET "transporte_id_new" = t."rota" FROM "expedicao"."transportes" t WHERE mlt."transporte_id" = t."id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" DROP COLUMN "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" RENAME COLUMN "transporte_id_new" TO "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" ALTER COLUMN "transporte_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "transporte_id_new" varchar(100);
--> statement-breakpoint
UPDATE "expedicao"."mapa_grupos" mg SET "transporte_id_new" = t."rota" FROM "expedicao"."transportes" t WHERE mg."transporte_id" = t."id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" DROP COLUMN "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" RENAME COLUMN "transporte_id_new" TO "transporte_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ALTER COLUMN "transporte_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD COLUMN "transporte_id_new" varchar(100);
--> statement-breakpoint
UPDATE "corte_operacional"."cortes" c SET "transporte_id_new" = t."rota" FROM "expedicao"."transportes" t WHERE c."transporte_id" = t."id";
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" DROP COLUMN "transporte_id";
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" RENAME COLUMN "transporte_id_new" TO "transporte_id";
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ALTER COLUMN "transporte_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" ADD COLUMN "transporte_id_new" varchar(100);
--> statement-breakpoint
UPDATE "devolucao"."devolucao_notas_fiscais" dnf SET "transporte_id_new" = t."rota" FROM "expedicao"."transportes" t WHERE dnf."transporte_id" = t."id";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" DROP COLUMN "transporte_id";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" RENAME COLUMN "transporte_id_new" TO "transporte_id";

--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" DROP CONSTRAINT "transportes_pkey";
--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" RENAME COLUMN "rota" TO "numero_transporte";
--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD PRIMARY KEY ("numero_transporte");

--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" ADD CONSTRAINT "transporte_remessas_transporte_id_transportes_numero_transporte_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("numero_transporte") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_lote_transportes" ADD CONSTRAINT "mapa_lote_transportes_transporte_id_transportes_numero_transporte_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("numero_transporte") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_transporte_id_transportes_numero_transporte_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("numero_transporte") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "corte_operacional"."cortes" ADD CONSTRAINT "cortes_transporte_id_transportes_numero_transporte_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("numero_transporte") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_notas_fiscais" ADD CONSTRAINT "devolucao_notas_fiscais_transporte_id_transportes_numero_transporte_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("numero_transporte") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
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
        'motivoReentrega', r.motivo_reentrega
      ) ORDER BY r.remessa
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::json
  ) AS remessas
FROM expedicao.transportes t
LEFT JOIN expedicao.transporte_remessas tr ON tr.transporte_id = t.numero_transporte
LEFT JOIN expedicao.remessas r ON r.id = tr.remessa_id
GROUP BY t.numero_transporte;

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
  t.numero_transporte AS transporte_id,
  t.unidade_id,
  t.upload_lote_id,
  t.numero_transporte AS codigo,
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
  )::integer AS tempo_restante_saida_min,
  EXTRACT(
    EPOCH FROM (t.horario_expectativa_saida - NOW())
  )::integer AS tempo_restante_saida_seg
FROM "expedicao"."transportes" t
LEFT JOIN transporte_etapa te ON te.transporte_id = t.numero_transporte
LEFT JOIN transporte_mapas tm ON tm.transporte_id = t.numero_transporte;

--> statement-breakpoint
CREATE VIEW "expedicao"."vw_mapas_pendentes" AS
SELECT
  mg.id AS mapa_grupo_id,
  mg.mapa_lote_id,
  t.unidade_id,
  t.upload_lote_id,
  mg.transporte_id,
  t.numero_transporte AS transporte_codigo,
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
INNER JOIN "expedicao"."transportes" t ON t.numero_transporte = mg.transporte_id
LEFT JOIN "sessao_operacao"."sessao_funcionarios" sf ON sf.id = mg.sessao_funcionario_id
LEFT JOIN "auth"."funcionarios" f ON f.id = sf.funcionario_id
WHERE mg.finalizado_em IS NULL;

--> statement-breakpoint
CREATE VIEW "expedicao"."vw_pipeline_turno" AS
SELECT
  t.unidade_id,
  t.upload_lote_id,
  mg.processo,
  COUNT(*) FILTER (WHERE mg.finalizado_em IS NULL)::integer AS qtd_mapas_pendentes,
  COUNT(*) FILTER (WHERE mg.finalizado_em IS NOT NULL)::integer AS qtd_mapas_finalizados,
  COALESCE(
    AVG(
      EXTRACT(EPOCH FROM (NOW() - COALESCE(mg.iniciado_em, mg.created_at))) / 60
    ) FILTER (WHERE mg.finalizado_em IS NULL),
    0
  )::numeric(10, 2) AS tempo_medio_parado_min,
  COALESCE(
    SUM(mg.total_itens) FILTER (WHERE mg.finalizado_em IS NULL),
    0
  )::integer AS volume_acumulado_itens
FROM "expedicao"."mapa_grupos" mg
INNER JOIN "expedicao"."transportes" t ON t.numero_transporte = mg.transporte_id
GROUP BY t.unidade_id, t.upload_lote_id, mg.processo;

--> statement-breakpoint
CREATE VIEW "expedicao"."vw_timeline_finalizacao_hora" AS
SELECT
  t.unidade_id,
  t.upload_lote_id,
  date_trunc('hour', mg.finalizado_em) AS hora_bucket,
  COUNT(*)::integer AS grupos_finalizados
FROM "expedicao"."mapa_grupos" mg
INNER JOIN "expedicao"."transportes" t ON t.numero_transporte = mg.transporte_id
WHERE mg.finalizado_em IS NOT NULL
GROUP BY t.unidade_id, t.upload_lote_id, date_trunc('hour', mg.finalizado_em);

--> statement-breakpoint
CREATE VIEW "expedicao"."vw_turno_expedicao" AS
SELECT
  ul.id AS upload_lote_id,
  ul.unidade_id,
  ul.data_referencia,
  ul.horario_expectativa_saida,
  ul.created_at AS turno_inicio_em,
  COUNT(DISTINCT t.numero_transporte)::integer AS total_transportes,
  COUNT(DISTINCT t.numero_transporte) FILTER (
    WHERE EXISTS (
      SELECT 1
      FROM "expedicao"."mapa_grupos" mg_check
      WHERE mg_check.transporte_id = t.numero_transporte
    )
    AND NOT EXISTS (
      SELECT 1
      FROM "expedicao"."mapa_grupos" mg_open
      WHERE mg_open.transporte_id = t.numero_transporte
        AND mg_open.finalizado_em IS NULL
    )
  )::integer AS transportes_finalizados,
  (
    SELECT COUNT(*)::integer
    FROM "expedicao"."mapa_grupos" mg_p
    INNER JOIN "expedicao"."transportes" t_p ON t_p.numero_transporte = mg_p.transporte_id
    WHERE t_p.upload_lote_id = ul.id
      AND mg_p.finalizado_em IS NULL
  ) AS mapas_pendentes,
  (
    SELECT COUNT(*)::integer
    FROM "expedicao"."mapa_grupos" mg_f
    INNER JOIN "expedicao"."transportes" t_f ON t_f.numero_transporte = mg_f.transporte_id
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
          WHERE mg_check.transporte_id = t_peso.numero_transporte
        )
        AND NOT EXISTS (
          SELECT 1
          FROM "expedicao"."mapa_grupos" mg_open
          WHERE mg_open.transporte_id = t_peso.numero_transporte
            AND mg_open.finalizado_em IS NULL
        )
    ),
    0
  )::numeric(12, 3) AS peso_finalizado_kg
FROM "expedicao"."upload_lotes" ul
LEFT JOIN "expedicao"."transportes" t ON t.upload_lote_id = ul.id
GROUP BY ul.id;
