import { DEFAULT_OPCOES_TABELAS_CARREGAMENTO } from '@lilog/contracts';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ImprimirMapasBodyInput,
  ImprimirMapasResult,
  TipoMapaImpressaoProcesso,
} from '../../dtos/expedicao/imprimir-mapas.dto.js';
import {
  combinarDocumentosMapaPdf,
  montarHtmlMapaSeparacaoPdf,
  type MetadadosImpressaoPdf,
} from '../../services/expedicao/montar-html-mapa-separacao-pdf.js';
import { montarHtmlMapaCarregamentoPdf } from '../../services/expedicao/montar-html-mapa-carregamento-pdf.js';
import { resolverGruposImpressaoMapa } from '../../services/expedicao/resolver-grupos-impressao-mapa.js';
import { resolverMinutasImpressaoCarregamento } from '../../services/expedicao/resolver-minutas-impressao-carregamento.js';
import type { ConfiguracaoImpressaoRecord } from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import {
  MAPA_LOTE_REPOSITORY,
  type IMapaLoteRepository,
  type MapaLoteRecord,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { listTransportesByIdsDb } from '../../../infra/db/expedicao/list-transportes-by-ids.drizzle.js';
import { findUserByIdDb } from '../../../infra/db/user/find-user.drizzle.js';
import { GerarPdfDeHtmlService } from '../../../infra/pdf/gerar-pdf-de-html.service.js';

export type ImprimirMapasUseCaseInput = ImprimirMapasBodyInput & {
  impressoPorUserId: number | null;
};

const MENSAGEM_SEM_GRUPOS: Record<TipoMapaImpressaoProcesso, string> = {
  separacao:
    'Nenhum grupo de mapa de separação encontrado para os transportes selecionados.',
  conferencia:
    'Nenhum grupo de mapa de conferência encontrado para os transportes selecionados.',
  carregamento:
    'Nenhuma minuta de carregamento encontrada. Regenere os mapas para incluir carregamento.',
};

@Injectable()
export class ImprimirMapasUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
    @Inject(MAPA_LOTE_REPOSITORY)
    private readonly mapaLoteRepository: IMapaLoteRepository,
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
    private readonly gerarPdfDeHtmlService: GerarPdfDeHtmlService,
  ) {}

  async execute(input: ImprimirMapasUseCaseInput): Promise<ImprimirMapasResult> {
    const transportes = await listTransportesByIdsDb(
      this.db,
      input.unidadeId,
      input.transporteIds,
    );

    if (transportes.length !== input.transporteIds.length) {
      throw new BadRequestException(
        'Um ou mais transportes não pertencem à unidade informada.',
      );
    }

    const transportesSemMapa = transportes.filter(
      (transporte) => transporte.ultimoMapaLoteId == null,
    );

    if (transportesSemMapa.length > 0) {
      throw new BadRequestException({
        message:
          'Salve os mapas antes de imprimir. Alguns transportes não possuem lote salvo.',
        transporteIdsSemMapa: transportesSemMapa.map((t) => t.numeroTransporte),
        rotas: transportesSemMapa.map((t) => t.numeroTransporte),
      });
    }

    const loteIds = [
      ...new Set(
        transportes
          .map((transporte) => transporte.ultimoMapaLoteId)
          .filter((id): id is string => id != null),
      ),
    ];

    const lotes = await Promise.all(
      loteIds.map(async (loteId) => {
        const lote = await this.mapaLoteRepository.obterPorId(
          loteId,
          input.unidadeId,
        );

        if (!lote) {
          throw new NotFoundException(
            `Lote de mapas ${loteId} não encontrado para a unidade.`,
          );
        }

        return lote;
      }),
    );

    const configuracao = await this.configuracaoImpressaoRepository.findById(
      input.configuracaoImpressaoId,
    );

    if (!configuracao || configuracao.unidadeId !== input.unidadeId) {
      throw new NotFoundException('Configuração de impressão não encontrada.');
    }

    const horarioImpressao = new Date();
    const impressoPor = await this.resolverNomeImpressoPor(input.impressoPorUserId);
    const metadados: MetadadosImpressaoPdf = {
      horarioImpressao,
      impressoPor,
    };

    const tiposImpressao: TipoMapaImpressaoProcesso[] =
      input.tipoMapa === 'todos'
        ? ['separacao', 'conferencia', 'carregamento']
        : [input.tipoMapa];

    const htmls: string[] = [];
    let totalGrupos = 0;

    for (const tipo of tiposImpressao) {
      const { html, totalGrupos: totalTipo } = await this.gerarHtmlTipo(
        tipo,
        lotes,
        input.transporteIds,
        configuracao,
        metadados,
      );

      if (totalTipo > 0) {
        htmls.push(html);
        totalGrupos += totalTipo;
      }
    }

    if (totalGrupos === 0) {
      throw new BadRequestException(
        input.tipoMapa === 'todos'
          ? 'Nenhum grupo de mapa encontrado para os transportes selecionados.'
          : MENSAGEM_SEM_GRUPOS[input.tipoMapa],
      );
    }

    const html =
      htmls.length === 1 ? htmls[0]! : combinarDocumentosMapaPdf(htmls);

    const buffer = await this.gerarPdfDeHtmlService.gerarPdf(html);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = this.resolverNomeArquivo(input.tipoMapa, timestamp);

    return {
      buffer,
      filename,
      totalGrupos,
    };
  }

  private async gerarHtmlTipo(
    tipo: TipoMapaImpressaoProcesso,
    lotes: MapaLoteRecord[],
    transporteIds: string[],
    configuracao: ConfiguracaoImpressaoRecord,
    metadados: MetadadosImpressaoPdf,
  ): Promise<{ html: string; totalGrupos: number }> {
    if (tipo === 'carregamento') {
      const minutas = resolverMinutasImpressaoCarregamento({
        lotes,
        transporteIds,
      });

      if (minutas.length === 0) {
        return { html: '', totalGrupos: 0 };
      }

      const opcoesTabelas =
        configuracao.configuracao.opcoesTabelasCarregamento ??
        DEFAULT_OPCOES_TABELAS_CARREGAMENTO;

      const html = await montarHtmlMapaCarregamentoPdf({
        minutas,
        templateHtml: configuracao.templatesHtml.carregamento,
        opcoesTabelas,
        qrConfig: configuracao.configuracao.qrCodeMapa.carregamento,
        metadados,
      });

      return { html, totalGrupos: minutas.length };
    }

    const grupos = resolverGruposImpressaoMapa({
      lotes,
      transporteIds,
      tipoMapa: tipo,
    });

    if (grupos.length === 0) {
      return { html: '', totalGrupos: 0 };
    }

    const html = await montarHtmlMapaSeparacaoPdf({
      grupos,
      templateHtml: configuracao.templatesHtml[tipo],
      ordemColunas:
        tipo === 'separacao'
          ? configuracao.configuracao.ordemImpressaoSeparacao
          : configuracao.configuracao.ordemImpressaoConferencia,
      qrConfig: configuracao.configuracao.qrCodeMapa[tipo],
      metadados,
    });

    return { html, totalGrupos: grupos.length };
  }

  private resolverNomeArquivo(
    tipoMapa: ImprimirMapasBodyInput['tipoMapa'],
    timestamp: string,
  ): string {
    if (tipoMapa === 'conferencia') {
      return `mapas-conferencia-${timestamp}.pdf`;
    }

    if (tipoMapa === 'carregamento') {
      return `mapas-carregamento-${timestamp}.pdf`;
    }

    if (tipoMapa === 'todos') {
      return `mapas-completos-${timestamp}.pdf`;
    }

    return `mapas-separacao-${timestamp}.pdf`;
  }

  private async resolverNomeImpressoPor(
    userId: number | null,
  ): Promise<string> {
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
