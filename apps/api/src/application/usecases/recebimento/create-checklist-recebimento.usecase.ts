import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateChecklistRecebimentoInputSchema,
  type CreateChecklistRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import { RecebimentoParticipacaoService } from '../../services/recebimento/recebimento-participacao.service.js';

export type CreateChecklistRecebimentoUseCaseInput = {
  recebimentoId: string;
  data: CreateChecklistRecebimentoInput;
  userId?: number | null;
};

@Injectable()
export class CreateChecklistRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
    private readonly recebimentoParticipacaoService: RecebimentoParticipacaoService,
  ) {}

  async execute({ recebimentoId, data, userId }: CreateChecklistRecebimentoUseCaseInput) {
    const parsed = CreateChecklistRecebimentoInputSchema.parse(data);

    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(
        `Recebimento "${recebimentoId}" não encontrado`,
      );
    }

    if (recebimento.situacao !== 'em_conferencia') {
      throw new BadRequestException(
        'Checklist só pode ser registrado para recebimentos em andamento',
      );
    }

    await this.recebimentoParticipacaoService.assertResponsavelForRecebimento(
      recebimentoId,
      userId ?? null,
    );

    return this.conferenciaRepository.createChecklist(recebimentoId, parsed);
  }
}
