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

@Injectable()
export class RemoverApoioRecebimentoUseCase {
  constructor(
    @Inject(RECEBIMENTO_ALOCACAO_REPOSITORY)
    private readonly recebimentoAlocacaoRepository: IRecebimentoAlocacaoRepository,
  ) {}

  async execute(id: string): Promise<AlocacaoRecebimentoDto> {
    try {
      const alocacao = await this.recebimentoAlocacaoRepository.cancelarApoio(id);

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
        error instanceof Error ? error.message : 'Erro ao remover apoio';

      if (message.includes('não encontrado')) {
        throw new NotFoundException(message);
      }

      throw new BadRequestException(message);
    }
  }
}
