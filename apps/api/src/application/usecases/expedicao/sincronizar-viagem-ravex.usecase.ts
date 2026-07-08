import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { formatIdentificadorViagemRavex } from '../../services/expedicao/format-identificador-viagem-ravex.js';
import { resolverStatusViagemRavex } from '../../services/expedicao/resolver-status-viagem-ravex.js';
import { TransporteEventPublisher } from '../../services/transporte-event.publisher.js';
import { GerarDemandaDevolucaoViagemUseCase } from '../devolucao/gerar-demanda-devolucao-viagem.usecase.js';
import {
  TRANSPORTE_REPOSITORY,
  type AtualizarViagemRavexInput,
  type ITransporteRepository,
  type TransporteViagemRavexRecord,
} from '../../../domain/repositories/expedicao/transporte.repository.js';
import { RavexViagemClient } from '../../../infra/clients/ravex/ravex-viagem.client.js';
import type { RavexViagemFaturada } from '../../../infra/clients/ravex/ravex-viagem.types.js';
import {
  VIAGEM_RAVEX_DELAY_BUSCAR_MS,
  VIAGEM_RAVEX_DELAY_FIM_MS,
  VIAGEM_RAVEX_DELAY_INICIO_MS,
  type FaseSincronizacaoViagemRavex,
  type SincronizarViagemRavexJobData,
} from '../../../infra/queues/expedicao-transporte.queue.js';

