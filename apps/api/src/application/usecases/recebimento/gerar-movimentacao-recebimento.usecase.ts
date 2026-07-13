import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  buildMovimentacaoXlsx,
  createMovimentacaoXlsxRow,
  type MovimentacaoXlsxRow,
} from '../../services/recebimento/build-movimentacao-xlsx.js';
import type {
  MovimentacaoAvariaRecord,
  MovimentacaoConferidoRecord,
  MovimentacaoDataRecord,
  MovimentacaoEsperadoRecord,
} from '../../../infra/db/recebimento/get-itens-movimentacao.drizzle.js';
import { getItensMovimentacaoDb } from '../../../infra/db/recebimento/get-itens-movimentacao.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type CentrosPorEmpresaInput = {
  LDB?: string;
  ITB?: string;
  DPA?: string;
};

export type GerarMovimentacaoRecebimentoInput = {
  preRecebimentoIds: string[];
  centrosPorEmpresa: CentrosPorEmpresaInput;
};

export type GerarMovimentacaoRecebimentoResult = {
  buffer: Buffer;
  filename: string;
};

function toCaixas(
  quantidade: number,
  unidadeMedida: string,
  unidadesPorCaixa: number,
): number {
  if (unidadeMedida === 'CX') {
    return quantidade;
  }

  const upc = unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;
  return quantidade / upc;
}

function calcularAvariaCaixasProduto(
  avarias: MovimentacaoAvariaRecord[],
  produtoId: string,
  unidadesPorCaixa: number,
): number {
  const upc = unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;

  return avarias
    .filter((avaria) => avaria.produtoId === produtoId)
    .reduce(
      (total, avaria) =>
        total +
        avaria.quantidadeCaixas +
        Math.floor(avaria.quantidadeUnidades / upc),
      0,
    );
}

function calcularAvariaPesoKgProduto(
  avarias: MovimentacaoAvariaRecord[],
  produtoId: string,
  unidadesPorCaixa: number,
  pesoBrutoCaixa: number | null,
): number {
  const avariaCaixas = calcularAvariaCaixasProduto(
    avarias,
    produtoId,
    unidadesPorCaixa,
  );

  if (!pesoBrutoCaixa || pesoBrutoCaixa <= 0) {
    return 0;
  }

  return avariaCaixas * pesoBrutoCaixa;
}

function resolveCentro(
  empresa: string,
  centrosPorEmpresa: CentrosPorEmpresaInput,
): string | null {
  const normalized = empresa.trim().toUpperCase();

  if (normalized === 'LDB' && centrosPorEmpresa.LDB) {
    return centrosPorEmpresa.LDB;
  }

  if (normalized === 'ITB' && centrosPorEmpresa.ITB) {
    return centrosPorEmpresa.ITB;
  }

  if (normalized === 'DPA' && centrosPorEmpresa.DPA) {
    return centrosPorEmpresa.DPA;
  }

  return null;
}

function listarLotes(conferidos: MovimentacaoConferidoRecord[]): string[] {
  const lotes = new Set<string>();

  for (const item of conferidos) {
    lotes.add(item.loteRecebido?.trim() || '');
  }

  return [...lotes];
}

