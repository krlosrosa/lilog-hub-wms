import { Inject, Injectable, Logger } from '@nestjs/common';

import { resolverStatusTransporteOperacional } from '../../services/expedicao/resolver-status-transporte-operacional.js';
import { TransporteEventPublisher } from '../../services/transporte-event.publisher.js';
import {
  TRANSPORTE_REPOSITORY,
  type ITransporteRepository,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { RecalcularStatusTransporteJobData } from '../../../infra/queues/expedicao-transporte.queue.js';

@Injectable()
export class RecalcularStatusTransporteUseCase {
  private readonly logger = new Logger(RecalcularStatusTransporteUseCase.name);

  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
    @Inject(TransporteEventPublisher)
    private readonly transporteEventPublisher: TransporteEventPublisher,
  ) {}

  async execute(data: RecalcularStatusTransporteJobData): Promise<void> {
    const [resumo, atual] = await Promise.all([
      this.transporteRepository.findResumoGruposOperacionais(data.transporteId),
      this.transporteRepository.findStatusTransporte(
        data.transporteId,
        data.unidadeId,
      ),
    ]);

    if (!atual) {
      this.logger.warn(
        `Transporte "${data.transporteId}" não encontrado na unidade "${data.unidadeId}"`,
      );
      return;
    }

    const novoStatus = resolverStatusTransporteOperacional(
      resumo,
      atual.status,
    );

    if (novoStatus === atual.status) {
      return;
    }

    await this.transporteRepository.atualizarStatusOperacional({
      transporteId: data.transporteId,
      unidadeId: data.unidadeId,
      status: novoStatus,
    });

    this.logger.log(
      `Transporte "${data.transporteId}" atualizado de "${atual.status}" para "${novoStatus}" (${data.motivo}/${data.processo})`,
    );

    if (novoStatus === 'carregado') {
      const viagemContext = await this.transporteRepository.findViagemRavexContext(
        data.transporteId,
        data.unidadeId,
      );

      if (!viagemContext?.viagemId || !viagemContext.viagemFimEm) {
        await this.transporteEventPublisher.publishSincronizarViagemRavex({
          transporteId: data.transporteId,
          unidadeId: data.unidadeId,
          fase: 'buscar_viagem',
        });
      }
    }
  }
}
