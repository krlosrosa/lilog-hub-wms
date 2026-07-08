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
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
  type ListEnderecosFilter,
} from '../../../domain/repositories/endereco/endereco.repository.js';

import { TIPOS_ENDERECO_ARMAZENAGEM } from '../../../domain/model/armazenagem/armazenagem.model.js';

export type ListEnderecosDisponiveisArmazenagemInput = {
  demandaId: string;
  itemId?: string;
  tarefaId?: string;
  page?: number;
  limit?: number;
  search?: string;
};

@Injectable()
export class ListEnderecosDisponiveisArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({
    demandaId,
    itemId,
    tarefaId,
    page,
    limit,
    search,
  }: ListEnderecosDisponiveisArmazenagemInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (tarefaId) {
      const tarefa =
        demanda.tarefas?.find((entry) => entry.id === tarefaId) ??
        (await this.armazenagemRepository.findTarefaById(tarefaId));

      if (!tarefa || tarefa.demandaId !== demandaId) {
        throw new NotFoundException(`Tarefa "${tarefaId}" não encontrada na demanda`);
      }

      if (tarefa.status === 'armazenada') {
        throw new BadRequestException('Palete já foi armazenado');
      }

      const excludeIds =
        await this.armazenagemRepository.listEnderecosSugeridosReservados({
          unidadeId: demanda.unidadeId,
          excludeTarefaId: tarefaId,
        });

      const filter: ListEnderecosFilter = {
        unidadeId: demanda.unidadeId,
        status: 'disponivel',
        tipos: [...TIPOS_ENDERECO_ARMAZENAGEM],
        sortBy: 'armazenagem',
        page,
        limit,
        search,
        excludeIds,
      };

      return this.enderecoRepository.list(filter);
    }

    if (!itemId) {
      throw new BadRequestException('Informe itemId ou tarefaId');
    }

    const item = demanda.itens.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item "${itemId}" não encontrado na demanda`);
    }

    if (item.status === 'armazenado') {
      throw new BadRequestException('Item já foi armazenado');
    }

    const excludeIds =
      await this.armazenagemRepository.listEnderecosSugeridosReservados({
        unidadeId: demanda.unidadeId,
        excludeItemId: itemId,
      });

    const filter: ListEnderecosFilter = {
      unidadeId: demanda.unidadeId,
      status: 'disponivel',
      tipos: [...TIPOS_ENDERECO_ARMAZENAGEM],
      sortBy: 'armazenagem',
      page,
      limit,
      search,
      excludeIds,
    };

    return this.enderecoRepository.list(filter);
  }
}
