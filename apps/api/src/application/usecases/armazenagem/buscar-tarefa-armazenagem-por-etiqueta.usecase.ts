import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ARMAZENAGEM_REPOSITORY,
  type IArmazenagemRepository,
} from '../../../domain/repositories/armazenagem/armazenagem.repository.js';

export type BuscarTarefaArmazenagemPorEtiquetaInput = {
  unidadeId: string;
  codigo: string;
};

export type BuscarTarefaArmazenagemPorEtiquetaResult = {
  demandaId: string;
  tarefaId: string;
  unitizadorCodigo: string;
};

@Injectable()
export class BuscarTarefaArmazenagemPorEtiquetaUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
  ) {}

  async execute({
    unidadeId,
    codigo,
  }: BuscarTarefaArmazenagemPorEtiquetaInput): Promise<BuscarTarefaArmazenagemPorEtiquetaResult> {
    const normalized = codigo.trim();
    if (!normalized) {
      throw new BadRequestException('Informe o código da etiqueta');
    }

    const tarefa = await this.armazenagemRepository.findTarefaByUnitizadorCodigo(
      unidadeId,
      normalized,
    );

    if (!tarefa) {
      throw new NotFoundException(
        `Nenhuma tarefa de armazenagem encontrada para a etiqueta "${normalized}"`,
      );
    }

    if (tarefa.status === 'armazenada') {
      throw new BadRequestException('Este palete já foi armazenado');
    }

    if (tarefa.status === 'cancelada') {
      throw new BadRequestException('Esta tarefa de armazenagem foi cancelada');
    }

    const demanda = await this.armazenagemRepository.findDemandaById(tarefa.demandaId);

    if (!demanda) {
      throw new NotFoundException('Demanda de armazenagem não encontrada');
    }

    if (demanda.unidadeId !== unidadeId) {
      throw new NotFoundException(
        `Nenhuma tarefa de armazenagem encontrada para a etiqueta "${normalized}"`,
      );
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda de armazenagem não está disponível');
    }

    if (demanda.status === 'aguardando_validacao') {
      throw new BadRequestException('Endereço ainda não validado pelo ADM');
    }

    return {
      demandaId: tarefa.demandaId,
      tarefaId: tarefa.id,
      unitizadorCodigo: tarefa.unitizadorCodigo ?? normalized.toUpperCase(),
    };
  }
}
