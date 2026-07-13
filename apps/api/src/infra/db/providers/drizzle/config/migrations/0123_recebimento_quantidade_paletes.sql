ALTER TABLE "recebimento"."pre_recebimentos"
  ADD COLUMN IF NOT EXISTS "quantidade_paletes_esperada" integer;

ALTER TABLE "recebimento"."recebimentos"
  ADD COLUMN IF NOT EXISTS "quantidade_paletes" integer;

DROP VIEW IF EXISTS "recebimento"."vw_pre_recebimento_detalhe";

CREATE VIEW "recebimento"."vw_pre_recebimento_detalhe" AS
SELECT
  pr.id AS pre_recebimento_id,
  pr.unidade_id,
  pr.transportadora_nome,
  pr.placa,
  pr.motorista_nome,
  pr.motorista_telefone,
  pr.grau_prioridade,
  pr.numero_ocr,
  pr.numero_transporte,
  pr.origem_dados,
  pr.origem,
  pr.horario_previsto,
  pr.observacao,
  pr.quantidade_paletes_esperada,
  pr.situacao AS pre_recebimento_situacao,
  pr.data_chegada,
  pr.doca_id AS pre_recebimento_doca_id,
  pr.created_at AS pre_recebimento_created_at,
  pr.updated_at AS pre_recebimento_updated_at,

  r.id AS recebimento_id,
  r.situacao AS recebimento_situacao,
  r.modo_unitizacao,
  r.data_inicio AS recebimento_data_inicio,
  r.data_fim,
  r.responsavel_id,
  r.doca_id AS recebimento_doca_id,
  r.quantidade_paletes,
  r.created_at AS recebimento_created_at,
  r.updated_at AS recebimento_updated_at,

  cl.id AS checklist_id,
  cl.lacre,
  cl.temp_bau,
  cl.temp_produto,
  cl.condicao_limpeza,
  cl.condicao_odor,
  cl.condicao_estrutura,
  cl.condicao_vedacao,
  cl.conditions,
  cl.observacoes AS checklist_observacoes,
  cl.photo_count AS checklist_photo_count,
  cl.created_at AS checklist_created_at,

  COALESCE(itens_esperados.itens, '[]'::jsonb) AS itens_esperados,
  COALESCE(itens_recebidos.itens, '[]'::jsonb) AS itens_recebidos,
  COALESCE(divergencias.itens, '[]'::jsonb) AS divergencias,
  COALESCE(divergencias.total, 0)::integer AS num_divergencias,
  COALESCE(avarias.itens, '[]'::jsonb) AS avarias,
  COALESCE(produtos_map.itens, '[]'::jsonb) AS produtos
FROM "recebimento"."pre_recebimentos" pr
LEFT JOIN LATERAL (
  SELECT r.*
  FROM "recebimento"."recebimentos" r
  WHERE r.pre_recebimento_id = pr.id
  ORDER BY r.created_at DESC, r.id DESC
  LIMIT 1
) r ON TRUE
LEFT JOIN "recebimento"."checklist_recebimento" cl
  ON cl.recebimento_id = r.id
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', ipr.id,
        'produtoId', ipr.produto_id,
        'quantidadeEsperada', ipr.quantidade_esperada::float8,
        'unidadeMedida', ipr.unidade_medida,
        'loteEsperado', ipr.lote_esperado,
        'pesoEsperado', ipr.peso_esperado::float8,
        'validadeEsperada', ipr.validade_esperada,
        'unidadesPorCaixa', COALESCE(p.unidades_por_caixa, 1)
      )
      ORDER BY ipr.created_at, ipr.id
    ) AS itens
  FROM "recebimento"."itens_pre_recebimento" ipr
  LEFT JOIN "master_data"."produtos" p
    ON p.produto_id = ipr.produto_id
  WHERE ipr.pre_recebimento_id = pr.id
) itens_esperados ON TRUE
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', ir.id,
        'produtoId', ir.produto_id,
        'quantidadeRecebida', ir.quantidade_recebida::float8,
        'unidadeMedida', ir.unidade_medida,
        'loteRecebido', ir.lote_recebido,
        'pesoRecebido', ir.peso_recebido::float8,
        'validade', ir.validade,
        'numeroSerie', ir.numero_serie,
        'unitizadorId', ir.unitizador_id,
        'unitizadorCodigo', u.codigo
      )
      ORDER BY ir.created_at, ir.id
    ) AS itens
  FROM "recebimento"."itens_recebimento" ir
  LEFT JOIN "armazenagem"."unitizadores" u
    ON u.id = ir.unitizador_id
  WHERE ir.recebimento_id = r.id
) itens_recebidos ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::integer AS total,
    jsonb_agg(
      jsonb_build_object(
        'id', div.id,
        'produtoId', div.produto_id,
        'tipoDivergencia', div.tipo_divergencia,
        'quantidadeEsperada', div.quantidade_esperada::float8,
        'quantidadeRecebida', div.quantidade_recebida::float8,
        'descricao', div.descricao
      )
      ORDER BY div.created_at, div.id
    ) AS itens
  FROM "recebimento"."divergencias_recebimento" div
  WHERE div.recebimento_id = r.id
) divergencias ON TRUE
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'id', av.id,
        'recebimentoId', av.recebimento_id,
        'produtoId', av.produto_id,
        'tipo', av.tipo,
        'natureza', av.natureza,
        'causa', av.causa,
        'quantidadeCaixas', av.quantidade_caixas,
        'quantidadeUnidades', av.quantidade_unidades,
        'lote', av.lote,
        'photoCount', av.photo_count,
        'replicado', av.replicado,
        'createdAt', av.created_at
      )
      ORDER BY av.created_at, av.id
    ) AS itens
  FROM "recebimento"."recebimento_avarias" av
  WHERE av.recebimento_id = r.id
) avarias ON TRUE
LEFT JOIN LATERAL (
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'produtoId', p.produto_id,
        'sku', p.sku,
        'descricao', p.descricao,
        'ean', p.ean,
        'unidadesPorCaixa', COALESCE(p.unidades_por_caixa, 1)
      )
      ORDER BY p.produto_id
    ) AS itens
  FROM "master_data"."produtos" p
  WHERE p.produto_id IN (
    SELECT ipr.produto_id
    FROM "recebimento"."itens_pre_recebimento" ipr
    WHERE ipr.pre_recebimento_id = pr.id
    UNION
    SELECT ir.produto_id
    FROM "recebimento"."itens_recebimento" ir
    WHERE ir.recebimento_id = r.id
  )
) produtos_map ON TRUE;
