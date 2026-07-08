import { Inject, Injectable } from '@nestjs/common';

import type { GatilhoRegra } from '../../../domain/model/regra-processo/regra-processo.model.js';
import {
  REGRA_PROCESSO_REPOSITORY,
  type IRegraProcessoRepository,
} from '../../../domain/repositories/regra-processo/regra-processo.repository.js';
import {
  RuleEngineService,
  type ResultadoExecucaoRegra,
} from '../../services/regra-processo/rule-engine.service.js';

export type ExecutarRegrasProcessoInput = {
  unidadeId: string;
  gatilho: GatilhoRegra;
  facts: Record<string, unknown>;
};

@Injectable()
export class ExecutarRegrasProcessoUseCase {
  constructor(
    @Inject(REGRA_PROCESSO_REPOSITORY)
    private readonly regraProcessoRepository: IRegraProcessoRepository,
    private readonly ruleEngineService: RuleEngineService,
  ) {}

  async execute(
    input: ExecutarRegrasProcessoInput,
  ): Promise<ResultadoExecucaoRegra> {
    const regras = await this.regraProcessoRepository.listarAtivasPorGatilho(
      input.unidadeId,
      input.gatilho,
    );

    if (regras.length === 0) {
      return { acoes: [], regrasDisparadas: [] };
    }

    return this.ruleEngineService.executarRegras(regras, input.facts);
  }
}
