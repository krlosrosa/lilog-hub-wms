import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type ChecklistRecebimentoRecord,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import {
  RECEBIMENTO_REPOSITORY,
  type IRecebimentoRepository,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';

function mapChecklistResponse(record: ChecklistRecebimentoRecord) {
  return {
    id: record.id,
    recebimentoId: record.recebimentoId,
    lacre: record.lacre,
    tempBau: record.tempBau,
    tempProduto: record.tempProduto,
    conditions: record.conditions,
    observacoes: record.observacoes,
    photoCount: record.photoCount,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class GetChecklistRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_REPOSITORY)
    private readonly recebimentoRepository: IRecebimentoRepository,
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
  ) {}

  async execute(recebimentoId: string) {
    const recebimento = await this.recebimentoRepository.findById(recebimentoId);

    if (!recebimento) {
      throw new NotFoundException(
        `Recebimento "${recebimentoId}" não encontrado`,
      );
    }

    const checklist =
      await this.conferenciaRepository.findChecklistByRecebimentoId(
        recebimentoId,
      );

    if (!checklist) {
      throw new NotFoundException(
        `Checklist não encontrado para o recebimento "${recebimentoId}"`,
      );
    }

    return mapChecklistResponse(checklist);
  }
}
