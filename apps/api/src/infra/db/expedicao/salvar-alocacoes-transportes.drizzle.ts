import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  SalvarAlocacoesTransportesInput,
  SalvarAlocacoesTransportesResult,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import { normalizarItinerarioCodigo } from '../../../shared/utils/normalizar-itinerario-codigo.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';
import { findOrCreateItinerariosDb } from '../transporte/find-or-create-itinerarios.drizzle.js';

export async function salvarAlocacoesTransportesDb(
  db: DrizzleClient,
  input: SalvarAlocacoesTransportesInput,
): Promise<SalvarAlocacoesTransportesResult> {
  if (input.alocacoes.length === 0) {
    return { atualizados: 0 };
  }

  const transporteIds = input.alocacoes.map((item) => item.transporteId);

  const existentes = await db
    .select({ numeroTransporte: transportes.numeroTransporte })
    .from(transportes)
    .where(
      and(
        eq(transportes.unidadeId, input.unidadeId),
        inArray(transportes.numeroTransporte, transporteIds),
      ),
    );

  const idsValidos = new Set(existentes.map((item) => item.numeroTransporte));
  const alocacoesValidas = input.alocacoes.filter((item) =>
    idsValidos.has(item.transporteId),
  );

  if (alocacoesValidas.length === 0) {
    return { atualizados: 0 };
  }

  const codigosItinerario = [
    ...new Set(
      alocacoesValidas
        .map((alocacao) => alocacao.itinerario?.trim())
        .filter((codigo): codigo is string => Boolean(codigo)),
    ),
  ];
  const itinerariosRecords = await findOrCreateItinerariosDb(
    db,
    input.unidadeId,
    codigosItinerario,
  );
  const itinerarioIdPorCodigo = new Map(
    itinerariosRecords.map((record) => [record.codigo, record.id]),
  );

  const alocacoesEnriquecidas = alocacoesValidas.map((alocacao) => {
    const itinerarioRaw = alocacao.itinerario?.trim();

    if (!itinerarioRaw) {
      return {
        ...alocacao,
        itinerarioCodigo: null as string | null,
        itinerarioId: null as string | null,
      };
    }

    const itinerarioCodigo = normalizarItinerarioCodigo(itinerarioRaw);

    return {
      ...alocacao,
      itinerarioCodigo,
      itinerarioId: itinerarioIdPorCodigo.get(itinerarioCodigo) ?? null,
    };
  });

  const nowIso = new Date().toISOString();

  await db.transaction(async (tx) => {
    const valueRows = alocacoesEnriquecidas.map(
      (alocacao) => sql`(
        ${alocacao.transporteId},
        ${'alocado'},
        ${alocacao.placa},
        ${alocacao.transportadora},
        ${alocacao.motorista?.trim() || null},
        ${alocacao.perfilPagamentoId ?? null},
        ${alocacao.perfilPagamentoNome?.trim() || null},
        ${alocacao.semCusto ?? false},
        ${alocacao.itinerarioCodigo},
        ${alocacao.itinerarioId},
        ${alocacao.nivelPrioridade ?? null},
        ${
          alocacao.horarioExpectativaSaida
            ? new Date(alocacao.horarioExpectativaSaida).toISOString()
            : null
        },
        ${alocacao.cidade !== undefined ? alocacao.cidade.trim() : null},
        ${alocacao.bairro !== undefined ? alocacao.bairro?.trim() || null : null},
        ${alocacao.isPrioridade ?? null},
        ${alocacao.custoPrevisto ?? null},
        ${nowIso}
      )`,
    );

    await tx.execute(sql`
      UPDATE ${transportes} AS t
      SET
        status = v.status::status_transporte_type,
        placa = v.placa,
        transportadora = v.transportadora,
        motorista = v.motorista,
        perfil_pagamento_id = v.perfil_pagamento_id::uuid,
        perfil_pagamento_nome = v.perfil_pagamento_nome,
        frete_sem_custo = v.frete_sem_custo::boolean,
        itinerario = v.itinerario,
        itinerario_id = v.itinerario_id::uuid,
        nivel_prioridade = v.nivel_prioridade::operacao_doca_prioridade_type,
        horario_expectativa_saida = v.horario_expectativa_saida::timestamptz,
        cidade = COALESCE(v.cidade, t.cidade),
        bairro = COALESCE(v.bairro, t.bairro),
        is_prioridade = COALESCE(v.is_prioridade::boolean, t.is_prioridade),
        custo_previsto = COALESCE(v.custo_previsto::numeric, t.custo_previsto),
        updated_at = v.updated_at::timestamptz
      FROM (
        VALUES ${sql.join(valueRows, sql`, `)}
      ) AS v(
        numero_transporte,
        status,
        placa,
        transportadora,
        motorista,
        perfil_pagamento_id,
        perfil_pagamento_nome,
        frete_sem_custo,
        itinerario,
        itinerario_id,
        nivel_prioridade,
        horario_expectativa_saida,
        cidade,
        bairro,
        is_prioridade,
        custo_previsto,
        updated_at
      )
      WHERE t.numero_transporte = v.numero_transporte
        AND t.unidade_id = ${input.unidadeId}
    `);
  });

  return { atualizados: alocacoesEnriquecidas.length };
}
