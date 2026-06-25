import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  SalvarMapasBodyInput,
  SalvarMapasResponse,
} from '../../dtos/expedicao/salvar-mapas.dto.js';
import { montarMapasDeTransportes } from '../../services/expedicao/montar-mapas-de-transportes.js';
import { montarResumoMapaLote } from '../../services/expedicao/montar-resumo-mapa-lote.js';
import {
  CONFIGURACAO_IMPRESSAO_REPOSITORY,
  type IConfiguracaoImpressaoRepository,
} from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import {
  MAPA_LOTE_REPOSITORY,
  type IMapaLoteRepository,
} from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';

export type SalvarMapasInput = SalvarMapasBodyInput & {
  criadoPor: number | null;
};

@Injectable()
export class SalvarMapasUseCase {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
    @Inject(MAPA_LOTE_REPOSITORY)
    private readonly mapaLoteRepository: IMapaLoteRepository,
    @Inject(CONFIGURACAO_IMPRESSAO_REPOSITORY)
    private readonly configuracaoImpressaoRepository: IConfiguracaoImpressaoRepository,
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
  ) {}

  async execute(input: SalvarMapasInput): Promise<SalvarMapasResponse> {
    const transportesComMapa = await this.transporteRepository.findComMapaExistente(
      {
        unidadeId: input.unidadeId,
        transporteIds: input.transporteIds,
      },
    );

    if (transportesComMapa.length > 0) {
      throw new ConflictException({
        message:
          'Um ou mais transportes já possuem mapa salvo. Exclua o lote de mapas antes de salvar novamente.',
        transportesComMapa: transportesComMapa.map((transporte) => ({
          transporteId: transporte.id,
          rota: transporte.rota,
          ultimoMapaLoteId: transporte.ultimoMapaLoteId,
        })),
      });
    }

    let templatesHtml: unknown | null = null;

    if (input.configuracaoImpressaoId) {
      const configuracao = await this.configuracaoImpressaoRepository.findById(
        input.configuracaoImpressaoId,
      );

      if (!configuracao || configuracao.unidadeId !== input.unidadeId) {
        throw new NotFoundException('Configuração de impressão não encontrada.');
      }

      templatesHtml = configuracao.templatesHtml;
    }

    const montagem = await montarMapasDeTransportes(this.db, input);

    if (montagem.payload.totalGrupos === 0) {
      throw new BadRequestException(
        'Nenhum grupo de mapa foi gerado para os transportes selecionados.',
      );
    }

    const resumo = montarResumoMapaLote({
      payload: montagem.payload,
      config: input.config,
      transportes: montagem.transportes,
      transportesPorRota: montagem.transportesPorRota,
    });

    const lote = await this.mapaLoteRepository.inserir({
      unidadeId: input.unidadeId,
      transporteIds: input.transporteIds,
      config: input.config,
      payload: montagem.payload,
      resumo,
      configuracaoImpressaoId: input.configuracaoImpressaoId ?? null,
      templatesHtml,
      criadoPor: input.criadoPor,
      transportesPorRota: montagem.transportesPorRota,
    }).catch((error: unknown) => {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    });

    return {
      mapaLoteId: lote.id,
      resumo,
      ...montagem.payload,
    };
  }
}
