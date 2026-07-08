import { Inject, Injectable } from '@nestjs/common';

import {
  CNC_REPOSITORY,
  type ICncRepository,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import {
  COBRANCA_TRANSPORTADORA_REPOSITORY,
  type ICobrancaTransportadoraRepository,
  type ProcessoDebitoStatus,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

const PROCESSO_DEBITO_STATUS_EM_ABERTO: ProcessoDebitoStatus[] = [
  'aberto',
  'em_analise',
];

export type ObterExposicaoEstoqueInput = {
  unidadeId: string;
};

export type ObterExposicaoEstoqueResult = {
  cncPendentes: number;
  cncEmAnalise: number;
  cncEmAbertoTotal: number;
  devolucaoDebitoEmAbertoValor: number;
};

@Injectable()
export class ObterExposicaoEstoqueUseCase {
  constructor(
    @Inject(CNC_REPOSITORY)
    private readonly cncRepository: ICncRepository,
    @Inject(COBRANCA_TRANSPORTADORA_REPOSITORY)
    private readonly cobrancaTransportadoraRepository: ICobrancaTransportadoraRepository,
  ) {}

  async execute(
    input: ObterExposicaoEstoqueInput,
  ): Promise<ObterExposicaoEstoqueResult> {
    const [cncPendentesResult, cncEmAnaliseResult, processosDebito] =
      await Promise.all([
        this.cncRepository.list({
          unidadeId: input.unidadeId,
          situacao: 'pendente',
          page: 1,
          limit: 1,
        }),
        this.cncRepository.list({
          unidadeId: input.unidadeId,
          situacao: 'em_analise',
          page: 1,
          limit: 1,
        }),
        this.cobrancaTransportadoraRepository.listarProcessos({
          unidadeId: input.unidadeId,
        }),
      ]);

    const cncPendentes = cncPendentesResult.total;
    const cncEmAnalise = cncEmAnaliseResult.total;

    const devolucaoDebitoEmAbertoValor = processosDebito
      .filter((processo) =>
        PROCESSO_DEBITO_STATUS_EM_ABERTO.includes(processo.status),
      )
      .reduce((acc, processo) => acc + processo.valorTotal, 0);

    return {
      cncPendentes,
      cncEmAnalise,
      cncEmAbertoTotal: cncPendentes + cncEmAnalise,
      devolucaoDebitoEmAbertoValor,
    };
  }
}
