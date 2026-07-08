import { Inject, Injectable } from '@nestjs/common';

import type { ListarTransportesResponseDto } from '../../dtos/expedicao/listar-transportes.dto.js';
import { calcularBreakdownQuantidade } from '../../services/expedicao/calcular-breakdown-quantidade.js';
import type { RemessaViewRow } from '../../../infra/db/providers/drizzle/config/schemas/expedicao.schema.js';
import type { StatusTransporteOperacional } from '../../../domain/repositories/expedicao/transporte.repository.js';
import { listRemessaItensByRemessaIdsDb } from '../../../infra/db/expedicao/list-remessa-itens-by-remessa-ids.drizzle.js';
import { listTransporteIdsComMapaConferenciaReentregaDb } from '../../../infra/db/expedicao/mapa-conferencia-reentrega.drizzle.js';
import { listTransportesDb } from '../../../infra/db/expedicao/list-transportes.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

type ListarTransportesInput = {
  unidadeId: string;
};

function parseNumeric(value: string | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapStatus(
  status: StatusTransporteOperacional,
): ListarTransportesResponseDto['transportes'][number]['status'] {
  return status.toUpperCase() as ListarTransportesResponseDto['transportes'][number]['status'];
}

function mapRemessa(
  remessa: RemessaViewRow,
  itensPorRemessaId: Map<
    string,
    ReturnType<typeof mapRemessaItem>[]
  >,
) {
  return {
    id: remessa.id,
    remessa: remessa.remessa,
    empresa: remessa.empresa,
    codCliente: remessa.codCliente,
    cliente: remessa.cliente,
    cidade: remessa.cidade,
    peso: parseNumeric(remessa.peso) ?? 0,
    volume: parseNumeric(remessa.volume) ?? 0,
    origem: remessa.origem,
    motivoReentrega: remessa.motivoReentrega,
    itinerario: remessa.itinerario,
    itinerarioId: remessa.itinerarioId ?? null,
    itens: itensPorRemessaId.get(remessa.id) ?? [],
  };
}

function mapRemessaItem(
  row: Awaited<ReturnType<typeof listRemessaItensByRemessaIdsDb>>[number],
  empresaRemessa: string,
) {
  const quantidadeNormalizadaUnidades =
    parseNumeric(row.quantidadeNormalizadaUnidades) ?? 0;

  return {
    id: row.id,
    sku: row.sku,
    produtoId: row.produtoId,
    empresa: row.empresaProduto ?? empresaRemessa,
    categoria: row.categoriaProduto ?? 'sem_categoria',
    lote: row.lote,
    dataFabricacao: row.dataFabricacao,
    faixa: row.faixa,
    peso: parseNumeric(row.peso),
    quantidade: parseNumeric(row.quantidade) ?? 0,
    unidadeMedida: row.unidadeMedida,
    quantidadeNormalizadaUnidades,
    breakdown: calcularBreakdownQuantidade(
      quantidadeNormalizadaUnidades,
      row.unidadesPorCaixa,
      row.caixasPorPalete,
      row.pesoBrutoUnidade,
      row.pesoBrutoCaixa,
      row.pesoBrutoPalete,
      row.pesoLiquidoUnidade,
      row.pesoLiquidoCaixa,
      row.pesoLiquidoPalete,
    ),
    unidadesPorCaixa: row.unidadesPorCaixa,
    caixasPorPalete: row.caixasPorPalete,
    pesoBrutoUnidade: row.pesoBrutoUnidade,
    pesoBrutoCaixa: row.pesoBrutoCaixa,
    pesoBrutoPalete: row.pesoBrutoPalete,
    pesoLiquidoUnidade: row.pesoLiquidoUnidade,
    pesoLiquidoCaixa: row.pesoLiquidoCaixa,
    pesoLiquidoPalete: row.pesoLiquidoPalete,
    descricao: row.descricaoProduto,
  };
}

@Injectable()
export class ListarTransportesUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  async execute(
    input: ListarTransportesInput,
  ): Promise<ListarTransportesResponseDto> {
    const rows = await listTransportesDb(this.db, input.unidadeId);
    const remessaIds = rows.flatMap((row) => row.remessas.map((r) => r.id));
    const itensRows = await listRemessaItensByRemessaIdsDb(
      this.db,
      remessaIds,
    );

    const itensPorRemessaId = new Map<
      string,
      ReturnType<typeof mapRemessaItem>[]
    >();

    const remessaPorId = new Map(
      rows.flatMap((transporte) =>
        transporte.remessas.map((remessa) => [remessa.id, remessa] as const),
      ),
    );

    itensRows.forEach((row) => {
      const remessa = remessaPorId.get(row.remessaId);
      if (!remessa) {
        return;
      }

      const atual = itensPorRemessaId.get(row.remessaId) ?? [];
      atual.push(mapRemessaItem(row, remessa.empresa));
      itensPorRemessaId.set(row.remessaId, atual);
    });

    const transporteIds = rows.map((row) => row.numeroTransporte);
    const transportesComMapaConfReentrega =
      await listTransporteIdsComMapaConferenciaReentregaDb(
        this.db,
        input.unidadeId,
        transporteIds,
      );

    return {
      transportes: rows.map((row) => ({
        id: row.numeroTransporte,
        uploadLoteId: row.uploadLoteId,
        rota: row.numeroTransporte,
        regiao: row.regiao,
        cidade: row.cidade,
        bairro: row.bairro,
        dataTransporte: row.dataTransporte,
        horarioExpectativaSaida:
          row.horarioExpectativaSaida?.toISOString() ?? null,
        pesoTotal: parseNumeric(row.pesoTotal) ?? 0,
        volumeTotal: parseNumeric(row.volumeTotal) ?? 0,
        distanciaKm: parseNumeric(row.distanciaKm),
        itinerario: row.itinerario ?? null,
        itinerarioId: row.itinerarioId ?? null,
        perfilEsperado: row.perfilEsperado,
        status: mapStatus(row.status),
        placa: row.placa,
        motorista: row.motorista,
        transportadora: row.transportadora,
        perfilPagamentoId: row.perfilPagamentoId,
        perfilPagamentoNome: row.perfilPagamentoNome,
        custoPrevisto: parseNumeric(row.custoPrevisto),
        freteSemCusto: row.freteSemCusto,
        reentregaExclusiva: row.reentregaExclusiva,
        isPrioridade: row.isPrioridade,
        nivelPrioridade: row.nivelPrioridade,
        mapaGeradoEm: row.mapaGeradoEm?.toISOString() ?? null,
        ultimoMapaLoteId: row.ultimoMapaLoteId ?? null,
        temMapaConferenciaReentrega: transportesComMapaConfReentrega.has(
          row.numeroTransporte,
        ),
        quantidadeRemessas: row.remessas.length,
        remessas: row.remessas.map((remessa) =>
          mapRemessa(remessa, itensPorRemessaId),
        ),
      })),
    };
  }
}
