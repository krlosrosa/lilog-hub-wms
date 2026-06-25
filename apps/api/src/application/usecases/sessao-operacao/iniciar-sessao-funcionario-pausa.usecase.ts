import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { IniciarSessaoPausaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const STATUS_COM_PAUSA = new Set(['presente', 'atraso']);

@Injectable()
export class IniciarSessaoFuncionarioPausaUseCase {
  constructor(
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    sessaoId: string,
    funcionarioId: number,
    userId: number,
    input: IniciarSessaoPausaInput,
  ) {
    const sessao = await this.sessaoOperacaoRepository.findSessaoById(sessaoId);

    if (!sessao) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException(
        'Pausas só podem ser registradas em sessões abertas',
      );
    }

    const funcionario = await this.sessaoOperacaoRepository.findSessaoFuncionario(
      sessaoId,
      funcionarioId,
    );

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado na sessão');
    }

    if (!STATUS_COM_PAUSA.has(funcionario.status)) {
      throw new BadRequestException(
        'Pausas só podem ser registradas para funcionários presentes ou com atraso',
      );
    }

    const pausas = await this.sessaoOperacaoRepository.listSessaoFuncionarioPausas(
      sessaoId,
      funcionarioId,
    );

    if (pausas.emPausaAgora) {
      throw new ConflictException('Funcionário já possui uma pausa em andamento');
    }

    try {
      return await this.sessaoOperacaoRepository.iniciarSessaoFuncionarioPausa(
        sessaoId,
        funcionarioId,
        userId,
        input,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('sessao_funcionario_pausas_um_aberto_idx')
      ) {
        throw new ConflictException('Funcionário já possui uma pausa em andamento');
      }
      throw error;
    }
  }
}
