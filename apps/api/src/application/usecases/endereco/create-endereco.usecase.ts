import {
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  CreateEnderecoInputSchema,
  type CreateEnderecoData,
} from '../../../domain/model/endereco/endereco.model.js';
import { ENDERECO_EVENT } from '../../../domain/model/endereco/endereco.events.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import { EnderecoEventPublisher } from '../../services/endereco-event.publisher.js';

export type CreateEnderecoUseCaseInput = {
  data: Parameters<typeof CreateEnderecoInputSchema.parse>[0];
  userId: number | null;
};

@Injectable()
export class CreateEnderecoUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    private readonly enderecoEventPublisher: EnderecoEventPublisher,
  ) {}

  async execute({ data, userId }: CreateEnderecoUseCaseInput) {
    const parsed: CreateEnderecoData = CreateEnderecoInputSchema.parse(data);

    const existing = await this.enderecoRepository.findByUnidadeAndCodigo(
      parsed.unidadeId,
      parsed.enderecoMascarado,
    );

    if (existing) {
      throw new ConflictException(
        `Endereço "${parsed.enderecoMascarado}" já existe nesta unidade`,
      );
    }

    const created = await this.enderecoRepository.create(parsed);

    await this.enderecoEventPublisher.publish({
      type: ENDERECO_EVENT.CRIADO,
      enderecoId: created.id,
      unidadeId: created.unidadeId,
      enderecoMascarado: created.enderecoMascarado,
      userId,
    });

    return created;
  }
}
