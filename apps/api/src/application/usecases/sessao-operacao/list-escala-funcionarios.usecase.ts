import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class ListEscalaFuncionariosUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(escalaId: string) {
    const escala = await this.sessaoOperacaoRepository.findEscalaById(escalaId);

    if (!escala) {
      throw new NotFoundException('Escala não encontrada');
    }

    const items = await this.sessaoOperacaoRepository.listEquipeFuncionarios(
      escala.equipeId,
    );

    return { items };
  }
}
