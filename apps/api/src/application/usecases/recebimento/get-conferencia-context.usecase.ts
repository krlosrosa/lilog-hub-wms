import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CONFERENCIA_REPOSITORY,
  type IConferenciaRepository,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';

const CONFERENCIA_SITUACOES = new Set([
  'agendado',
  'veiculo_chegou',
  'em_recebimento',
]);

@Injectable()
export class GetConferenciaContextUseCase {
  constructor(
    @Inject(CONFERENCIA_REPOSITORY)
    private readonly conferenciaRepository: IConferenciaRepository,
  ) {}

  async execute(preRecebimentoId: string) {
    const context =
      await this.conferenciaRepository.getConferenciaContext(preRecebimentoId);

    if (!context) {
      throw new NotFoundException(
        `Pré-recebimento "${preRecebimentoId}" não encontrado`,
      );
    }

    if (!CONFERENCIA_SITUACOES.has(context.situacao)) {
      throw new BadRequestException(
        'Conferência não disponível para esta carga no momento',
      );
    }

    return context;
  }
}
