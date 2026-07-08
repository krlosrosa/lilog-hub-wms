import { desc, eq } from 'drizzle-orm';

import type {
  CriarLoteInput,
  UploadLoteRecord,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  remessaItens,
  remessas,
  transporteRemessas,
  transportes,
  uploadLotes,
} from '../providers/drizzle/config/migrations/schema.js';

const INSERT_BATCH_SIZE = 500;

function mapUploadLoteRecord(
  row: typeof uploadLotes.$inferSelect,
  totalTransportes: number,
): UploadLoteRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    dataReferencia: row.dataReferencia,
    horarioExpectativaSaida: row.horarioExpectativaSaida,
    nomeArquivo: row.nomeArquivo,
    totalRemessas: row.totalRemessas,
    totalTransportes,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type GrupoTransporte = {
  remessaIds: string[];
  pesoTotal: number;
  volumeTotal: number;
};

export async function createUploadLoteDb(
  db: DrizzleClient,
  input: CriarLoteInput,
): Promise<UploadLoteRecord> {
  return db.transaction(async (tx) => {
    const [lote] = await tx
      .insert(uploadLotes)
      .values({
        unidadeId: input.unidadeId,
        dataReferencia: input.dataReferencia,
        horarioExpectativaSaida: input.horarioExpectativaSaida,
        nomeArquivo: input.nomeArquivo,
        totalRemessas: input.remessas.length,
        criadoPor: input.criadoPor,
      })
      .returning();

    if (!lote) {
      throw new Error('Failed to create upload lote');
    }

    if (input.remessas.length === 0) {
      return mapUploadLoteRecord(lote, 0);
    }

    const remessasInseridas: (typeof remessas.$inferSelect)[] = [];

    for (let i = 0; i < input.remessas.length; i += INSERT_BATCH_SIZE) {
      const batch = input.remessas.slice(i, i + INSERT_BATCH_SIZE);
      const inserted = await tx
        .insert(remessas)
        .values(
          batch.map((item) => ({
            uploadLoteId: lote.id,
            remessa: item.remessa,
            empresa: item.empresa,
            codCliente: item.codCliente,
            cliente: item.cliente,
            cidade: item.cidade,
            peso: item.peso.toFixed(3),
            volume: item.volume.toFixed(3),
            origem: 'upload' as const,
          })),
        )
        .returning();

      remessasInseridas.push(...inserted);
    }

    const itensParaInserir = input.remessas.flatMap((item, index) => {
      const remessaInserida = remessasInseridas[index];

      if (!remessaInserida || item.itens.length === 0) {
        return [];
      }

      return item.itens.map((remessaItem) => ({
        remessaId: remessaInserida.id,
        sku: remessaItem.sku,
        produtoId: remessaItem.produtoId,
        lote: remessaItem.lote,
        dataFabricacao: remessaItem.dataFabricacao,
        faixa: remessaItem.faixa,
        peso: remessaItem.peso?.toFixed(3) ?? null,
        quantidade: remessaItem.quantidade.toFixed(3),
        unidadeMedida: remessaItem.unidadeMedida,
        quantidadeNormalizadaUnidades:
          remessaItem.quantidadeNormalizadaUnidades.toFixed(3),
      }));
    });

    for (let i = 0; i < itensParaInserir.length; i += INSERT_BATCH_SIZE) {
      const batch = itensParaInserir.slice(i, i + INSERT_BATCH_SIZE);
      await tx.insert(remessaItens).values(batch);
    }

    const gruposTransporte = new Map<string, GrupoTransporte>();

    input.remessas.forEach((item, index) => {
      const remessaInserida = remessasInseridas[index];

      if (!remessaInserida) {
        return;
      }

      const atual = gruposTransporte.get(item.numeroTransporte) ?? {
        remessaIds: [],
        pesoTotal: 0,
        volumeTotal: 0,
      };

      atual.remessaIds.push(remessaInserida.id);
      atual.pesoTotal += item.peso;
      atual.volumeTotal += item.volume;

      gruposTransporte.set(item.numeroTransporte, atual);
    });

    for (const [numeroTransporte, grupo] of gruposTransporte) {
      const [transporte] = await tx
        .insert(transportes)
        .values({
          unidadeId: input.unidadeId,
          uploadLoteId: lote.id,
          numeroTransporte,
          dataTransporte: input.dataReferencia,
          horarioExpectativaSaida: input.horarioExpectativaSaida,
          pesoTotal: grupo.pesoTotal.toFixed(3),
          volumeTotal: grupo.volumeTotal.toFixed(3),
          status: 'pendente',
        })
        .returning();

      if (!transporte) {
        throw new Error(`Failed to create transporte ${numeroTransporte}`);
      }

      for (
        let i = 0;
        i < grupo.remessaIds.length;
        i += INSERT_BATCH_SIZE
      ) {
        const batch = grupo.remessaIds.slice(i, i + INSERT_BATCH_SIZE);

        if (batch.length === 0) {
          continue;
        }

        await tx.insert(transporteRemessas).values(
          batch.map((remessaId) => ({
            transporteId: transporte.numeroTransporte,
            remessaId,
          })),
        );
      }
    }

    return mapUploadLoteRecord(lote, gruposTransporte.size);
  });
}

export async function listUploadLotesDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<UploadLoteRecord[]> {
  const rows = await db
    .select()
    .from(uploadLotes)
    .where(eq(uploadLotes.unidadeId, unidadeId))
    .orderBy(desc(uploadLotes.createdAt));

  return rows.map((row) => mapUploadLoteRecord(row, 0));
}
