import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class RemoveEscalaFuncionarioUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(escalaId: string, funcionarioId: number) {
    const escala = await this.sessaoOperacaoRepository.findEscalaById(escalaId);

    if (!escala) {
      throw new NotFoundException('Escala não encontrada');
    }

    const removed = await this.sessaoOperacaoRepository.removeEquipeFuncionario(
      escala.equipeId,
      funcionarioId,
    );

    if (!removed) {
      throw new NotFoundException('Funcionário não vinculado à escala');
    }

    return { success: true };
  }
}
