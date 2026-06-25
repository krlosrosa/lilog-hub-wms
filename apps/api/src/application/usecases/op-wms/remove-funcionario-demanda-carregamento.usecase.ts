import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

@Injectable()
export class RemoveFuncionarioDemandaCarregamentoUseCase {
  constructor(
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    demandaId: string,
    sessaoFuncionarioId: string,
  ): Promise<void> {
    const demanda =
      await this.demandaSeparacaoRepository.findDetalheById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.mapaGrupoProcesso !== 'carregamento') {
      throw new BadRequestException(
        'Somente demandas de carregamento permitem remover auxiliares',
      );
    }

    if (demanda.sessaoFuncionarioId === sessaoFuncionarioId) {
      throw new BadRequestException(
        'Não é possível remover o responsável principal da demanda',
      );
    }

    const sessao = await this.sessaoOperacaoRepository.findSessaoById(
      demanda.sessaoId,
    );

    if (!sessao) {
      throw new NotFoundException(`Sessão "${demanda.sessaoId}" não encontrada`);
    }

    if (sessao.status !== 'aberta') {
      throw new BadRequestException('A sessão precisa estar aberta');
    }

    const funcionariosAlocados =
      await this.demandaSeparacaoRepository.listFuncionarios(demandaId);

    const alocado = funcionariosAlocados.find(
      (item) => item.sessaoFuncionarioId === sessaoFuncionarioId,
    );

    if (!alocado) {
      throw new NotFoundException('Funcionário não está alocado nesta demanda');
    }

    if (alocado.papel === 'responsavel') {
      throw new BadRequestException(
        'Não é possível remover o responsável principal da demanda',
      );
    }

    await this.demandaSeparacaoRepository.removeFuncionario(
      demandaId,
      sessaoFuncionarioId,
    );
  }
}
