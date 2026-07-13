import { Inject, Injectable } from '@nestjs/common';

import type { RecebimentoPainelSnapshotDto } from '../../dtos/recebimento/recebimento-painel-snapshot.dto.js';
import {
  montarSnapshotRecebimentoPainel,
  type SessaoOperacionalPainelInput,
} from '../../services/recebimento/montar-snapshot-recebimento-painel.js';
import { GetRecursosRecebimentoSessaoUseCase } from './get-recursos-recebimento-sessao.usecase.js';
import {
  RECEBIMENTO_PAINEL_REPOSITORY,
  type IRecebimentoPainelRepository,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import {
  SESSAO_OPERACAO_REPOSITORY,
  type ISessaoOperacaoRepository,
  type SessaoRecord,
} from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';

type GetRecebimentoPainelSnapshotInput = {
  unidadeId: string;
  dataInicio: Date;
  dataFim: Date;
};

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeArea(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function isRecebimentoSessao(sessao: SessaoRecord): boolean {
  const normalizedTarget = normalizeArea('recebimento');
  const hints = [sessao.equipeArea, sessao.equipeNome, sessao.escalaNome].filter(
    (hint): hint is string => Boolean(hint && hint.trim()),
  );

  return hints.some((hint) => {
    const normalizedHint = normalizeArea(hint);
    return (
      normalizedHint.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedHint)
    );
  });
}

@Injectable()
export class GetRecebimentoPainelSnapshotUseCase {
  constructor(
    @Inject(RECEBIMENTO_PAINEL_REPOSITORY)
    private readonly recebimentoPainelRepository: IRecebimentoPainelRepository,
    @Inject(SESSAO_OPERACAO_REPOSITORY)
    private readonly sessaoOperacaoRepository: ISessaoOperacaoRepository,
    private readonly getRecursosRecebimentoSessaoUseCase: GetRecursosRecebimentoSessaoUseCase,
  ) {}

  async execute(
    input: GetRecebimentoPainelSnapshotInput,
  ): Promise<RecebimentoPainelSnapshotDto> {
    const readModel = await this.recebimentoPainelRepository.obterReadModel({
      unidadeId: input.unidadeId,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
    });

    const sessaoAtiva = await this.resolverSessaoOperacional(
      input.unidadeId,
      input.dataFim,
    );

    return montarSnapshotRecebimentoPainel({
      unidadeId: input.unidadeId,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      readModel,
      sessaoOperacional: sessaoAtiva,
    });
  }

  private async resolverSessaoOperacional(
    unidadeId: string,
    dataFim: Date,
  ): Promise<SessaoOperacionalPainelInput | null> {
    const dataReferencia = toLocalDateString(dataFim);
    const sessoes = await this.sessaoOperacaoRepository.listSessoes({
      unidadeId,
      page: 1,
      limit: 50,
      status: 'aberta',
      dataReferencia,
    });

    const sessao = sessoes.items.find(isRecebimentoSessao);
    if (!sessao) {
      return null;
    }

    const [recursos, todosFuncionarios] = await Promise.all([
      this.getRecursosRecebimentoSessaoUseCase.execute(sessao.id, unidadeId),
      this.sessaoOperacaoRepository.listSessaoFuncionarios(sessao.id),
    ]);

    return {
      sessao,
      recursos,
      todosFuncionarios,
    };
  }
}
