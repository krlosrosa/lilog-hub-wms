import { Inject, Injectable } from '@nestjs/common';

import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoStatus,
} from '../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

type NotificarNovoDebitoInput = {
  processoDebitoId: string;
  transportadoraId: string | null;
  codigoDemanda: string;
};

type NotificarStatusAtualizadoInput = {
  processoDebitoId: string;
  transportadoraId: string | null;
  codigoDemanda: string;
  statusNovo: ProcessoDebitoStatus;
};

type NotificarNovaInteracaoCdInput = {
  processoDebitoId: string;
  transportadoraId: string | null;
  codigoDemanda: string;
};

const STATUS_RELEVANTES: ProcessoDebitoStatus[] = [
  'em_analise',
  'aprovado',
  'cancelado',
];

const STATUS_LABELS: Record<ProcessoDebitoStatus, string> = {
  aberto: 'Aberto',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  incluido_em_documento: 'Incluído em documento',
  cancelado: 'Cancelado',
};

@Injectable()
export class PortalNotificacaoService {
  constructor(
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaRepository: ICobrancaTransportadoraRepository,
  ) {}

  async notificarNovoDebito(input: NotificarNovoDebitoInput): Promise<void> {
    if (!input.transportadoraId) {
      return;
    }

    await this.cobrancaRepository.criarNotificacaoPortal({
      transportadoraId: input.transportadoraId,
      processoDebitoId: input.processoDebitoId,
      tipo: 'novo_debito',
      titulo: 'Novo processo de débito aberto',
      mensagem: `Demanda ${input.codigoDemanda} gerou um novo processo de débito para revisão.`,
      rotaDestino: `/debitos/${input.processoDebitoId}`,
    });
  }

  async notificarStatusAtualizado(
    input: NotificarStatusAtualizadoInput,
  ): Promise<void> {
    if (
      !input.transportadoraId ||
      !STATUS_RELEVANTES.includes(input.statusNovo)
    ) {
      return;
    }

    const statusLabel = STATUS_LABELS[input.statusNovo];

    await this.cobrancaRepository.criarNotificacaoPortal({
      transportadoraId: input.transportadoraId,
      processoDebitoId: input.processoDebitoId,
      tipo: 'status_atualizado',
      titulo: 'Status do processo atualizado',
      mensagem: `O processo da demanda ${input.codigoDemanda} foi atualizado para ${statusLabel}.`,
      rotaDestino: `/debitos/${input.processoDebitoId}`,
    });
  }

  async notificarNovaInteracaoCd(
    input: NotificarNovaInteracaoCdInput,
  ): Promise<void> {
    if (!input.transportadoraId) {
      return;
    }

    await this.cobrancaRepository.criarNotificacaoPortal({
      transportadoraId: input.transportadoraId,
      processoDebitoId: input.processoDebitoId,
      tipo: 'nova_interacao',
      titulo: 'Nova mensagem do CD',
      mensagem: `Há uma nova interação no processo da demanda ${input.codigoDemanda}.`,
      rotaDestino: `/debitos/${input.processoDebitoId}`,
    });
  }
}
