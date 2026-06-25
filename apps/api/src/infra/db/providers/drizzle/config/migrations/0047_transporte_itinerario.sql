DROP VIEW IF EXISTS "expedicao"."vw_transportes";--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" DROP COLUMN IF EXISTS "dias_alocacao";--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD COLUMN IF NOT EXISTS "itinerario" varchar(100);--> statement-breakpoint
CREATE VIEW "expedicao"."vw_transportes" AS
SELECT
  t.id,
  t.unidade_id,
  t.upload_lote_id,
  t.rota,
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
LEFT JOIN expedicao.transporte_remessas tr ON tr.transporte_id = t.id
LEFT JOIN expedicao.remessas r ON r.id = tr.remessa_id
GROUP BY t.id;
