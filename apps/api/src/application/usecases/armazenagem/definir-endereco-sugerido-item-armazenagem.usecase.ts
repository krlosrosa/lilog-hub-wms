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
} from '../../../domain/repositories/endereco/endereco.repository.js';

export type DefinirEnderecoSugeridoItemArmazenagemInput = {
  demandaId: string;
  itemId: string;
  enderecoSugeridoId: string;
};

@Injectable()
export class DefinirEnderecoSugeridoItemArmazenagemUseCase {
  constructor(
    @Inject(ARMAZENAGEM_REPOSITORY)
    private readonly armazenagemRepository: IArmazenagemRepository,
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute({
    demandaId,
    itemId,
    enderecoSugeridoId,
  }: DefinirEnderecoSugeridoItemArmazenagemInput) {
    const demanda = await this.armazenagemRepository.findDemandaById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.status === 'concluida' || demanda.status === 'cancelada') {
      throw new BadRequestException('Demanda não está disponível para alteração');
    }

    const item = demanda.itens.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item "${itemId}" não encontrado na demanda`);
    }

    if (item.status === 'armazenado') {
      throw new BadRequestException('Item já armazenado não pode ser alterado');
    }

    const endereco = await this.enderecoRepository.findById(enderecoSugeridoId);

    if (!endereco) {
      throw new NotFoundException(
        `Endereço "${enderecoSugeridoId}" não encontrado`,
      );
    }

    if (endereco.unidadeId !== demanda.unidadeId) {
      throw new BadRequestException(
        'Endereço informado não pertence à unidade da demanda',
      );
    }

    if (endereco.status !== 'disponivel') {
      throw new BadRequestException('Endereço selecionado não está disponível');
    }

    const enderecosReservados =
      await this.armazenagemRepository.listEnderecosSugeridosReservados({
        unidadeId: demanda.unidadeId,
        excludeItemId: itemId,
      });

    if (enderecosReservados.includes(enderecoSugeridoId)) {
      throw new BadRequestException(
        'Endereço já foi selecionado para outro item de armazenagem',
      );
    }

    const updated = await this.armazenagemRepository.updateEnderecoSugeridoItem(
      itemId,
      enderecoSugeridoId,
    );

    if (!updated) {
      throw new Error('Failed to update endereco sugerido');
    }

    return updated;
  }
}
