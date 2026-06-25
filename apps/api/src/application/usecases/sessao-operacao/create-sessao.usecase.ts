import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CreateSessaoInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class CreateSessaoUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(input: CreateSessaoInput) {
    const escala = await this.sessaoOperacaoRepository.findEscalaById(
      input.escalaId,
    );

    if (!escala) {
      throw new NotFoundException('Escala não encontrada');
    }

    if (!escala.ativo) {
      throw new BadRequestException('Escala inativa');
    }

    try {
      return await this.sessaoOperacaoRepository.createSessao(input);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message.includes('unique') ||
        message.includes('sessoes_trabalho_escala_data_referencia_unique')
      ) {
        throw new ConflictException(
          'Já existe uma sessão para esta escala nesta data',
        );
      }

      if (message.includes('Escala')) {
        throw new BadRequestException(message);
      }

      throw error;
    }
  }
}
