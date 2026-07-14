import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  buildRelatorioConferidosXlsx,
  type RelatorioConferidosXlsxRow,
} from '../../services/recebimento/build-relatorio-conferidos-xlsx.js';
import { normalizeLote } from '../../../domain/services/montar-linhas-movimentacao-recebimento.js';
import type {
  RelatorioConferidoAvariaRecord,
  RelatorioConferidoItemRecord,
} from '../../../infra/db/recebimento/get-relatorio-conferidos.drizzle.js';
import { getRelatorioConferidosDb } from '../../../infra/db/recebimento/get-relatorio-conferidos.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type GetRelatorioItensConferidosInput = {
  recebimentoId: string;
};

export type GetRelatorioItensConferidosResult = {
  buffer: Buffer;
  filename: string;
};

type ItemAgrupado = {
  produtoId: string;
  sku: string;
  descricao: string;
  tipo: string;
  lote: string;
  unidadesPorCaixa: number;
  pesoBrutoCaixa: number | null;
  qtdCaixas: number;
  pesoKg: number;
  conferenteId: number;
  conferenteMatricula: string;
  conferenteNome: string;
};

const SITUACOES_PERMITIDAS = new Set(['conferido', 'finalizado']);

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

function calcularPesoItem(item: RelatorioConferidoItemRecord): number {
  const qtdCaixas = toCaixas(
    item.quantidadeRecebida,
    item.unidadeMedida,
    item.unidadesPorCaixa,
  );

  if (item.tipo === 'PVAR') {
    return item.pesoRecebido ?? 0;
  }

  if (item.pesoRecebido !== null && item.pesoRecebido > 0) {
    return item.pesoRecebido;
  }

  return qtdCaixas * (item.pesoBrutoCaixa ?? 0);
}

function agruparItens(itens: RelatorioConferidoItemRecord[]): ItemAgrupado[] {
  const map = new Map<string, ItemAgrupado>();

  for (const item of itens) {
    const lote = normalizeLote(item.loteRecebido);
    const key = `${item.produtoId}:${lote}:${item.conferenteId}`;
    const qtdCaixas = toCaixas(
      item.quantidadeRecebida,
      item.unidadeMedida,
      item.unidadesPorCaixa,
    );
    const pesoKg = calcularPesoItem(item);
    const atual = map.get(key);

    if (atual) {
      atual.qtdCaixas += qtdCaixas;
      atual.pesoKg += pesoKg;
      continue;
    }

    map.set(key, {
      produtoId: item.produtoId,
      sku: item.sku,
      descricao: item.descricao,
      tipo: item.tipo,
      lote,
      unidadesPorCaixa: item.unidadesPorCaixa,
      pesoBrutoCaixa: item.pesoBrutoCaixa,
      qtdCaixas,
      pesoKg,
      conferenteId: item.conferenteId,
      conferenteMatricula: item.conferenteMatricula,
      conferenteNome: item.conferenteNome,
    });
  }

  return [...map.values()];
}

function calcularAvariaCaixas(
  avaria: RelatorioConferidoAvariaRecord,
  unidadesPorCaixa: number,
): number {
  const upc = unidadesPorCaixa > 0 ? unidadesPorCaixa : 1;

  return (
    avaria.quantidadeCaixas + Math.floor(avaria.quantidadeUnidades / upc)
  );
}

function calcularAvariaPeso(
  avaria: RelatorioConferidoAvariaRecord,
  unidadesPorCaixa: number,
  pesoBrutoCaixa: number | null,
): number {
  const caixas = calcularAvariaCaixas(avaria, unidadesPorCaixa);

  if (!pesoBrutoCaixa || pesoBrutoCaixa <= 0) {
    return 0;
  }

  return caixas * pesoBrutoCaixa;
}

function resolverQuantidadeCaixaFinal(
  grupo: ItemAgrupado,
  netCaixas: number,
  netPeso: number,
): number {
  if (grupo.tipo === 'PVAR') {
    if (grupo.pesoBrutoCaixa && grupo.pesoBrutoCaixa > 0) {
      return Number((netPeso / grupo.pesoBrutoCaixa).toFixed(3));
    }

    return 0;
  }

  return Number(netCaixas.toFixed(3));
}

