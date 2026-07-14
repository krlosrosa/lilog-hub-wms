import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  buildMovimentacaoXlsx,
  createMovimentacaoXlsxRow,
  type MovimentacaoXlsxRow,
} from '../../services/recebimento/build-movimentacao-xlsx.js';
import {
  CATEGORIA_CONFERENCIA,
  DOMINIO_RECEBIMENTO,
  ParametrosRecebimentoConferenciaSchema,
  SUBTIPO_PARAMETROS,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  CONFIGURACAO_OPERACIONAL_REPOSITORY,
  type IConfiguracaoOperacionalRepository,
} from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import {
  MovimentacaoLoteContabilError,
  montarLinhasMovimentacaoProduto,
  type ConfigMovimentacaoUnidade,
} from '../../../domain/services/montar-linhas-movimentacao-recebimento.js';
import type {
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

function groupEsperadosPorChave(
  esperados: MovimentacaoEsperadoRecord[],
): Map<string, MovimentacaoEsperadoRecord[]> {
  const map = new Map<string, MovimentacaoEsperadoRecord[]>();

  for (const esperado of esperados) {
    const key = `${esperado.preRecebimentoId}:${esperado.produtoId}`;
    const lista = map.get(key) ?? [];
    lista.push(esperado);
    map.set(key, lista);
  }

  return map;
}

function montarLinhasMovimentacao(
  data: MovimentacaoDataRecord,
  centrosPorEmpresa: CentrosPorEmpresaInput,
  configMovimentacao: ConfigMovimentacaoUnidade,
): MovimentacaoXlsxRow[] {
  const esperadosPorChave = groupEsperadosPorChave(data.esperados);

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
    const referencia = conferidosProduto[0];
    const preRecebimentoId = referencia?.preRecebimentoId;

    if (!referencia || !preRecebimentoId) {
      continue;
    }

    const centro = resolveCentro(referencia.empresa, centrosPorEmpresa);

    if (!centro) {
      throw new BadRequestException(
        `Centro não informado para a empresa "${referencia.empresa}" (produto ${referencia.sku})`,
      );
    }

    const esperadosProduto =
      esperadosPorChave.get(`${preRecebimentoId}:${produtoId}`) ?? [];
    const avariasRecebimento = data.avarias.filter(
      (avaria) => avaria.recebimentoId === recebimentoId,
    );

    let linhasProduto;

    try {
      linhasProduto = montarLinhasMovimentacaoProduto({
        produtoId,
        sku: referencia.sku,
        tipo: referencia.tipo,
        unidadesPorCaixa: referencia.unidadesPorCaixa,
        pesoBrutoCaixa: referencia.pesoBrutoCaixa,
        conferidosProduto,
        esperadosProduto,
        avarias: avariasRecebimento,
        config: configMovimentacao,
      });
    } catch (error) {
      if (error instanceof MovimentacaoLoteContabilError) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const pesoVariavel = referencia.tipo === 'PVAR';
    const unidadeMedidaBasica = pesoVariavel ? 'KG' : 'CX';

    for (const linha of linhasProduto) {
      linhas.push(
        createMovimentacaoXlsxRow({
          codigo: referencia.sku,
          utilizacaoLivre: linha.quantidade,
          unidadeMedidaBasica,
          loteOrigem: linha.loteOrigem,
          loteDestino: linha.loteDestino,
          centro,
        }),
      );
    }
  }

  return linhas;
}

@Injectable()
export class GerarMovimentacaoRecebimentoUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER)
    private readonly db: DrizzleClient,
    @Inject(CONFIGURACAO_OPERACIONAL_REPOSITORY)
    private readonly configuracaoOperacionalRepository: IConfiguracaoOperacionalRepository,
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

    const configuracoes = await this.configuracaoOperacionalRepository.list({
      unidadeId: data.unidadeId,
      dominio: DOMINIO_RECEBIMENTO,
      categoria: CATEGORIA_CONFERENCIA,
      subtipo: SUBTIPO_PARAMETROS,
      ativo: true,
    });

    const configPadrao =
      configuracoes.find((item) => item.isPadrao) ?? configuracoes[0];
    const parametros = ParametrosRecebimentoConferenciaSchema.parse(
      configPadrao?.parametros ?? {},
    );

    const configMovimentacao: ConfigMovimentacaoUnidade = {
      displayUnidadePadrao: parametros.displayUnidadePadrao,
    };

    const linhas = montarLinhasMovimentacao(
      data,
      input.centrosPorEmpresa,
      configMovimentacao,
    );

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
