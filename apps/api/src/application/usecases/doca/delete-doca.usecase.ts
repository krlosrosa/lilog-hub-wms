import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DOCA_REPOSITORY,
  type IDocaRepository,
} from '../../../domain/repositories/doca/doca.repository.js';

@Injectable()
export class DeleteDocaUseCase {
  constructor(
    @Inject(DOCA_REPOSITORY)
    private readonly docaRepository: IDocaRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.docaRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Doca "${id}" não encontrada`);
    }

    const hasHistory = await this.docaRepository.hasOperationalHistory(id);

    if (hasHistory) {
      throw new BadRequestException(
        'Não é permitido excluir doca com histórico operacional',
      );
    }

    await this.docaRepository.delete(id);
  }
}
