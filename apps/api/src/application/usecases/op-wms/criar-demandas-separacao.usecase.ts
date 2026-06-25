import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CriarDemandasResponseDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
import type { CriarDemandasSeparacaoInput } from '../../../domain/model/op-wms/demanda-separacao.model.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import { TransporteEventPublisher } from '../../services/transporte-event.publisher.js';

const PRESENCA_ELEGIVEL = new Set(['presente', 'atraso']);

@Injectable()
export class CriarDemandasSeparacaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
    @Inject(TransporteEventPublisher)
    private readonly transporteEventPublisher: TransporteEventPublisher,
  ) {}

  async execute(
    input: CriarDemandasSeparacaoInput,
  ): Promise<CriarDemandasResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(
      input.sessaoId,
    );

    if (!sessao) {
      throw new NotFoundException(`Sessão "${input.sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const funcionario =
      await this.sessaoOperacaoRepository.findSessaoFuncionarioById(
        input.sessaoId,
        input.sessaoFuncionarioId,
      );

    if (!funcionario || !PRESENCA_ELEGIVEL.has(funcionario.status)) {
      throw new BadRequestException(
        'Funcionário não está presente na sessão',
      );
    }

    const uniqueMapaIds = [...new Set(input.mapaGrupoIds)];

    const mapas = await this.demandaSeparacaoRepository.findMapaGrupoByIds(
      uniqueMapaIds,
      sessao.unidadeId,
    );

    if (mapas.length !== uniqueMapaIds.length) {
      throw new BadRequestException(
        'Um ou mais mapas-grupo não foram encontrados na unidade',
      );
    }

    for (const mapa of mapas) {
      if (mapa.finalizadoEm != null) {
        throw new BadRequestException(
          `Mapa "${mapa.titulo}" já foi finalizado`,
        );
      }

      if (mapa.iniciadoEm != null) {
        throw new BadRequestException(
          `Mapa "${mapa.titulo}" já foi iniciado`,
        );
      }
    }

    const demandasAtivas =
      await this.demandaSeparacaoRepository.findDemandasAtivasByMapaGrupoIds(
        uniqueMapaIds,
      );

    if (demandasAtivas.length > 0) {
      throw new BadRequestException(
        'Um ou mais mapas-grupo já possuem demanda ativa',
      );
    }

    const demandas = await this.demandaSeparacaoRepository.createBatch({
      ...input,
      mapaGrupoIds: uniqueMapaIds,
      unidadeId: sessao.unidadeId,
    }).catch((error: unknown) => {
      if (
        error instanceof Error &&
        error.message.includes('já foram iniciados')
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    });

    const transportesPublicados = new Set<string>();

    for (const demanda of demandas) {
      if (transportesPublicados.has(demanda.transporteId)) {
        continue;
      }

      transportesPublicados.add(demanda.transporteId);

      await this.transporteEventPublisher.publishRecalcularStatus({
        transporteId: demanda.transporteId,
        unidadeId: demanda.unidadeId,
        motivo: 'grupo_iniciado',
        mapaGrupoId: demanda.mapaGrupoId,
        processo: demanda.mapaGrupoProcesso,
      });
    }

    return {
      demandas: demandas.map((demanda) => ({
        id: demanda.id,
        sessaoId: demanda.sessaoId,
        mapaGrupoId: demanda.mapaGrupoId,
        mapaGrupoTitulo: demanda.mapaGrupoTitulo,
        mapaGrupoMicroUuid: demanda.mapaGrupoMicroUuid,
        mapaGrupoProcesso: demanda.mapaGrupoProcesso,
        transporteId: demanda.transporteId,
        transporteRota: demanda.transporteRota,
        sessaoFuncionarioId: demanda.sessaoFuncionarioId,
        funcionarioId: demanda.funcionarioId,
        status: demanda.status,
        atribuidoEm: demanda.atribuidoEm.toISOString(),
        iniciadoEm: demanda.iniciadoEm?.toISOString() ?? null,
        finalizadoEm: demanda.finalizadoEm?.toISOString() ?? null,
        tempoEsperadoMinutos: demanda.tempoEsperadoMinutos,
      })),
    };
  }
}
