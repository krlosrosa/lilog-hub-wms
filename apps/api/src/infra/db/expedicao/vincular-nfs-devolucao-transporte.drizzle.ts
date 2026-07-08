import { and, eq, inArray, sql } from 'drizzle-orm';

import type { DevolucaoNfComItensRow } from '../devolucao/find-devolucao-nfs-by-ids.drizzle.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  devolucaoNotasFiscais,
  remessaItens,
  remessas,
  transporteRemessas,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';
import { findRemessaOrigemPorNfDb } from './find-remessa-origem-por-nf.drizzle.js';

export type VincularNfsDevolucaoTransporteInput = {
  unidadeId: string;
  transporteId: string;
  uploadLoteId: string;
  transporteCidade: string | null;
  notasFiscais: DevolucaoNfComItensRow[];
};

export type VincularNfsDevolucaoTransporteResult = {
  remessasCriadas: number;
  remessaIds: string[];
};

function somarPesoNota(nota: DevolucaoNfComItensRow): number {
  return nota.itens.reduce((total, item) => {
    const peso = item.pesoDevolvido ? Number(item.pesoDevolvido) : 0;
    return total + peso;
  }, 0);
}

export async function vincularNfsDevolucaoTransporteDb(
  db: DrizzleClient,
  input: VincularNfsDevolucaoTransporteInput,
): Promise<VincularNfsDevolucaoTransporteResult> {
  return db.transaction(async (tx) => {
    const remessaIds: string[] = [];
    let pesoAdicional = 0;
    let volumeAdicional = 0;

    for (const nota of input.notasFiscais) {
      const remessaOrigem =
        nota.transporteOrigemId != null
          ? await findRemessaOrigemPorNfDb(tx, {
              transporteOrigemId: nota.transporteOrigemId,
              numeroNf: nota.numeroNf,
              codCliente: nota.codCliente,
            })
          : null;

      const codCliente =
        nota.codCliente?.trim() ||
        remessaOrigem?.codCliente ||
        'SEM-CODIGO';
      const cliente =
        nota.cliente?.trim() ||
        remessaOrigem?.cliente ||
        'Cliente não identificado';
      const cidade =
        remessaOrigem?.cidade ||
        input.transporteCidade?.trim() ||
        'N/D';
      const empresa = remessaOrigem?.empresa || 'LDB';
      const peso = somarPesoNota(nota);
      const volume = remessaOrigem?.volume ? Number(remessaOrigem.volume) : 0;

      const [remessa] = await tx
        .insert(remessas)
        .values({
          uploadLoteId: input.uploadLoteId,
          remessa: nota.numeroNf,
          empresa,
          codCliente,
          cliente,
          cidade,
          peso: peso.toFixed(3),
          volume: volume.toFixed(3),
          origem: 'reentrega',
          motivoReentrega: nota.motivo,
        })
        .returning({ id: remessas.id });

      if (!remessa) {
        throw new Error(`Falha ao criar remessa para NF ${nota.numeroNf}`);
      }

      if (nota.itens.length > 0) {
        await tx.insert(remessaItens).values(
          nota.itens.map((item) => ({
            remessaId: remessa.id,
            sku: item.sku,
            produtoId: item.produtoId,
            lote: item.lote,
            dataFabricacao: item.dataFabricacao,
            peso: item.pesoDevolvido,
            quantidade: item.quantidade,
            unidadeMedida: item.unidadeMedida,
            quantidadeNormalizadaUnidades: item.quantidadeNormalizadaUnidades,
          })),
        );
      }

      await tx.insert(transporteRemessas).values({
        transporteId: input.transporteId,
        remessaId: remessa.id,
      });

      await tx
        .update(devolucaoNotasFiscais)
        .set({
          remessaId: remessa.id,
          updatedAt: sql`now()`,
        })
        .where(eq(devolucaoNotasFiscais.id, nota.id));

      remessaIds.push(remessa.id);
      pesoAdicional += peso;
      volumeAdicional += volume;
    }

    if (pesoAdicional > 0 || volumeAdicional > 0) {
      await tx
        .update(transportes)
        .set({
          pesoTotal: sql`${transportes.pesoTotal} + ${pesoAdicional.toFixed(3)}`,
          volumeTotal: sql`${transportes.volumeTotal} + ${volumeAdicional.toFixed(3)}`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(transportes.unidadeId, input.unidadeId),
            eq(transportes.numeroTransporte, input.transporteId),
          ),
        );
    }

    return {
      remessasCriadas: remessaIds.length,
      remessaIds,
    };
  });
}

export async function countRemessasReentregaTransporteDb(
  db: DrizzleClient,
  transporteId: string,
): Promise<number> {
  const rows = await db
    .select({ id: remessas.id })
    .from(remessas)
    .innerJoin(
      transporteRemessas,
      eq(transporteRemessas.remessaId, remessas.id),
    )
    .where(
      and(
        eq(transporteRemessas.transporteId, transporteId),
        eq(remessas.origem, 'reentrega'),
      ),
    );

  return rows.length;
}

export async function listRemessaIdsReentregaTransporteDb(
  db: DrizzleClient,
  transporteId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: remessas.id })
    .from(remessas)
    .innerJoin(
      transporteRemessas,
      eq(transporteRemessas.remessaId, remessas.id),
    )
    .where(
      and(
        eq(transporteRemessas.transporteId, transporteId),
        eq(remessas.origem, 'reentrega'),
      ),
    );

  return rows.map((row) => row.id);
}
