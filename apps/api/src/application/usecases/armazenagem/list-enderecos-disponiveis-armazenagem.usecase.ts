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

const TIPOS_ARMAZENAGEM = ['pulmao', 'picking', 'recebimento'] as const;

export type ListEnderecosDisponiveisArmazenagemInput = {
  demandaId: string;
  itemId: string;
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
    page,
    limit,
    search,
  }: ListEnderecosDisponiveisArmazenagemInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
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
      tipos: [...TIPOS_ARMAZENAGEM],
      sortBy: 'armazenagem',
      page,
      limit,
      search,
      excludeIds,
    };

    return this.enderecoRepository.list(filter);
  }
}
