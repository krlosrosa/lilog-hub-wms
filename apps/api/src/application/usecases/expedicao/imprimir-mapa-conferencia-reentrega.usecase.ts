import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ImprimirMapaConferenciaReentregaBodyInput,
  ImprimirMapaConferenciaReentregaResult,
} from '../../dtos/expedicao/nfs-devolucao-transporte.dto.js';
import type { GerarMapasConfigInput } from '../../dtos/expedicao/gerar-mapas.dto.js';
import {
  montarHtmlMapaSeparacaoPdf,
  type MetadadosImpressaoPdf,
} from '../../services/expedicao/montar-html-mapa-separacao-pdf.js';
import { montarGruposMapaConferencia } from '../../services/expedicao/montar-grupos-mapa-conferencia.js';
import type { GrupoImpressaoMapa } from '../../services/expedicao/resolver-grupos-impressao-mapa.js';
import type { TransporteParaMapa } from '../../services/expedicao/montar-grupos-mapa.js';
import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import { findClientesEspeciaisPorCodigosDb } from '../../../infra/db/expedicao/find-clientes-especiais-por-codigos.drizzle.js';
import { listRemessaItensByRemessaIdsDb } from '../../../infra/db/expedicao/list-remessa-itens-by-remessa-ids.drizzle.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import { listRemessaIdsReentregaTransporteDb } from '../../../infra/db/expedicao/vincular-nfs-devolucao-transporte.drizzle.js';
import { salvarMapaConferenciaReentregaDb } from '../../../infra/db/expedicao/mapa-conferencia-reentrega.drizzle.js';
import { listProdutoEnderecosByProdutoIdsDb } from '../../../infra/db/produto-endereco/list-produto-enderecos-by-produto-ids.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { findUserByIdDb } from '../../../infra/db/user/find-user.drizzle.js';
import { GerarPdfDeHtmlService } from '../../../infra/pdf/gerar-pdf-de-html.service.js';
import { aplicarClientesEspeciaisNaConfig } from '../../services/expedicao/aplicar-clientes-especiais-mapa.js';
import {
  enderecoItemMapaParaCampos,
  type EnderecoItemMapaCampos,
} from '../../services/expedicao/endereco-item-mapa.js';
import {
  coletarProdutoIdsParaSlotting,
  montarMapaEnderecoPorProdutoCodigo,
  resolverEnderecoItemMapa,
} from '../../services/expedicao/resolver-endereco-produto-slotting.js';

const CONFIG_CONFERENCIA_REENTREGA: GerarMapasConfigInput = {
  tipoDadosBasicos: 'transporte',
  quebraPalete: { ativo: false, tipo: 'percentual', valor: 0 },
  exibirClienteCabecalho: true,
  segregarPaleteFull: false,
  segregarUnidade: false,
  agrupamento: {
    tiposAtivos: [],
    clientesSegregados: [],
    grupos: [],
  },
  opcoesConferencia: {
    classificarPor: 'sku',
    agrupamento: 'apenas_transporte',
  },
};

const PREFIXO_TITULO_CONFERENCIA_REENTREGA = 'Conferência Reentrega';