function montarLinhasProduto(
  produtoId: string,
  conferidosProduto: MovimentacaoConferidoRecord[],
  esperado: MovimentacaoEsperadoRecord | undefined,
  avarias: MovimentacaoAvariaRecord[],
  centrosPorEmpresa: CentrosPorEmpresaInput,
): MovimentacaoXlsxRow[] {
  const referencia = conferidosProduto[0];

  if (!referencia) {
    return [];
  }

  const pesoVariavel = referencia.tipo === 'PVAR';
  const centro = resolveCentro(referencia.empresa, centrosPorEmpresa);

  if (!centro) {
    throw new BadRequestException(
      `Centro não informado para a empresa "${referencia.empresa}" (produto ${referencia.sku})`,
    );
  }

  const lotes = listarLotes(conferidosProduto);

  if (pesoVariavel) {
    const totalPesoRecebido = conferidosProduto.reduce(
      (total, item) => total + (item.pesoRecebido ?? 0),
      0,
    );
    const totalPesoEsperado = esperado?.pesoEsperado ?? totalPesoRecebido;
    const totalAvariaPeso = calcularAvariaPesoKgProduto(
      avarias,
      produtoId,
      referencia.unidadesPorCaixa,
      referencia.pesoBrutoCaixa,
    );
    const movimentarTotal = Math.max(
      0,
      Math.min(totalPesoRecebido, totalPesoEsperado) - totalAvariaPeso,
    );

    if (movimentarTotal <= 0 || totalPesoRecebido <= 0) {
      return [];
    }

    const linhas: MovimentacaoXlsxRow[] = [];

    for (const lote of lotes) {
      const pesoLote = conferidosProduto
        .filter((item) => (item.loteRecebido?.trim() || '') === lote)
        .reduce((total, item) => total + (item.pesoRecebido ?? 0), 0);

      if (pesoLote <= 0) {
        continue;
      }

      const proporcao = pesoLote / totalPesoRecebido;
      const quantidade = Number((movimentarTotal * proporcao).toFixed(3));

      if (quantidade <= 0) {
        continue;
      }

      linhas.push(
        createMovimentacaoXlsxRow({
          codigo: referencia.sku,
          utilizacaoLivre: quantidade,
          unidadeMedidaBasica: 'KG',
          loteOrigem: lote,
          loteDestino: lote,
          centro,
        }),
      );
    }

    return linhas;
  }

  const totalRecebidoCaixas = conferidosProduto.reduce(
    (total, item) =>
      total +
      toCaixas(
        item.quantidadeRecebida,
        item.unidadeMedida,
        item.unidadesPorCaixa,
      ),
    0,
  );
  const totalEsperadoCaixas = esperado
    ? toCaixas(
        esperado.quantidadeEsperada,
        esperado.unidadeMedida,
        referencia.unidadesPorCaixa,
      )
    : totalRecebidoCaixas;
  const totalAvariaCaixas = calcularAvariaCaixasProduto(
    avarias,
    produtoId,
    referencia.unidadesPorCaixa,
  );
  const movimentarTotal = Math.max(
    0,
    Math.min(totalRecebidoCaixas, totalEsperadoCaixas) - totalAvariaCaixas,
  );

  if (movimentarTotal <= 0 || totalRecebidoCaixas <= 0) {
    return [];
  }

  const linhas: MovimentacaoXlsxRow[] = [];

  for (const lote of lotes) {
    const qtdLoteCaixas = conferidosProduto
      .filter((item) => (item.loteRecebido?.trim() || '') === lote)
      .reduce(
        (total, item) =>
          total +
          toCaixas(
            item.quantidadeRecebida,
            item.unidadeMedida,
            item.unidadesPorCaixa,
          ),
        0,
      );

    if (qtdLoteCaixas <= 0) {
      continue;
    }

    const proporcao = qtdLoteCaixas / totalRecebidoCaixas;
    const quantidade = Number((movimentarTotal * proporcao).toFixed(3));

    if (quantidade <= 0) {
      continue;
    }

    linhas.push(
      createMovimentacaoXlsxRow({
        codigo: referencia.sku,
        utilizacaoLivre: quantidade,
        unidadeMedidaBasica: 'CX',
        loteOrigem: lote,
        loteDestino: lote,
        centro,
      }),
    );
  }

  return linhas;
}

function montarLinhasMovimentacao(
  data: MovimentacaoDataRecord,
  centrosPorEmpresa: CentrosPorEmpresaInput,
): MovimentacaoXlsxRow[] {
  const esperadosPorChave = new Map<string, MovimentacaoEsperadoRecord>();

  for (const esperado of data.esperados) {
    esperadosPorChave.set(
      `${esperado.preRecebimentoId}:${esperado.produtoId}`,
      esperado,
    );
  }

  const conferidosPorRecebimentoProduto = new Map<
    string,
    MovimentacaoConferidoRecord[]
  >();

  for (const conferido of data.conferidos) {
    const key = `${conferido.recebimentoId}:${conferido.produtoId}`;
    const lista = conferidosPorRecebimentoProduto.get(key) ?? [];
    lista.push(conferido);
    conferidosPorRecebimentoProduto.set(key, lista);
  }

  const linhas: MovimentacaoXlsxRow[] = [];

  for (const [key, conferidosProduto] of conferidosPorRecebimentoProduto.entries()) {
    const separatorIndex = key.indexOf(':');

    if (separatorIndex < 0) {
      continue;
    }

    const recebimentoId = key.slice(0, separatorIndex);
    const produtoId = key.slice(separatorIndex + 1);
    const preRecebimentoId = conferidosProduto[0]?.preRecebimentoId;

    if (!preRecebimentoId) {
      continue;
    }

    const esperado = esperadosPorChave.get(`${preRecebimentoId}:${produtoId}`);
    const avariasRecebimento = data.avarias.filter(
      (avaria) => avaria.recebimentoId === recebimentoId,
    );

    linhas.push(
      ...montarLinhasProduto(
        produtoId,
        conferidosProduto,
        esperado,
        avariasRecebimento,
        centrosPorEmpresa,
      ),
    );
  }

  return linhas;
}

@Injectable()
export class GerarMovimentacaoRecebimentoUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  async execute(
    input: GerarMovimentacaoRecebimentoInput,
  ): Promise<GerarMovimentacaoRecebimentoResult> {
    if (input.preRecebimentoIds.length === 0) {
      throw new BadRequestException(
        'Informe ao menos um pré-recebimento para gerar a movimentação',
      );
    }

    const data = await getItensMovimentacaoDb(this.db, input.preRecebimentoIds);

    if (data.conferidos.length === 0) {
      throw new BadRequestException(
        'Nenhum item conferido encontrado nos recebimentos selecionados',
      );
    }

    const linhas = montarLinhasMovimentacao(data, input.centrosPorEmpresa);

    if (linhas.length === 0) {
      throw new BadRequestException(
        'Nenhuma linha de movimentação pôde ser gerada com os dados informados',
      );
    }

    const buffer = buildMovimentacaoXlsx(linhas);

    return {
      buffer,
      filename: `movimentacao-migo-${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }
}
