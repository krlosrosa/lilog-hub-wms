import { and, eq } from 'drizzle-orm';

import type {
  CriarDemandaDevolucaoViagemInput,
  CriarDemandaDevolucaoViagemResult,
  DemandaDevolucaoRecord,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type {
  DrizzleClient,
  DrizzleExecutor,
} from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoEventos,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

type DemandaDevolucaoRow = Pick<
  typeof demandasDevolucao.$inferSelect,
  'id' | 'unidadeId' | 'codigoDemanda' | 'status'
>;

function mapDemandaRow(row: DemandaDevolucaoRow): DemandaDevolucaoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigoDemanda: row.codigoDemanda,
    status: row.status,
  };
}

function normalizeTransporteId(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function findDemandaDevolucaoByCodigoDb(
  db: DrizzleExecutor,
  unidadeId: string,
  codigoDemanda: string,
): Promise<DemandaDevolucaoRecord | null> {
  const [row] = await db
    .select({
      id: demandasDevolucao.id,
      unidadeId: demandasDevolucao.unidadeId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      status: demandasDevolucao.status,
    })
    .from(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.unidadeId, unidadeId),
        eq(demandasDevolucao.codigoDemanda, codigoDemanda),
      ),
    )
    .limit(1);

  return row ? mapDemandaRow(row) : null;
}

export async function criarDemandaDevolucaoViagemDb(
  db: DrizzleClient,
  input: CriarDemandaDevolucaoViagemInput,
): Promise<CriarDemandaDevolucaoViagemResult> {
  const existing = await findDemandaDevolucaoByCodigoDb(
    db,
    input.unidadeId,
    input.codigoDemanda,
  );

  if (existing) {
    return { created: false, demanda: existing };
  }

  return db.transaction(async (tx) => {
    const [demanda] = await tx
      .insert(demandasDevolucao)
      .values({
        unidadeId: input.unidadeId,
        codigoDemanda: input.codigoDemanda,
        status: 'aberta',
        observacao: input.observacao ?? null,
        placa: input.placa ?? null,
      })
      .onConflictDoNothing({
        target: [demandasDevolucao.unidadeId, demandasDevolucao.codigoDemanda],
      })
      .returning({
        id: demandasDevolucao.id,
        unidadeId: demandasDevolucao.unidadeId,
        codigoDemanda: demandasDevolucao.codigoDemanda,
        status: demandasDevolucao.status,
      });

    if (!demanda) {
      const found = await findDemandaDevolucaoByCodigoDb(
        tx,
        input.unidadeId,
        input.codigoDemanda,
      );

      return { created: false, demanda: found };
    }

    for (const notaFiscal of input.notasFiscais) {
      const [nf] = await tx
        .insert(devolucaoNotasFiscais)
        .values({
          demandaId: demanda.id,
          numeroNf: notaFiscal.numeroNf,
          tipo: notaFiscal.tipo,
          motivo: notaFiscal.motivo,
          observacao: notaFiscal.observacao ?? null,
          transporteId: normalizeTransporteId(
            notaFiscal.transporteId ?? input.transporteId,
          ),
          codCliente: notaFiscal.codCliente ?? null,
          cliente: notaFiscal.cliente ?? null,
        })
        .returning({ id: devolucaoNotasFiscais.id });

      if (!nf) {
        throw new Error('Falha ao criar nota fiscal de devolução');
      }

      if (notaFiscal.itens.length > 0) {
        await tx.insert(devolucaoItens).values(
          notaFiscal.itens.map((item) => ({
            devolucaoNfId: nf.id,
            produtoId: item.produtoId ?? null,
            sku: item.sku,
            descricaoProduto: item.descricaoProduto ?? null,
            dataFabricacao: item.dataFabricacao ?? null,
            quantidade: item.quantidade.toFixed(3),
            unidadeMedida: item.unidadeMedida,
            quantidadeNormalizadaUnidades:
              item.quantidadeNormalizadaUnidades.toFixed(3),
            pesoDevolvido:
              item.pesoDevolvido != null ? item.pesoDevolvido.toFixed(3) : null,
            motivoItem: item.motivoItem ?? null,
            observacao: item.observacao ?? null,
          })),
        );
      }
    }

    await tx.insert(devolucaoEventos).values({
      demandaId: demanda.id,
      statusAnterior: null,
      statusNovo: 'aberta',
      descricao: 'Demanda criada automaticamente via integração Ravex',
    });

    return {
      created: true,
      demanda: mapDemandaRow(demanda),
    };
  });
}
