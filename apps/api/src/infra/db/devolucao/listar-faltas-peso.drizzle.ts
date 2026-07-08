import { and, desc, eq } from 'drizzle-orm';

import type {
  DevolucaoFaltaPesoRecord,
  DevolucaoFaltaPesoStatus,
  DevolucaoFaltaPesoTratativaContabil,
  ListarFaltasPesoFilter,
  ValidarFaltaPesoInput,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoFaltasPeso,
  devolucaoItens,
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

const faltaPesoSelect = {
  id: devolucaoFaltasPeso.id,
  demandaId: devolucaoFaltasPeso.demandaId,
  notaFiscalId: devolucaoFaltasPeso.notaFiscalId,
  itemId: devolucaoFaltasPeso.itemId,
  sku: devolucaoFaltasPeso.sku,
  descricaoProduto: devolucaoItens.descricaoProduto,
  produtoTipo: produtoTipoDevolucaoItem,
  pesoEsperadoKg: devolucaoFaltasPeso.pesoEsperadoKg,
  pesoDevolvidoKg: devolucaoFaltasPeso.pesoDevolvidoKg,
  pesoFaltanteKg: devolucaoFaltasPeso.pesoFaltanteKg,
  quantidadeFiscalOriginal: devolucaoFaltasPeso.quantidadeFiscalOriginal,
  quantidadeContabilConsiderada: devolucaoFaltasPeso.quantidadeContabilConsiderada,
  tratativaContabil: devolucaoFaltasPeso.tratativaContabil,
  zerarQuantidadeContabil: devolucaoFaltasPeso.zerarQuantidadeContabil,
  motivo: devolucaoFaltasPeso.motivo,
  observacao: devolucaoFaltasPeso.observacao,
  status: devolucaoFaltasPeso.status,
  registradoPorUserId: devolucaoFaltasPeso.registradoPorUserId,
  registradoEm: devolucaoFaltasPeso.registradoEm,
  validadoPorUserId: devolucaoFaltasPeso.validadoPorUserId,
  validadoEm: devolucaoFaltasPeso.validadoEm,
  createdAt: devolucaoFaltasPeso.createdAt,
  updatedAt: devolucaoFaltasPeso.updatedAt,
};

type FaltaPesoRow = {
  id: string;
  demandaId: string;
  notaFiscalId: string;
  itemId: string;
  sku: string;
  descricaoProduto: string | null;
  produtoTipo: string | null;
  pesoEsperadoKg: string;
  pesoDevolvidoKg: string;
  pesoFaltanteKg: string | null;
  quantidadeFiscalOriginal: string | null;
  quantidadeContabilConsiderada: string;
  tratativaContabil: string;
  zerarQuantidadeContabil: boolean;
  motivo: string | null;
  observacao: string | null;
  status: DevolucaoFaltaPesoStatus;
  registradoPorUserId: number | null;
  registradoEm: Date;
  validadoPorUserId: number | null;
  validadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapFaltaPesoRow(row: FaltaPesoRow): DevolucaoFaltaPesoRecord {
  return {
    id: row.id,
    demandaId: row.demandaId,
    notaFiscalId: row.notaFiscalId,
    itemId: row.itemId,
    sku: row.sku,
    descricaoProduto: row.descricaoProduto,
    pesoVariavel: isProdutoTipoPvar(row.produtoTipo),
    pesoEsperadoKg: Number(row.pesoEsperadoKg),
    pesoDevolvidoKg: Number(row.pesoDevolvidoKg),
    pesoFaltanteKg: Number(row.pesoFaltanteKg ?? 0),
    quantidadeFiscalOriginal:
      row.quantidadeFiscalOriginal !== null
        ? Number(row.quantidadeFiscalOriginal)
        : null,
    quantidadeContabilConsiderada: Number(
      row.quantidadeContabilConsiderada ?? 0,
    ),
    tratativaContabil:
      row.tratativaContabil as DevolucaoFaltaPesoTratativaContabil,
    zerarQuantidadeContabil: row.zerarQuantidadeContabil,
    motivo: row.motivo,
    observacao: row.observacao,
    status: row.status,
    registradoPorUserId: row.registradoPorUserId,
    registradoEm: row.registradoEm,
    validadoPorUserId: row.validadoPorUserId,
    validadoEm: row.validadoEm,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildFaltaPesoQuery(db: DrizzleClient) {
  return db
    .select(faltaPesoSelect)
    .from(devolucaoFaltasPeso)
    .innerJoin(devolucaoItens, eq(devolucaoFaltasPeso.itemId, devolucaoItens.id))
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
    );
}

export async function buscarFaltaPesoRecordByIdDb(
  db: DrizzleClient,
  faltaPesoId: string,
): Promise<DevolucaoFaltaPesoRecord | null> {
  const [row] = await buildFaltaPesoQuery(db)
    .where(eq(devolucaoFaltasPeso.id, faltaPesoId))
    .limit(1);

  return row ? mapFaltaPesoRow(row) : null;
}

export async function listarFaltasPesoDb(
  db: DrizzleClient,
  filter: ListarFaltasPesoFilter,
): Promise<DevolucaoFaltaPesoRecord[]> {
  const [demanda] = await db
    .select({ id: demandasDevolucao.id })
    .from(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.id, filter.demandaId),
        eq(demandasDevolucao.unidadeId, filter.unidadeId),
      ),
    )
    .limit(1);

  if (!demanda) {
    return [];
  }

  const conditions = [eq(devolucaoFaltasPeso.demandaId, demanda.id)];

  if (filter.status) {
    conditions.push(eq(devolucaoFaltasPeso.status, filter.status));
  }

  const rows = await buildFaltaPesoQuery(db)
    .where(and(...conditions))
    .orderBy(desc(devolucaoFaltasPeso.createdAt));

  return rows.map(mapFaltaPesoRow);
}

export async function validarFaltaPesoDb(
  db: DrizzleClient,
  input: ValidarFaltaPesoInput,
): Promise<DevolucaoFaltaPesoRecord | null> {
  const [demanda] = await db
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

  const [faltaAtual] = await db
    .select({ id: devolucaoFaltasPeso.id, status: devolucaoFaltasPeso.status })
    .from(devolucaoFaltasPeso)
    .where(
      and(
        eq(devolucaoFaltasPeso.id, input.faltaPesoId),
        eq(devolucaoFaltasPeso.demandaId, demanda.id),
      ),
    )
    .limit(1);

  if (!faltaAtual || faltaAtual.status !== 'pendente') {
    return null;
  }

  const [updated] = await db
    .update(devolucaoFaltasPeso)
    .set({
      status: input.status,
      validadoPorUserId: input.validadoPorUserId ?? null,
      validadoEm: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(devolucaoFaltasPeso.id, faltaAtual.id))
    .returning({ id: devolucaoFaltasPeso.id });

  if (!updated) {
    return null;
  }

  return buscarFaltaPesoRecordByIdDb(db, updated.id);
}
