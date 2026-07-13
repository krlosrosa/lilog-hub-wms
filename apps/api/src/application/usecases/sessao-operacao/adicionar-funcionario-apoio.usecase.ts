import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AdicionarFuncionarioApoioInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  FUNCIONARIO_REPOSITORY,
  type IFuncionarioRepository,
} from '../../../domain/repositories/funcionario/funcionario.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class AdicionarFuncionarioApoioUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    @Inject(FUNCIONARIO_REPOSITORY)
    private readonly funcionarioRepository: IFuncionarioRepository,
  ) {}

  async execute(
    sessaoId: string,
    input: AdicionarFuncionarioApoioInput,
    userId: number,
  ) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException(`Sessão "${sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const funcionario = await this.funcionarioRepository.findById(
      input.funcionarioId,
    );

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    if (funcionario.unidadeId !== sessao.unidadeId) {
      throw new BadRequestException(
        'Funcionário pertence a outra unidade operacional',
      );
    }

    const funcionariosAtivos =
      await this.sessaoOperacaoRepository.listSessaoFuncionarios(sessaoId);

    if (
      funcionariosAtivos.some(
        (item) => item.funcionarioId === input.funcionarioId,
      )
    ) {
      throw new ConflictException('Funcionário já está vinculado a esta sessão');
    }

    const sessaoOrigem =
      await this.sessaoOperacaoRepository.findSessaoTitularAbertaPorFuncionario(
        sessao.unidadeId,
        input.funcionarioId,
        sessaoId,
      );

    if (!sessaoOrigem) {
      throw new BadRequestException(
        'Funcionário precisa estar presente em outra sessão aberta para atuar como apoio',
      );
    }

    try {
      return await this.sessaoOperacaoRepository.adicionarFuncionarioApoio({
        sessaoId,
        funcionarioId: input.funcionarioId,
        equipeOrigemId: sessaoOrigem.equipeId,
        sessaoOrigemId: sessaoOrigem.sessaoId,
        userId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('unique') || message.includes('duplicate')) {
        throw new ConflictException('Funcionário já está vinculado a esta sessão');
      }

      throw error;
    }
  }
}
