import { Inject, Injectable } from '@nestjs/common';

import type {
  ModoUnitizacao,
  TarefaArmazenagemInput,
} from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { ItemAguardandoArmazenagem } from '../../../domain/services/build-itens-aguardando-armazenagem.js';
import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import { SugerirEnderecosDemandaArmazenagemUseCase } from './sugerir-enderecos-demanda-armazenagem.usecase.js';

export type GerarDemandaArmazenagemInput = {
  unidadeId: string;
  recebimentoId: string;
  modoUnitizacao: ModoUnitizacao | string;
  itens?: ItemAguardandoArmazenagem[];
  tarefas?: TarefaArmazenagemInput[];
  enderecosJaValidados?: boolean;
  pularSugestaoEndereco?: boolean;
  userId?: number | null;
};

@Injectable()
export class GerarDemandaArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    private readonly sugerirEnderecosDemandaArmazenagemUseCase: SugerirEnderecosDemandaArmazenagemUseCase,
  ) {}

  async execute(input: GerarDemandaArmazenagemInput) {
    const hasTarefas = (input.tarefas?.length ?? 0) > 0;
    const hasItens = (input.itens?.length ?? 0) > 0;

    if (!hasTarefas && !hasItens) {
      return null;
    }

    const existing = await this.armazenagemRepository.findDemandaByRecebimentoId(
      input.recebimentoId,
    );

    if (existing) {
      return existing;
    }

    const demanda = await this.armazenagemRepository.criarDemanda({
      unidadeId: input.unidadeId,
      recebimentoId: input.recebimentoId,
      modoUnitizacao: input.modoUnitizacao as ModoUnitizacao,
      tarefas: input.tarefas,
      itens: input.itens?.map((item) => ({
        unitizadorId: item.unitizadorId,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        unidadeMedida: item.unidadeMedida,
        lote: item.lote,
        validade: item.validade,
        numeroSerie: item.numeroSerie,
        statusSaldo: item.statusSaldo ?? 'liberado',
      })),
    });

    const requerValidacaoAdm =
      input.modoUnitizacao === 'bipar_palete_no_recebimento' &&
      !input.enderecosJaValidados;

    const unitizadorIds = [
      ...new Set(
        [
          ...(input.itens ?? []).map((item) => item.unitizadorId),
          ...(input.tarefas ?? []).map((tarefa) => tarefa.unitizadorId),
        ].filter((id): id is string => id !== null),
      ),
    ];

    if (requerValidacaoAdm) {
      await this.armazenagemRepository.updateStatusDemanda(
        demanda.id,
        'aguardando_validacao',
      );
    } else if (input.enderecosJaValidados) {
      await Promise.all(
        unitizadorIds.map((unitizadorId) =>
          this.armazenagemRepository.updateUnitizadorStatus(
            unitizadorId,
            'aguardando_armazenagem',
          ),
        ),
      );

      await this.armazenagemRepository.updateStatusDemanda(
        demanda.id,
        'aguardando_inicio',
        {
          validadoPor: input.userId ?? undefined,
          validadoEm: new Date(),
        },
      );
    } else {
      await Promise.all(
        unitizadorIds.map((unitizadorId) =>
          this.armazenagemRepository.updateUnitizadorStatus(
            unitizadorId,
            'aguardando_armazenagem',
          ),
        ),
      );
    }

    const precisaSugerirEndereco =
      !input.enderecosJaValidados &&
      (hasTarefas
        ? (input.tarefas ?? []).some((tarefa) => !tarefa.enderecoSugeridoId)
        : true);

    if (!input.pularSugestaoEndereco && precisaSugerirEndereco) {
      return this.sugerirEnderecosDemandaArmazenagemUseCase.execute({
        demandaId: demanda.id,
      });
    }

    return this.armazenagemRepository.findDemandaById(demanda.id);
  }
}
