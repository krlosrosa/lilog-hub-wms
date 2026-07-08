import { and, eq, inArray } from 'drizzle-orm';

import type {
  DevolucaoFaltaPesoTratativaContabil,
  RegistrarFaltaPesoInput,
  RegistrarFaltaPesoResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import { MOTIVO_FALTA_PESO_DEVOLUCAO } from '../../../shared/constants/devolucao-falta-peso.js';
import {
  formatQuantidadeContabilDb,
  resolveQuantidadeContabilConsiderada,
} from '../../../application/services/devolucao/resolve-quantidade-contabil-falta-peso.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoFaltasPeso,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  isProdutoTipoPvar,
  joinProdutoDevolucaoItemPorCodigoProdutoId,
  joinProdutoDevolucaoItemPorProdutoId,
  joinProdutoDevolucaoItemPorSku,
  produtoPorCodigoProdutoId,
  produtoPorProdutoId,
  produtoPorSku,
  produtoTipoDevolucaoItem,
} from './produto-devolucao-item.drizzle.js';

export class FaltaPesoDevolucaoConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FaltaPesoDevolucaoConflictError';
  }
}

export class FaltaPesoDevolucaoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FaltaPesoDevolucaoValidationError';
  }
}

export async function registrarFaltaPesoDb(
  db: DrizzleClient,
  input: RegistrarFaltaPesoInput,
): Promise<RegistrarFaltaPesoResult | null> {
  return db.transaction(async (tx) => {
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

    const [notaFiscal] = await tx
      .select({ id: devolucaoNotasFiscais.id })
      .from(devolucaoNotasFiscais)
      .where(
        and(
          eq(devolucaoNotasFiscais.id, input.notaFiscalId),
          eq(devolucaoNotasFiscais.demandaId, demanda.id),
        ),
      )
      .limit(1);

    if (!notaFiscal) {
      throw new FaltaPesoDevolucaoValidationError(
        'Nota fiscal não pertence à demanda informada.',
      );
    }

    const [item] = await tx
      .select({
        id: devolucaoItens.id,
        sku: devolucaoItens.sku,
        produtoTipo: produtoTipoDevolucaoItem,
        quantidadeNormalizadaUnidades:
          devolucaoItens.quantidadeNormalizadaUnidades,
      })
      .from(devolucaoItens)
      .leftJoin(
        produtoPorProdutoId,
        joinProdutoDevolucaoItemPorProdutoId(devolucaoItens.produtoId),
      )
      .leftJoin(
        produtoPorSku,
        joinProdutoDevolucaoItemPorSku(devolucaoItens.sku),
      )
      .leftJoin(
        produtoPorCodigoProdutoId,
        joinProdutoDevolucaoItemPorCodigoProdutoId(devolucaoItens.sku),
      )
      .where(
        and(
          eq(devolucaoItens.id, input.itemId),
          eq(devolucaoItens.devolucaoNfId, notaFiscal.id),
        ),
      )
      .limit(1);

    if (!item) {
      throw new FaltaPesoDevolucaoValidationError(
        'Item não pertence à nota fiscal informada.',
      );
    }

    if (!isProdutoTipoPvar(item.produtoTipo)) {
      throw new FaltaPesoDevolucaoValidationError(
        'Somente produtos de peso variável (PVAR) podem registrar falta de peso.',
      );
    }

    if (item.sku !== input.sku) {
      throw new FaltaPesoDevolucaoValidationError(
        'SKU informado não corresponde ao item selecionado.',
      );
    }

    const registrosAtivos = await tx
      .select({ id: devolucaoFaltasPeso.id })
      .from(devolucaoFaltasPeso)
      .where(
        and(
          eq(devolucaoFaltasPeso.itemId, item.id),
          inArray(devolucaoFaltasPeso.status, ['pendente', 'validada']),
        ),
      )
      .limit(1);

    if (registrosAtivos.length > 0) {
      throw new FaltaPesoDevolucaoConflictError(
        'Já existe uma falta de peso ativa para este item.',
      );
    }

    const quantidadeFiscalOriginal = Number(item.quantidadeNormalizadaUnidades);
    const zerarQuantidadeContabil = input.zerarQuantidadeContabil ?? true;
    const quantidadeContabilConsiderada = resolveQuantidadeContabilConsiderada(
      quantidadeFiscalOriginal,
      zerarQuantidadeContabil,
    );

    const [faltaPeso] = await tx
      .insert(devolucaoFaltasPeso)
      .values({
        demandaId: demanda.id,
        notaFiscalId: notaFiscal.id,
        itemId: item.id,
        sku: input.sku,
        pesoEsperadoKg: input.diferencaKg.toFixed(3),
        pesoDevolvidoKg: '0.000',
        quantidadeFiscalOriginal: quantidadeFiscalOriginal.toFixed(3),
        quantidadeContabilConsiderada: formatQuantidadeContabilDb(
          quantidadeContabilConsiderada,
        ),
        tratativaContabil: 'diferenca_peso',
        zerarQuantidadeContabil,
        motivo: MOTIVO_FALTA_PESO_DEVOLUCAO,
        observacao: input.observacao ?? null,
        status: 'validada',
        registradoPorUserId: input.registradoPorUserId ?? null,
        validadoPorUserId: input.registradoPorUserId ?? null,
        validadoEm: new Date(),
      })
      .returning({
        id: devolucaoFaltasPeso.id,
        demandaId: devolucaoFaltasPeso.demandaId,
        itemId: devolucaoFaltasPeso.itemId,
        pesoFaltanteKg: devolucaoFaltasPeso.pesoFaltanteKg,
        quantidadeFiscalOriginal: devolucaoFaltasPeso.quantidadeFiscalOriginal,
        quantidadeContabilConsiderada:
          devolucaoFaltasPeso.quantidadeContabilConsiderada,
        tratativaContabil: devolucaoFaltasPeso.tratativaContabil,
        zerarQuantidadeContabil: devolucaoFaltasPeso.zerarQuantidadeContabil,
        status: devolucaoFaltasPeso.status,
      });

    if (!faltaPeso) {
      return null;
    }

    await tx
      .update(devolucaoItens)
      .set({ pesoDevolvido: input.diferencaKg.toFixed(3) })
      .where(eq(devolucaoItens.id, item.id));

    return {
      id: faltaPeso.id,
      demandaId: faltaPeso.demandaId,
      itemId: faltaPeso.itemId,
      pesoFaltanteKg: Number(faltaPeso.pesoFaltanteKg ?? 0),
      quantidadeFiscalOriginal:
        faltaPeso.quantidadeFiscalOriginal !== null
          ? Number(faltaPeso.quantidadeFiscalOriginal)
          : null,
      quantidadeContabilConsiderada: Number(
        faltaPeso.quantidadeContabilConsiderada ?? 0,
      ),
      tratativaContabil:
        faltaPeso.tratativaContabil as DevolucaoFaltaPesoTratativaContabil,
      zerarQuantidadeContabil: faltaPeso.zerarQuantidadeContabil,
      status: faltaPeso.status,
    };
  });
}
