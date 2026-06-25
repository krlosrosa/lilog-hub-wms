import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  SalvarAlocacoesTransportesInput,
  SalvarAlocacoesTransportesResult,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportes } from '../providers/drizzle/config/migrations/schema.js';

export async function salvarAlocacoesTransportesDb(
  db: DrizzleClient,
  input: SalvarAlocacoesTransportesInput,
): Promise<SalvarAlocacoesTransportesResult> {
  if (input.alocacoes.length === 0) {
    return { atualizados: 0 };
  }

  const transporteIds = input.alocacoes.map((item) => item.transporteId);

  const existentes = await db
    .select({ id: transportes.id })
    .from(transportes)
    .where(
      and(
        eq(transportes.unidadeId, input.unidadeId),
        inArray(transportes.id, transporteIds),
      ),
    );

  const idsValidos = new Set(existentes.map((item) => item.id));
  const alocacoesValidas = input.alocacoes.filter((item) =>
    idsValidos.has(item.transporteId),
  );

  if (alocacoesValidas.length === 0) {
    return { atualizados: 0 };
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    const valueRows = alocacoesValidas.map(
      (alocacao) => sql`(
        ${alocacao.transporteId}::uuid,
        ${'alocado'},
        ${alocacao.placa},
        ${alocacao.transportadora},
        ${alocacao.motorista?.trim() || null},
        ${alocacao.perfilPagamentoId ?? null},
        ${alocacao.perfilPagamentoNome?.trim() || null},
        ${alocacao.semCusto ?? false},
        ${alocacao.itinerario?.trim() || null},
        ${alocacao.nivelPrioridade ?? null},
        ${
          alocacao.horarioExpectativaSaida
            ? new Date(alocacao.horarioExpectativaSaida)
            : null
        },
        ${alocacao.cidade !== undefined ? alocacao.cidade.trim() : null},
        ${alocacao.bairro !== undefined ? alocacao.bairro?.trim() || null : null},
        ${alocacao.isPrioridade ?? null},
        ${now}
      )`,
    );

    await tx.execute(sql`
      UPDATE ${transportes} AS t
      SET
        status = v.status,
        placa = v.placa,
        transportadora = v.transportadora,
        motorista = v.motorista,
        perfil_pagamento_id = v.perfil_pagamento_id,
        perfil_pagamento_nome = v.perfil_pagamento_nome,
        frete_sem_custo = v.frete_sem_custo,
        itinerario = v.itinerario,
        nivel_prioridade = v.nivel_prioridade,
        horario_expectativa_saida = v.horario_expectativa_saida,
        cidade = COALESCE(v.cidade, t.cidade),
        bairro = COALESCE(v.bairro, t.bairro),
        is_prioridade = COALESCE(v.is_prioridade, t.is_prioridade),
        updated_at = v.updated_at
      FROM (
        VALUES ${sql.join(valueRows, sql`, `)}
      ) AS v(
        id,
        status,
        placa,
        transportadora,
        motorista,
        perfil_pagamento_id,
        perfil_pagamento_nome,
        frete_sem_custo,
        itinerario,
        nivel_prioridade,
        horario_expectativa_saida,
        cidade,
        bairro,
        is_prioridade,
        updated_at
      )
      WHERE t.id = v.id
        AND t.unidade_id = ${input.unidadeId}
    `);
  });

  return { atualizados: alocacoesValidas.length };
}
