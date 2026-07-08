import { and, eq } from 'drizzle-orm';

import type {
  AtualizarFaltaPesoInput,
  DevolucaoFaltaPesoRecord,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  formatQuantidadeContabilDb,
  resolveQuantidadeContabilConsiderada,
} from '../../../application/services/devolucao/resolve-quantidade-contabil-falta-peso.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoFaltasPeso,
  devolucaoItens,
} from '../providers/drizzle/config/migrations/schema.js';
import { buscarFaltaPesoRecordByIdDb } from './listar-faltas-peso.drizzle.js';
import { FaltaPesoDevolucaoValidationError } from './registrar-falta-peso.drizzle.js';

export async function atualizarFaltaPesoDb(
  db: DrizzleClient,
  input: AtualizarFaltaPesoInput,
): Promise<DevolucaoFaltaPesoRecord | null> {
  const updatedId = await db.transaction(async (tx) => {
    const [demanda] = await tx
      .select({ id: demandasDevolucao.id })
      .from(demandasDevolucao)
      .where(
        and(
          eq(demandasDevolucao.id, input.demandaId),
          eq(demandasDevolucao.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!demanda) {
      return null;
    }

    const [faltaAtual] = await tx
      .select({
        id: devolucaoFaltasPeso.id,
        itemId: devolucaoFaltasPeso.itemId,
        status: devolucaoFaltasPeso.status,
        quantidadeFiscalOriginal: devolucaoFaltasPeso.quantidadeFiscalOriginal,
      })
      .from(devolucaoFaltasPeso)
      .where(
        and(
          eq(devolucaoFaltasPeso.id, input.faltaPesoId),
          eq(devolucaoFaltasPeso.demandaId, demanda.id),
        ),
      )
      .limit(1);

    if (!faltaAtual) {
      return null;
    }

    if (faltaAtual.status !== 'pendente' && faltaAtual.status !== 'validada') {
      throw new FaltaPesoDevolucaoValidationError(
        'Somente faltas de peso ativas podem ser editadas.',
      );
    }

    const quantidadeFiscalOriginal =
      faltaAtual.quantidadeFiscalOriginal !== null
        ? Number(faltaAtual.quantidadeFiscalOriginal)
        : 0;
    const quantidadeContabilConsiderada = resolveQuantidadeContabilConsiderada(
      quantidadeFiscalOriginal,
      input.zerarQuantidadeContabil,
    );

    const [updated] = await tx
      .update(devolucaoFaltasPeso)
      .set({
        pesoEsperadoKg: input.diferencaKg.toFixed(3),
        pesoDevolvidoKg: '0.000',
        quantidadeContabilConsiderada: formatQuantidadeContabilDb(
          quantidadeContabilConsiderada,
        ),
        zerarQuantidadeContabil: input.zerarQuantidadeContabil,
        observacao: input.observacao ?? null,
        status: 'validada',
        validadoEm: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(devolucaoFaltasPeso.id, faltaAtual.id))
      .returning({ id: devolucaoFaltasPeso.id });

    if (!updated) {
      return null;
    }

    await tx
      .update(devolucaoItens)
      .set({ pesoDevolvido: input.diferencaKg.toFixed(3) })
      .where(eq(devolucaoItens.id, faltaAtual.itemId));

    return updated.id;
  });

  if (!updatedId) {
    return null;
  }

  return buscarFaltaPesoRecordByIdDb(db, updatedId);
}