function parseNumeric(value: string | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function prefixarTituloConferenciaReentrega(
  transporteCodigo: string,
  titulo: string,
): string {
  const sufixo = titulo.trim().length > 0 ? ` · ${titulo}` : '';
  return `${PREFIXO_TITULO_CONFERENCIA_REENTREGA} — ${transporteCodigo}${sufixo}`;
}

export type ImprimirMapaConferenciaReentregaUseCaseInput =
  ImprimirMapaConferenciaReentregaBodyInput & {
    impressoPorUserId: number | null;
  };

@Injectable()
export class ImprimirMapaConferenciaReentregaUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
    private readonly gerarPdfDeHtmlService: GerarPdfDeHtmlService,
  ) {}

  async execute(
    input: ImprimirMapaConferenciaReentregaUseCaseInput,
  ): Promise<ImprimirMapaConferenciaReentregaResult> {
    const transportesRows = await listTransportesByIdsDb(
      this.db,
      input.unidadeId,
      input.transporteIds,
    );

    const transportesPorCodigo = new Map(
      transportesRows.map((transporte) => [transporte.numeroTransporte, transporte]),
    );

    const transportesNaoEncontrados = input.transporteIds.filter(
      (transporteId) => !transportesPorCodigo.has(transporteId),
    );

    if (transportesNaoEncontrados.length > 0) {
      throw new NotFoundException(
        `Transporte(s) não encontrado(s) para a unidade informada: ${transportesNaoEncontrados.join(', ')}.`,
      );
    }

    const configuracao = await this.configuracaoImpressaoRepository.findById(
      input.configuracaoImpressaoId,
    );

    if (!configuracao || configuracao.unidadeId !== input.unidadeId) {
      throw new NotFoundException('Configuração de impressão não encontrada.');
    }

    const metadados: MetadadosImpressaoPdf = {
      horarioImpressao: new Date(),
      impressoPor: await this.resolverNomeImpressoPor(input.impressoPorUserId),
    };

    const gruposImpressao: GrupoImpressaoMapa[] = [];
    let sequenciaGlobal = 0;

    for (const transporteId of input.transporteIds) {
      const transporteRow = transportesPorCodigo.get(transporteId)!;
      const gruposTransporte = await this.montarGruposImpressaoTransporte(
        input.unidadeId,
        transporteId,
        transporteRow,
      );

      await salvarMapaConferenciaReentregaDb(this.db, {
        unidadeId: input.unidadeId,
        transporteId,
        grupos: gruposTransporte.map((grupoImpressao) => grupoImpressao.grupo),
        configuracaoImpressaoId: input.configuracaoImpressaoId,
        criadoPor: input.impressoPorUserId,
      });

      gruposTransporte.forEach((grupoImpressao) => {
        gruposImpressao.push({
          ...grupoImpressao,
          sequencia: sequenciaGlobal,
        });
        sequenciaGlobal += 1;
      });
    }

    if (gruposImpressao.length === 0) {
      throw new BadRequestException(
        'Nenhum grupo de conferência foi gerado para as remessas de reentrega.',
      );
    }

    const html = await montarHtmlMapaSeparacaoPdf({
      grupos: gruposImpressao,
      templateHtml:
        configuracao.templatesHtml.conferencia_reentrega ??
        configuracao.templatesHtml.conferencia,
      ordemColunas:
        configuracao.configuracao.ordemImpressaoConferenciaReentrega ??
        configuracao.configuracao.ordemImpressaoConferencia,
      qrConfig:
        configuracao.configuracao.qrCodeMapa.conferencia_reentrega ??
        configuracao.configuracao.qrCodeMapa.conferencia,
      metadados,
    });

    const buffer = await this.gerarPdfDeHtmlService.gerarPdf(html);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return {
      buffer,
      filename: `mapa-conferencia-reentrega-${timestamp}.pdf`,
      totalGrupos: gruposImpressao.length,
    };
  }

  private async montarGruposImpressaoTransporte(
    unidadeId: string,
    transporteId: string,
    transporteRow: Awaited<ReturnType<typeof listTransportesByIdsDb>>[number],
  ): Promise<GrupoImpressaoMapa[]> {
    const remessaIdsReentrega = await listRemessaIdsReentregaTransporteDb(
      this.db,
      transporteId,
    );

    if (remessaIdsReentrega.length === 0) {
      throw new BadRequestException(
        `Nenhuma remessa de reentrega vinculada ao transporte ${transporteId}.`,
      );
    }

    const remessasReentrega = transporteRow.remessas.filter(
      (remessa) =>
        remessa.origem === 'reentrega' && remessaIdsReentrega.includes(remessa.id),
    );

    if (remessasReentrega.length === 0) {
      throw new BadRequestException(
        `Nenhuma remessa de reentrega encontrada para o transporte ${transporteId}.`,
      );
    }

    const itensRows = await listRemessaItensByRemessaIdsDb(
      this.db,
      remessasReentrega.map((remessa) => remessa.id),
    );

    const produtoCodigos = [
      ...new Set(
        itensRows
          .map((row) => row.produtoCodigo.trim())
          .filter((codigo) => codigo.length > 0),
      ),
    ];

    const produtoIds = [
      ...new Set(
        itensRows.flatMap((row) =>
          coletarProdutoIdsParaSlotting({
            produtoId: row.produtoId,
            produtoIdResolvido: row.produtoIdResolvido,
            produtoCodigo: row.produtoCodigo,
            sku: row.sku,
          }),
        ),
      ),
    ];

    const slottingRows = await listProdutoEnderecosByProdutoIdsDb(this.db, {
      unidadeId,
      produtoIds,
      produtoCodigos,
    });

    const enderecoPorProdutoCodigo = montarMapaEnderecoPorProdutoCodigo(slottingRows);

    const itensPorRemessaId = new Map<
      string,
      TransporteParaMapa['remessas'][number]['itens']
    >();

    itensRows.forEach((row) => {
      const remessa = remessasReentrega.find((item) => item.id === row.remessaId);

      if (!remessa) {
        return;
      }

      const enderecoCampos: EnderecoItemMapaCampos = enderecoItemMapaParaCampos(
        resolverEnderecoItemMapa({
          produtoId: row.produtoIdResolvido ?? row.produtoId,
          produtoCodigo: row.produtoCodigo,
          sku: row.sku,
          enderecoPorProdutoCodigo,
        }),
      );

      const item = {
        id: row.id,
        remessaId: row.remessaId,
        numeroRemessa: remessa.remessa,
        codCliente: remessa.codCliente,
        cliente: remessa.cliente,
        cidade: remessa.cidade,
        sku: row.sku,
        produtoId: row.produtoIdResolvido ?? row.produtoId,
        empresa: row.empresaProduto ?? remessa.empresa,
        categoria: row.categoriaProduto ?? 'sem_categoria',
        lote: row.lote,
        dataFabricacao: row.dataFabricacao,
        faixa: row.faixa,
        peso: parseNumeric(row.peso),
        quantidade: parseNumeric(row.quantidade) ?? 0,
        unidadeMedida: row.unidadeMedida,
        quantidadeNormalizadaUnidades:
          parseNumeric(row.quantidadeNormalizadaUnidades) ?? 0,
        unidadesPorCaixa: row.unidadesPorCaixa,
        caixasPorPalete: row.caixasPorPalete,
        pesoBrutoUnidade: row.pesoBrutoUnidade,
        pesoBrutoCaixa: row.pesoBrutoCaixa,
        pesoBrutoPalete: row.pesoBrutoPalete,
        pesoLiquidoUnidade: row.pesoLiquidoUnidade,
        pesoLiquidoCaixa: row.pesoLiquidoCaixa,
        pesoLiquidoPalete: row.pesoLiquidoPalete,
        descricao: row.descricaoProduto,
        ...enderecoCampos,
      };

      const atual = itensPorRemessaId.get(row.remessaId) ?? [];
      atual.push(item);
      itensPorRemessaId.set(row.remessaId, atual);
    });

    const transporteParaMapa: TransporteParaMapa = {
      id: transporteRow.numeroTransporte,
      rota: transporteRow.numeroTransporte,
      cidade: transporteRow.cidade,
      bairro: transporteRow.bairro,
      placa: transporteRow.placa,
      transportadora: transporteRow.transportadora,
      remessas: remessasReentrega.map((remessa) => ({
        id: remessa.id,
        remessa: remessa.remessa,
        codCliente: remessa.codCliente,
        cliente: remessa.cliente,
        cidade: remessa.cidade,
        peso: parseNumeric(remessa.peso) ?? 0,
        volume: parseNumeric(remessa.volume) ?? 0,
        itens: itensPorRemessaId.get(remessa.id) ?? [],
      })),
    };

    const codClientes = [
      ...new Set(
        transporteParaMapa.remessas.map((remessa) => remessa.codCliente),
      ),
    ];

    const clientesEspeciais = await findClientesEspeciaisPorCodigosDb(
      this.db,
      unidadeId,
      codClientes,
    );

    const configEnriquecida = aplicarClientesEspeciaisNaConfig(
      CONFIG_CONFERENCIA_REENTREGA,
      clientesEspeciais,
      codClientes,
    );

    const conferencia = montarGruposMapaConferencia(
      [transporteParaMapa],
      configEnriquecida,
      CONFIG_CONFERENCIA_REENTREGA.opcoesConferencia,
    );

    if (conferencia.grupos.length === 0) {
      throw new BadRequestException(
        `Nenhum grupo de conferência foi gerado para o transporte ${transporteId}.`,
      );
    }

    return conferencia.grupos.map((grupo, index) => ({
      grupo: {
        ...grupo,
        titulo: prefixarTituloConferenciaReentrega(
          transporteRow.numeroTransporte,
          grupo.titulo,
        ),
      },
      sequencia: index,
      transporteId,
      paginaTransporte: index + 1,
      totalPaginasTransporte: conferencia.grupos.length,
    }));
  }

  private async resolverNomeImpressoPor(userId: number | null): Promise<string> {
    if (userId == null) {
      return '—';
    }

    const user = await findUserByIdDb(this.db, userId);

    if (!user) {
      return '—';
    }

    const nome = user.name.trim();
    return nome.length > 0 ? nome : user.email;
  }
}
