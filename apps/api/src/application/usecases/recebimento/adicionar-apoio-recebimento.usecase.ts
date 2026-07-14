import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { AlocacaoRecebimentoDto } from '../../dtos/recebimento/recursos-recebimento-sessao.dto.js';
import {
  RECEBIMENTO_ALOCACAO_REPOSITORY,
  type IRecebimentoAlocacaoRepository,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

export type AdicionarApoioRecebimentoUseCaseInput = {
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  unidadeId: string;
  userId: number | null;
};

@Injectable()
export class AdicionarApoioRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    input: AdicionarApoioRecebimentoUseCaseInput,
  ): Promise<AlocacaoRecebimentoDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(
      input.sessaoId,
    );

    if (!sessao) {
      throw new NotFoundException(`Sessão "${input.sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta para adicionar apoio');
    }

    if (sessao.unidadeId !== input.unidadeId) {
      throw new BadRequestException('Sessão não pertence à unidade informada');
    }

    const sessaoFuncionario =
      await this.sessaoOperacaoRepository.findSessaoFuncionarioById(
        input.sessaoId,
        input.sessaoFuncionarioId,
      );

    if (!sessaoFuncionario) {
      throw new NotFoundException('Funcionário não encontrado na sessão');
    }

    if (
      sessaoFuncionario.status !== 'presente' &&
      sessaoFuncionario.status !== 'atraso'
    ) {
      throw new BadRequestException('Funcionário não está presente na sessão');
    }

    try {
      const alocacao = await this.recebimentoAlocacaoRepository.criarApoio({
        preRecebimentoId: input.preRecebimentoId,
        sessaoId: input.sessaoId,
        sessaoFuncionarioId: input.sessaoFuncionarioId,
        funcionarioId: sessaoFuncionario.funcionarioId,
        atribuidoPorUserId: input.userId,
      });

      return {
        id: alocacao.id,
        preRecebimentoId: alocacao.preRecebimentoId,
        sessaoId: alocacao.sessaoId,
        sessaoFuncionarioId: alocacao.sessaoFuncionarioId,
        funcionarioId: alocacao.funcionarioId,
        papel: alocacao.papel,
        status: alocacao.status,
        atribuidoEm: alocacao.atribuidoEm.toISOString(),
        inicioEm: alocacao.inicioEm?.toISOString() ?? null,
        canceladoEm: alocacao.canceladoEm?.toISOString() ?? null,
        encerradoEm: alocacao.encerradoEm?.toISOString() ?? null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao adicionar apoio';
      throw new BadRequestException(message);
    }
  }
}
