import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CriarAlocacaoDevolucaoResponseDto } from '../../dtos/devolucao/recursos-devolucao-sessao.dto.js';
import {
  DEVOLUCAO_REPOSITORY,
  type IDevolucaoRepository,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

export type CriarAlocacaoDevolucaoInput = {
  demandaId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcao?: 'lider' | 'conferente' | 'auxiliar';
  unidadeId: string;
};

@Injectable()
export class CriarAlocacaoDevolucaoUseCase {
  constructor(
    @Inject(DEVOLUCAO_REPOSITORY)
    private readonly devolucaoRepository: IDevolucaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    input: CriarAlocacaoDevolucaoInput,
  ): Promise<CriarAlocacaoDevolucaoResponseDto> {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(
      input.sessaoId,
    );

    if (!sessao) {
      throw new NotFoundException(`Sessão "${input.sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    if (sessao.unidadeId !== input.unidadeId) {
      throw new BadRequestException('Sessão não pertence à unidade informada');
    }

    try {
      const created = await this.devolucaoRepository.criarAlocacao(input);

      return {
        id: created.id,
        demandaId: created.demandaId,
        sessaoId: created.sessaoId,
        sessaoFuncionarioId: created.sessaoFuncionarioId,
        funcao: created.funcao,
        status: created.status,
        atribuidoEm: created.atribuidoEm.toISOString(),
        inicioEm: created.inicioEm?.toISOString() ?? null,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar alocação';

      throw new BadRequestException(message);
    }
  }
}
