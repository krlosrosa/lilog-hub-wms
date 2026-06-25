import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { DemandaSeparacaoDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import { TransporteEventPublisher } from '../../services/transporte-event.publisher.js';

function mapDemandaToDto(
  demanda: NonNullable<
    Awaited<ReturnType<IDemandaSeparacaoRepository['findDetalheById']>>
  >,
): DemandaSeparacaoDto {
  return {
    id: demanda.id,
    sessaoId: demanda.sessaoId,
    mapaGrupoId: demanda.mapaGrupoId,
    mapaGrupoTitulo: demanda.mapaGrupoTitulo,
    mapaGrupoMicroUuid: demanda.mapaGrupoMicroUuid,
    mapaGrupoProcesso: demanda.mapaGrupoProcesso,
    transporteId: demanda.transporteId,
    transporteRota: demanda.transporteRota,
    transporteDocaId: demanda.transporteDocaId,
    transporteLacreCarregamento: demanda.transporteLacreCarregamento,
    sessaoFuncionarioId: demanda.sessaoFuncionarioId,
    funcionarioId: demanda.funcionarioId,
    status: demanda.status,
    atribuidoEm: demanda.atribuidoEm.toISOString(),
    iniciadoEm: demanda.iniciadoEm?.toISOString() ?? null,
    finalizadoEm: demanda.finalizadoEm?.toISOString() ?? null,
    tempoEsperadoMinutos: demanda.tempoEsperadoMinutos,
  };
}

@Injectable()
export class FinalizarDemandaSeparacaoUseCase {
  constructor(
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(TransporteEventPublisher)
    private readonly transporteEventPublisher: TransporteEventPublisher,
  ) {}

  async execute(demandaId: string): Promise<DemandaSeparacaoDto> {
    const existing =
      await this.demandaSeparacaoRepository.findDetalheById(demandaId);

    if (!existing) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    const sessao = await this.sessaoOperacaoRepository.findSessaoById(
      existing.sessaoId,
    );

    if (!sessao) {
      throw new NotFoundException(`Sessão "${existing.sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    if (existing.status !== 'em_andamento') {
      throw new BadRequestException(
        'Somente demandas em andamento podem ser finalizadas',
      );
    }

    const finalizada =
      await this.demandaSeparacaoRepository.finalizarDemanda(demandaId);

    if (!finalizada) {
      throw new BadRequestException('Não foi possível finalizar a demanda');
    }

    await this.transporteEventPublisher.publishRecalcularStatus({
      transporteId: finalizada.transporteId,
      unidadeId: finalizada.unidadeId,
      motivo: 'grupo_finalizado',
      mapaGrupoId: finalizada.mapaGrupoId,
      processo: finalizada.mapaGrupoProcesso,
    });

    return mapDemandaToDto(finalizada);
  }
}