function parseRavexDateTime(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

@Injectable()
export class SincronizarViagemRavexUseCase {
  private readonly logger = new Logger(SincronizarViagemRavexUseCase.name);

  constructor(
    @Inject(TRANSPORTE_REPOSITORY)
    private readonly transporteRepository: ITransporteRepository,
    @Inject(RavexViagemClient)
    private readonly ravexViagemClient: RavexViagemClient,
    @Inject(TransporteEventPublisher)
    private readonly transporteEventPublisher: TransporteEventPublisher,
    @Inject(GerarDemandaDevolucaoViagemUseCase)
    private readonly gerarDemandaDevolucaoViagemUseCase: GerarDemandaDevolucaoViagemUseCase,
  ) {}

  async execute(data: SincronizarViagemRavexJobData): Promise<void> {
    const context = await this.transporteRepository.findViagemRavexContext(
      data.transporteId,
      data.unidadeId,
    );

    if (!context) {
      this.logger.warn(
        `Transporte "${data.transporteId}" não encontrado na unidade "${data.unidadeId}" para sync Ravex`,
      );
      return;
    }

    switch (data.fase) {
      case 'buscar_viagem':
        await this.handleBuscarViagem(context, data);
        break;
      case 'aguardar_inicio':
        await this.handleAguardarInicio(context, data);
        break;
      case 'aguardar_fim':
        await this.handleAguardarFim(context, data);
        break;
      case 'verificar_anomalias':
        await this.handleVerificarAnomalias(context, data);
        break;
      case 'gerar_demanda_devolucao':
        await this.handleGerarDemandaDevolucao(context, data);
        break;
    }
  }

  private async handleBuscarViagem(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (context.viagemId && context.viagemFimEm) {
      return;
    }

    if (context.viagemId) {
      await this.advanceAfterViagemLoaded(context, data);
      return;
    }

    const identificador = formatIdentificadorViagemRavex(context.rota);

    try {
      const viagem =
        await this.ravexViagemClient.getViagemPorIdentificador(identificador);
      await this.persistViagemData(context, viagem);
      const updated = await this.refreshContext(data);
      if (updated) {
        await this.advanceAfterViagemLoaded(updated, data);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        await this.schedulePhase(
          'buscar_viagem',
          data,
          VIAGEM_RAVEX_DELAY_BUSCAR_MS,
        );
        return;
      }

      throw error;
    }
  }

  private async handleAguardarInicio(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (!context.viagemId) {
      await this.schedulePhase('buscar_viagem', data);
      return;
    }

    if (context.viagemInicioEm) {
      await this.advanceAfterViagemLoaded(context, data);
      return;
    }

    const viagem = await this.ravexViagemClient.getViagemPorId(context.viagemId);
    const viagemInicioEm = parseRavexDateTime(viagem.inicioDataHora);

    if (viagemInicioEm) {
      const viagemFimEm = parseRavexDateTime(viagem.fimDataHora);
      await this.transporteRepository.atualizarViagemRavex({
        transporteId: data.transporteId,
        unidadeId: data.unidadeId,
        viagemInicioEm,
        viagemFimEm,
        status:
          resolverStatusViagemRavex(viagemInicioEm, viagemFimEm) ?? undefined,
      });

      const updated = await this.refreshContext(data);
      if (updated) {
        await this.advanceAfterViagemLoaded(updated, data);
      }
      return;
    }

    await this.schedulePhase(
      'aguardar_inicio',
      data,
      VIAGEM_RAVEX_DELAY_INICIO_MS,
    );
  }

  private async handleAguardarFim(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (!context.viagemId) {
      await this.schedulePhase('buscar_viagem', data);
      return;
    }

    if (context.viagemFimEm) {
      await this.schedulePhase('verificar_anomalias', data);
      return;
    }

    const viagem = await this.ravexViagemClient.getViagemPorId(context.viagemId);
    const viagemFimEm = parseRavexDateTime(viagem.fimDataHora);

    if (viagemFimEm) {
      await this.transporteRepository.atualizarViagemRavex({
        transporteId: data.transporteId,
        unidadeId: data.unidadeId,
        viagemFimEm,
        status: 'viagem_finalizada',
      });
      await this.schedulePhase('verificar_anomalias', data);
      return;
    }

    await this.schedulePhase('aguardar_fim', data, VIAGEM_RAVEX_DELAY_FIM_MS);
  }

  private async handleVerificarAnomalias(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (!context.viagemId) {
      return;
    }

    const anomalias = await this.ravexViagemClient.listAnomalias(context.viagemId);
    const descricao =
      [
        ...new Set(
          anomalias
            .map((anomalia) => anomalia.motivo?.descricao?.trim())
            .filter(Boolean),
        ),
      ].join('; ') || null;

    if (descricao) {
      await this.transporteRepository.atualizarViagemRavex({
        transporteId: data.transporteId,
        unidadeId: data.unidadeId,
        anomalia: descricao,
      });
    }

    if (anomalias.length > 0) {
      await this.schedulePhase('gerar_demanda_devolucao', data);
    }
  }

  private async handleGerarDemandaDevolucao(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (!context.viagemId) {
      return;
    }

    await this.gerarDemandaDevolucaoViagemUseCase.execute({
      transporteId: data.transporteId,
      unidadeId: data.unidadeId,
      viagemId: context.viagemId,
    });
  }

  private async advanceAfterViagemLoaded(
    context: TransporteViagemRavexRecord,
    data: SincronizarViagemRavexJobData,
  ): Promise<void> {
    if (!context.viagemInicioEm) {
      await this.schedulePhase(
        'aguardar_inicio',
        data,
        VIAGEM_RAVEX_DELAY_INICIO_MS,
      );
      return;
    }

    if (!context.viagemFimEm) {
      await this.schedulePhase('aguardar_fim', data, VIAGEM_RAVEX_DELAY_FIM_MS);
      return;
    }

    await this.schedulePhase('verificar_anomalias', data);
  }

  private async persistViagemData(
    context: TransporteViagemRavexRecord,
    viagem: RavexViagemFaturada,
  ): Promise<void> {
    const viagemInicioEm = parseRavexDateTime(viagem.inicioDataHora);
    const viagemFimEm = parseRavexDateTime(viagem.fimDataHora);
    const input: AtualizarViagemRavexInput = {
      transporteId: context.id,
      unidadeId: context.unidadeId,
      viagemId: viagem.id,
      viagemInicioEm,
      viagemFimEm,
    };

    const status = resolverStatusViagemRavex(viagemInicioEm, viagemFimEm);
    if (status) {
      input.status = status;
    }

    await this.transporteRepository.atualizarViagemRavex(input);
  }

  private async refreshContext(
    data: SincronizarViagemRavexJobData,
  ): Promise<TransporteViagemRavexRecord | null> {
    return this.transporteRepository.findViagemRavexContext(
      data.transporteId,
      data.unidadeId,
    );
  }

  private async schedulePhase(
    fase: FaseSincronizacaoViagemRavex,
    data: SincronizarViagemRavexJobData,
    delay = 0,
  ): Promise<void> {
    await this.transporteEventPublisher.publishSincronizarViagemRavex(
      {
        transporteId: data.transporteId,
        unidadeId: data.unidadeId,
        fase,
      },
      { delay },
    );
  }
}