function aplicarAvarias(
  grupos: ItemAgrupado[],
  avarias: RelatorioConferidoAvariaRecord[],
): RelatorioConferidosXlsxRow[] {
  const avariasPorChave = new Map<string, RelatorioConferidoAvariaRecord[]>();
  const avariasSemLotePorProduto = new Map<
    string,
    RelatorioConferidoAvariaRecord[]
  >();

  for (const avaria of avarias) {
    if (!avaria.produtoId) {
      continue;
    }

    const lote = normalizeLote(avaria.lote);

    if (!lote) {
      const lista = avariasSemLotePorProduto.get(avaria.produtoId) ?? [];
      lista.push(avaria);
      avariasSemLotePorProduto.set(avaria.produtoId, lista);
      continue;
    }

    const key = `${avaria.produtoId}:${lote}`;
    const lista = avariasPorChave.get(key) ?? [];
    lista.push(avaria);
    avariasPorChave.set(key, lista);
  }

  const totalCaixasPorProduto = new Map<string, number>();

  for (const grupo of grupos) {
    totalCaixasPorProduto.set(
      grupo.produtoId,
      (totalCaixasPorProduto.get(grupo.produtoId) ?? 0) + grupo.qtdCaixas,
    );
  }

  const linhas: RelatorioConferidosXlsxRow[] = [];

  for (const grupo of grupos) {
    let netCaixas = grupo.qtdCaixas;
    let netPeso = grupo.pesoKg;

    const key = `${grupo.produtoId}:${grupo.lote}`;
    const avariasDiretas = avariasPorChave.get(key) ?? [];

    for (const avaria of avariasDiretas) {
      netCaixas -= calcularAvariaCaixas(avaria, grupo.unidadesPorCaixa);
      netPeso -= calcularAvariaPeso(
        avaria,
        grupo.unidadesPorCaixa,
        grupo.pesoBrutoCaixa,
      );
    }

    const avariasSemLote = avariasSemLotePorProduto.get(grupo.produtoId) ?? [];
    const totalProduto = totalCaixasPorProduto.get(grupo.produtoId) ?? 0;

    if (totalProduto > 0 && avariasSemLote.length > 0) {
      const proporcao = grupo.qtdCaixas / totalProduto;

      for (const avaria of avariasSemLote) {
        netCaixas -=
          calcularAvariaCaixas(avaria, grupo.unidadesPorCaixa) * proporcao;
        netPeso -=
          calcularAvariaPeso(
            avaria,
            grupo.unidadesPorCaixa,
            grupo.pesoBrutoCaixa,
          ) * proporcao;
      }
    }

    netCaixas = Math.max(0, Number(netCaixas.toFixed(3)));
    netPeso = Math.max(0, Number(netPeso.toFixed(3)));

    const quantidadeCaixa = resolverQuantidadeCaixaFinal(
      grupo,
      netCaixas,
      netPeso,
    );

    if (quantidadeCaixa <= 0 && netPeso <= 0) {
      continue;
    }

    linhas.push({
      sku: grupo.sku,
      descricao: grupo.descricao,
      loteConferido: grupo.lote,
      quantidadeCaixa,
      pesoKg: netPeso,
      conferenteId: grupo.conferenteMatricula,
      conferenteNome: grupo.conferenteNome,
      numeroTransporte: '',
    });
  }

  return linhas.sort((a, b) => {
    const cmpSku = a.sku.localeCompare(b.sku);

    if (cmpSku !== 0) {
      return cmpSku;
    }

    return a.loteConferido.localeCompare(b.loteConferido);
  });
}

@Injectable()
export class GetRelatorioItensConferidosUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
  ) {}

  async execute(
    input: GetRelatorioItensConferidosInput,
  ): Promise<GetRelatorioItensConferidosResult> {
    const data = await getRelatorioConferidosDb(this.db, input.recebimentoId);

    if (!data) {
      throw new NotFoundException('Recebimento não encontrado');
    }

    if (!SITUACOES_PERMITIDAS.has(data.situacao)) {
      throw new BadRequestException(
        'Relatório disponível apenas para recebimentos conferidos ou finalizados',
      );
    }

    if (data.itens.length === 0) {
      throw new BadRequestException(
        'Nenhum item conferido encontrado para este recebimento',
      );
    }

    const grupos = agruparItens(data.itens);
    const linhas = aplicarAvarias(grupos, data.avarias).map((linha) => ({
      ...linha,
      numeroTransporte: data.numeroTransporte ?? '',
    }));

    if (linhas.length === 0) {
      throw new BadRequestException(
        'Nenhum item líquido disponível após abatimento das avarias',
      );
    }

    const buffer = buildRelatorioConferidosXlsx(linhas);
    const sufixo = data.numeroTransporte?.trim() || data.recebimentoId.slice(0, 8);

    return {
      buffer,
      filename: `relatorio-conferidos-${sufixo}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }
}
