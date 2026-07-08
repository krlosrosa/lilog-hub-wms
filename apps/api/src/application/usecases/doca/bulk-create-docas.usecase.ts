import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BulkCreateDocaInputSchema,
  buildDocasFromInterval,
  type BulkCreateDocaInput,
} from '../../../domain/model/doca/doca.model.js';
import { DOCA_EVENT } from '../../../domain/model/doca/doca.events.js';
import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';
import { DocaEventPublisher } from '../../services/doca-event.publisher.js';

export type BulkCreateDocasUseCaseInput = {
  data: BulkCreateDocaInput;
  userId: number | null;
};

@Injectable()
export class BulkCreateDocasUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
    private readonly docaEventPublisher: DocaEventPublisher,
  ) {}

  async execute({ data, userId }: BulkCreateDocasUseCaseInput) {
    const parsed = BulkCreateDocaInputSchema.parse(data);

    const unidade = await this.unidadeRepository.findById(parsed.unidadeId);

    if (!unidade) {
      throw new NotFoundException(
        `Unidade "${parsed.unidadeId}" não encontrada`,
      );
    }

    const items = buildDocasFromInterval(parsed);
    const result = await this.docaRepository.createBulk(items);

    await Promise.all(
      result.items.map((doca) =>
        this.docaEventPublisher.publish({
          type: DOCA_EVENT.CADASTRADA,
          docaId: doca.id,
          unidadeId: doca.unidadeId,
          userId,
        }),
      ),
    );

    return result;
  }
}
