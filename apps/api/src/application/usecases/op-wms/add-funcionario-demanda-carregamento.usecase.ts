import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { DemandaFuncionarioDto } from '../../dtos/op-wms/demanda-separacao.dto.js';
import {
  DEMANDA_SEPARACAO_REPOSITORY,
  type IDemandaSeparacaoRepository,
} from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

const PRESENCA_ELEGIVEL = new Set(['presente', 'atraso']);
const MAX_FUNCIONARIOS_CARREGAMENTO = 10;

function mapFuncionarioToDto(
  funcionario: Awaited<
    ReturnType<IDemandaSeparacaoRepository['addFuncionario']>
  >,
): DemandaFuncionarioDto {
  return {
    id: funcionario.id,
    demandaId: funcionario.demandaId,
    sessaoFuncionarioId: funcionario.sessaoFuncionarioId,
    funcionarioId: funcionario.funcionarioId,
    papel: funcionario.papel,
    entrouEm: funcionario.entrouEm.toISOString(),
    saiuEm: funcionario.saiuEm?.toISOString() ?? null,
  };
}

@Injectable()
export class AddFuncionarioDemandaCarregamentoUseCase {
  constructor(
    @Inject(DEMANDA_SEPARACAO_REPOSITORY)
    private readonly demandaSeparacaoRepository: IDemandaSeparacaoRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
  ) {}

  async execute(
    demandaId: string,
    sessaoFuncionarioId: string,
  ): Promise<DemandaFuncionarioDto> {
    const demanda =
      await this.demandaSeparacaoRepository.findDetalheById(demandaId);

    if (!demanda) {
      throw new NotFoundException(`Demanda "${demandaId}" não encontrada`);
    }

    if (demanda.mapaGrupoProcesso !== 'carregamento') {
      throw new BadRequestException(
        'Somente demandas de carregamento aceitam auxiliares',
      );
    }

    if (demanda.status !== 'pendente' && demanda.status !== 'em_andamento') {
      throw new BadRequestException(
        'Somente demandas ativas aceitam novos funcionários',
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

    if (demanda.sessaoFuncionarioId === sessaoFuncionarioId) {
      throw new BadRequestException(
        'O responsável principal já está alocado na demanda',
      );
    }

    const funcionario =
      await this.sessaoOperacaoRepository.findSessaoFuncionarioById(
        demanda.sessaoId,
        sessaoFuncionarioId,
      );

    if (!funcionario || !PRESENCA_ELEGIVEL.has(funcionario.status)) {
      throw new BadRequestException(
        'Funcionário não está presente na sessão',
      );
    }

    const funcionariosAlocados =
      await this.demandaSeparacaoRepository.listFuncionarios(demandaId);

    const totalAlocados = funcionariosAlocados.length + 1;

    if (totalAlocados >= MAX_FUNCIONARIOS_CARREGAMENTO) {
      throw new BadRequestException(
        `Limite de ${MAX_FUNCIONARIOS_CARREGAMENTO} funcionários por demanda atingido`,
      );
    }

    const jaAlocado = funcionariosAlocados.some(
      (item) => item.sessaoFuncionarioId === sessaoFuncionarioId,
    );

    if (jaAlocado) {
      throw new BadRequestException('Funcionário já está alocado nesta demanda');
    }

    const inserido = await this.demandaSeparacaoRepository.addFuncionario(
      demandaId,
      sessaoFuncionarioId,
      'auxiliar',
    );

    return mapFuncionarioToDto(inserido);
  }
}
