import { alias } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import type {
  InteracaoAutor,
  InteracaoTipo,
  ProcessoDebitoDetalheRecord,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import {
  calcularPesoTotalItemDebito,
  calcularQtdAnomaliaItemDebito,
} from '../../../application/services/cobranca-transportadora/calcular-item-debito-peso.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';
import {
  cobrancaEventos,
  cortes,
  demandasDevolucao,
  devolucaoAvarias,
  devolucaoItens,
  devolucaoNotasFiscais,
  mapaGrupos,
  mapaLotes,
  processoDebitoItens,
  processoDebitoInteracoes,
  processosDebito,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';
import { findProdutosByCodigosRemessaDb } from '../produto/find-produtos-by-codigos-remessa.drizzle.js';

const eventoUser = alias(users, 'evento_user');
const solicitanteUser = alias(users, 'solicitante_user');

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  return typeof value === 'number' ? value : Number(value);
}

function toAnexoChaves(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export async function buscarProcessoDebitoDetalheDb(
  db: DrizzleClient,
  processoId: string,
  unidadeId: string,
): Promise<ProcessoDebitoDetalheRecord | null> {
  const [processoRow] = await db
    .select({
      id: processosDebito.id,
      unidadeId: processosDebito.unidadeId,
      demandaId: processosDebito.demandaId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      transporteId: processosDebito.transporteId,
      transportadoraId: processosDebito.transportadoraId,
      transportadoraNome: processosDebito.transportadoraNome,
      status: processosDebito.status,
      valorTotal: processosDebito.valorTotal,
      quantidadeItens: processosDebito.quantidadeItens,
      observacao: processosDebito.observacao,
      createdAt: processosDebito.createdAt,
      updatedAt: processosDebito.updatedAt,
      demandaPlaca: demandasDevolucao.placa,
      demandaDoca: demandasDevolucao.doca,
      demandaCargaSegregada: demandasDevolucao.cargaSegregada,
      demandaPaletesEsperados: demandasDevolucao.paletesEsperados,
    })
    .from(processosDebito)
    .innerJoin(
      demandasDevolucao,
      eq(processosDebito.demandaId, demandasDevolucao.id),
    )
    .where(
      and(
        eq(processosDebito.id, processoId),
        eq(processosDebito.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  if (!processoRow) return null;

  const itemRows = await db
    .select()
    .from(processoDebitoItens)
    .where(eq(processoDebitoItens.processoDebitoId, processoId))
    .orderBy(asc(processoDebitoItens.createdAt));

  const eventoRows = await db
    .select({
      id: cobrancaEventos.id,
      entidadeTipo: cobrancaEventos.entidadeTipo,
      entidadeId: cobrancaEventos.entidadeId,
      statusAnterior: cobrancaEventos.statusAnterior,
      statusNovo: cobrancaEventos.statusNovo,
      descricao: cobrancaEventos.descricao,
      criadoPorUserId: cobrancaEventos.criadoPorUserId,
      criadoPorNome: eventoUser.name,
      createdAt: cobrancaEventos.createdAt,
    })
    .from(cobrancaEventos)
    .leftJoin(eventoUser, eq(cobrancaEventos.criadoPorUserId, eventoUser.id))
    .where(
      and(
        eq(cobrancaEventos.entidadeTipo, 'processo'),
        eq(cobrancaEventos.entidadeId, processoId),
      ),
    )
    .orderBy(asc(cobrancaEventos.createdAt));

  const itemIds = itemRows
    .map((item) => item.itemId)
    .filter((id): id is string => id != null);

  const avariaIds = itemRows
    .map((item) => item.avariaId)
    .filter((id): id is string => id != null);

  const [devolucaoItemRows, notaFiscalRows, avariaRows] = await Promise.all([
      itemIds.length > 0
        ? db
            .select({
              id: devolucaoItens.id,
              lote: devolucaoItens.lote,
              qtdConferida: devolucaoItens.qtdConferida,
            })
            .from(devolucaoItens)
            .where(inArray(devolucaoItens.id, itemIds))
        : Promise.resolve([]),
      db
        .select({
          id: devolucaoNotasFiscais.id,
          numeroNf: devolucaoNotasFiscais.numeroNf,
          tipo: devolucaoNotasFiscais.tipo,
          cliente: devolucaoNotasFiscais.cliente,
          transporteId: devolucaoNotasFiscais.transporteId,
        })
        .from(devolucaoNotasFiscais)
        .where(eq(devolucaoNotasFiscais.demandaId, processoRow.demandaId))
        .orderBy(asc(devolucaoNotasFiscais.createdAt)),
      avariaIds.length > 0
        ? db
            .select({
              id: devolucaoAvarias.id,
              tipo: devolucaoAvarias.tipo,
              natureza: devolucaoAvarias.natureza,
              photoUrls: devolucaoAvarias.photoUrls,
              createdAt: devolucaoAvarias.createdAt,
            })
            .from(devolucaoAvarias)
            .where(inArray(devolucaoAvarias.id, avariaIds))
        : Promise.resolve([]),
    ]);

  const devolucaoItemById = new Map(
    devolucaoItemRows.map((row) => [row.id, row]),
  );

  const skus = itemRows
    .map((item) => item.sku)
    .filter((sku): sku is string => sku != null && sku.trim().length > 0);

  const produtosPorSku = await findProdutosByCodigosRemessaDb(db, skus);

  const transporteIdResolved =
    processoRow.transporteId ?? notaFiscalRows[0]?.transporteId ?? null;

  const transporteRow = transporteIdResolved
    ? await db
        .select({
          numeroTransporte: transportes.numeroTransporte,
          motorista: transportes.motorista,
          placa: transportes.placa,
          perfilEsperado: transportes.perfilEsperado,
          perfilPagamentoNome: transportes.perfilPagamentoNome,
          regiao: transportes.regiao,
          cidade: transportes.cidade,
          bairro: transportes.bairro,
          itinerario: transportes.itinerario,
          status: transportes.status,
          mapaGeradoEm: transportes.mapaGeradoEm,
          volumeTotal: transportes.volumeTotal,
        })
        .from(transportes)
        .where(
          and(
            eq(transportes.numeroTransporte, transporteIdResolved),
            eq(transportes.unidadeId, unidadeId),
          ),
        )
        .limit(1)
    : [];

  const [corteRows, mapaGrupoRows] = transporteIdResolved
    ? await Promise.all([
        db
          .select({
            id: cortes.id,
            codigo: cortes.codigo,
            rota: cortes.rota,
            doca: cortes.doca,
            totalVolumes: cortes.totalVolumes,
            pesoTotalKg: cortes.pesoTotalKg,
            status: cortes.status,
            solicitadoEm: cortes.solicitadoEm,
            separadorNome: solicitanteUser.name,
          })
          .from(cortes)
          .leftJoin(
            solicitanteUser,
            eq(cortes.solicitadoPor, solicitanteUser.id),
          )
          .where(
            and(
              eq(cortes.transporteId, transporteIdResolved),
              eq(cortes.unidadeId, unidadeId),
            ),
          )
          .orderBy(desc(cortes.solicitadoEm)),
        db
          .select({
            microUuid: mapaGrupos.microUuid,
            totalItens: mapaGrupos.totalItens,
            createdAt: mapaGrupos.createdAt,
            cabecalho: mapaGrupos.cabecalho,
          })
          .from(mapaGrupos)
          .innerJoin(mapaLotes, eq(mapaGrupos.mapaLoteId, mapaLotes.id))
          .where(
            and(
              eq(mapaGrupos.transporteId, transporteIdResolved),
              eq(mapaGrupos.processo, 'separacao'),
              eq(mapaLotes.unidadeId, unidadeId),
            ),
          )
          .orderBy(desc(mapaGrupos.createdAt))
          .limit(1),
      ])
    : [[], []];

  const transporteData = transporteRow[0] ?? null;

  const mapaGrupo = mapaGrupoRows[0] ?? null;
  const cabecalho = mapaGrupo?.cabecalho as
    | { totalPaletes?: number; totalCaixas?: number }
    | null
    | undefined;

  const totalVolumesMapa =
    cabecalho?.totalPaletes ??
    cabecalho?.totalCaixas ??
    (transporteData?.volumeTotal != null
      ? Math.round(toNumber(transporteData.volumeTotal) ?? 0)
      : 0);

  const interacaoRows = await db
    .select({
      id: processoDebitoInteracoes.id,
      processoDebitoId: processoDebitoInteracoes.processoDebitoId,
      autor: processoDebitoInteracoes.autor,
      tipo: processoDebitoInteracoes.tipo,
      descricao: processoDebitoInteracoes.descricao,
      anexoChaves: processoDebitoInteracoes.anexoChaves,
      transportadoraId: processoDebitoInteracoes.transportadoraId,
      criadoPorUserId: processoDebitoInteracoes.criadoPorUserId,
      createdAt: processoDebitoInteracoes.createdAt,
    })
    .from(processoDebitoInteracoes)
    .where(eq(processoDebitoInteracoes.processoDebitoId, processoId))
    .orderBy(asc(processoDebitoInteracoes.createdAt));

  return {
    id: processoRow.id,
    unidadeId: processoRow.unidadeId,
    demandaId: processoRow.demandaId,
    codigoDemanda: processoRow.codigoDemanda,
    transporteId: transporteIdResolved,
    transportadoraId: processoRow.transportadoraId,
    transportadoraNome: processoRow.transportadoraNome,
    status: processoRow.status,
    valorTotal: Number(processoRow.valorTotal),
    quantidadeItens: processoRow.quantidadeItens,
    observacao: processoRow.observacao,
    createdAt: processoRow.createdAt,
    updatedAt: processoRow.updatedAt,
    demanda: {
      placa: processoRow.demandaPlaca,
      doca: processoRow.demandaDoca,
      cargaSegregada: processoRow.demandaCargaSegregada,
      paletesEsperados: processoRow.demandaPaletesEsperados,
    },
    transporte: transporteData
      ? {
          numeroTransporte: transporteData.numeroTransporte,
          motorista: transporteData.motorista,
          placa: transporteData.placa,
          perfilEsperado: transporteData.perfilEsperado,
          perfilPagamentoNome: transporteData.perfilPagamentoNome,
          regiao: transporteData.regiao,
          cidade: transporteData.cidade,
          bairro: transporteData.bairro,
          itinerario: transporteData.itinerario,
          status: transporteData.status,
          mapaGeradoEm: transporteData.mapaGeradoEm,
        }
      : null,
    notasFiscais: notaFiscalRows.map((nf) => ({
      id: nf.id,
      numeroNf: nf.numeroNf,
      tipo: nf.tipo,
      cliente: nf.cliente,
      transporteId: nf.transporteId,
    })),
    evidencias: avariaRows.flatMap((avaria) => {
      const photoUrls = avaria.photoUrls ?? [];

      if (photoUrls.length === 0) {
        return [
          {
            id: avaria.id,
            avariaId: avaria.id,
            tipo: avaria.tipo,
            natureza: avaria.natureza,
            photoUrls: [],
            createdAt: avaria.createdAt,
          },
        ];
      }

      return photoUrls.map((photoRef, index) => ({
        id: `${avaria.id}-${index}`,
        avariaId: avaria.id,
        tipo: avaria.tipo,
        natureza: avaria.natureza,
        photoUrls: [photoRef],
        createdAt: avaria.createdAt,
      }));
    }),
    registrosCorte: corteRows.map((corte) => ({
      id: corte.id,
      codigo: corte.codigo,
      rota: corte.rota,
      doca: corte.doca,
      totalVolumes: corte.totalVolumes,
      pesoTotalKg: toNumber(corte.pesoTotalKg),
      separadorNome: corte.separadorNome,
      status: corte.status,
      solicitadoEm: corte.solicitadoEm,
    })),
    mapaSeparacao: mapaGrupo
      ? {
          codigo: mapaGrupo.microUuid,
          geradoEm: transporteData?.mapaGeradoEm ?? mapaGrupo.createdAt,
          totalItens: mapaGrupo.totalItens,
          totalVolumes: totalVolumesMapa,
        }
      : transporteData?.mapaGeradoEm
        ? {
            codigo: transporteIdResolved ?? '—',
            geradoEm: transporteData.mapaGeradoEm,
            totalItens: itemRows.length,
            totalVolumes: totalVolumesMapa,
          }
        : null,
    itens: itemRows.map((item) => {
      const devolucaoItem = item.itemId
        ? devolucaoItemById.get(item.itemId)
        : undefined;
      const quantidade = item.quantidade != null ? Number(item.quantidade) : null;
      const qtdConferida = devolucaoItem?.qtdConferida ?? null;
      const qtdAnomalia = calcularQtdAnomaliaItemDebito({
        tipo: item.tipo,
        quantidade,
        qtdConferida,
      });
      const produto = item.sku ? produtosPorSku.get(item.sku.trim()) : null;
      const pesoTotalKg = calcularPesoTotalItemDebito(qtdAnomalia, produto);

      return {
        id: item.id,
        processoDebitoId: item.processoDebitoId,
        demandaId: item.demandaId,
        notaFiscalId: item.notaFiscalId,
        itemId: item.itemId,
        avariaId: item.avariaId,
        faltaPesoId: item.faltaPesoId,
        tipo: item.tipo,
        sku: item.sku,
        descricaoProduto: item.descricaoProduto,
        lote: devolucaoItem?.lote ?? null,
        qtdConferida,
        quantidade,
        qtdAnomalia,
        pesoKg: item.pesoKg != null ? Number(item.pesoKg) : null,
        pesoTotalKg,
        valorUnitario:
          item.valorUnitario != null ? Number(item.valorUnitario) : null,
        valorDebito: Number(item.valorDebito),
        motivo: item.motivo,
        observacao: item.observacao,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }),
    eventos: eventoRows.map((evento) => ({
      id: evento.id,
      entidadeTipo: evento.entidadeTipo,
      entidadeId: evento.entidadeId,
      statusAnterior: evento.statusAnterior,
      statusNovo: evento.statusNovo,
      descricao: evento.descricao,
      criadoPorUserId: evento.criadoPorUserId,
      criadoPorNome: evento.criadoPorNome,
      createdAt: evento.createdAt,
    })),
    interacoes: interacaoRows.map((interacao) => ({
      id: interacao.id,
      processoDebitoId: interacao.processoDebitoId,
      autor: interacao.autor as InteracaoAutor,
      tipo: interacao.tipo as InteracaoTipo,
      descricao: interacao.descricao,
      anexoChaves: toAnexoChaves(interacao.anexoChaves),
      transportadoraId: interacao.transportadoraId,
      criadoPorUserId: interacao.criadoPorUserId,
      createdAt: interacao.createdAt,
    })),
  };
}
