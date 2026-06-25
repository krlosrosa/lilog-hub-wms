import { and, eq, inArray } from 'drizzle-orm';

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
    for (const alocacao of alocacoesValidas) {
      await tx
        .update(transportes)
        .set({
          status: 'alocado',
          placa: alocacao.placa,
          transportadora: alocacao.transportadora,
          motorista: alocacao.motorista?.trim() || null,
          perfilPagamentoId: alocacao.perfilPagamentoId ?? null,
          perfilPagamentoNome: alocacao.perfilPagamentoNome?.trim() || null,
          freteSemCusto: alocacao.semCusto ?? false,
          itinerario: alocacao.itinerario?.trim() || null,
          nivelPrioridade: alocacao.nivelPrioridade ?? null,
          horarioExpectativaSaida: alocacao.horarioExpectativaSaida
            ? new Date(alocacao.horarioExpectativaSaida)
            : null,
          ...(alocacao.cidade !== undefined
            ? { cidade: alocacao.cidade.trim() }
            : {}),
          ...(alocacao.bairro !== undefined
            ? { bairro: alocacao.bairro?.trim() || null }
            : {}),
          ...(alocacao.isPrioridade !== undefined
            ? { isPrioridade: alocacao.isPrioridade }
            : {}),
          updatedAt: now,
        })
        .where(
          and(
            eq(transportes.id, alocacao.transporteId),
            eq(transportes.unidadeId, input.unidadeId),
          ),
        );
    }
  });

  return { atualizados: alocacoesValidas.length };
}
