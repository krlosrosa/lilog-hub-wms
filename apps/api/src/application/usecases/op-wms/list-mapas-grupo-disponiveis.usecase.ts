import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ListMapasGrupoDisponiveisResponseDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListMapasGrupoDisponiveisUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
  ) {}

  async execute(
    sessaoId: string,
    processo?: 'separacao' | 'conferencia' | 'carregamento',
  ): Promise<ListMapasGrupoDisponiveisResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const items = await this.demandaSeparacaoRepository.listMapasGrupoDisponiveis(
      sessao.unidadeId,
      processo,
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        mapaLoteId: item.mapaLoteId,
        microUuid: item.microUuid,
        processo: item.processo,
        titulo: item.titulo,
        subtitulo: item.subtitulo,
        transporteId: item.transporteId,
        transporteRota: item.transporteRota,
        empresa: item.empresa,
        categoria: item.categoria,
        totalItens: item.totalItens,
        totalCaixas: item.totalCaixas,
        totalUnidades: item.totalUnidades,
        pesoTotalKg: item.pesoTotalKg,
        tempoEsperadoMinutos: item.tempoEsperadoMinutos,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
