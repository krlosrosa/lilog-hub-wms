import { Injectable } from '@nestjs/common';
import { Engine } from 'json-rules-engine';

import type {
  AcaoRegra,
} from '../../../domain/model/regra-processo/regra-processo.model.js';
import type { RegraProcessoRecord } from '../../../domain/repositories/regra-processo/regra-processo.repository.js';
import {
  CUSTOM_OPERATORS,
  regraProcessoToEngineRule,
  type EngineRule,
} from './rule-engine-converter.js';

export type ResultadoExecucaoRegra = {
  acoes: AcaoRegra[];
  regrasDisparadas: string[];
};

@Injectable()
export class RuleEngineService {
  createEngine(): Engine {
    const engine = new Engine([], { allowUndefinedFacts: true });

    engine.addOperator(CUSTOM_OPERATORS.stringContains, (factValue, jsonValue) => {
      if (typeof factValue !== 'string' || typeof jsonValue !== 'string') {
        return false;
      }
      return factValue.toLowerCase().includes(jsonValue.toLowerCase());
    });

    return engine;
  }

  async executarRegras(
    regras: RegraProcessoRecord[],
    facts: Record<string, unknown>,
  ): Promise<ResultadoExecucaoRegra> {
    const regrasOrdenadas = [...regras].sort(
      (left, right) => left.prioridade - right.prioridade,
    );

    const acoes: AcaoRegra[] = [];
    const regrasDisparadas: string[] = [];

    for (const regra of regrasOrdenadas) {
      const engineRule = regraProcessoToEngineRule({
        nome: regra.nome,
        prioridade: regra.prioridade,
        arvoreCondicoes: regra.arvoreCondicoes,
        acoes: regra.acoes,
      });

      const matched = await this.runSingleRule(engineRule, facts);
      if (!matched) {
        continue;
      }

      acoes.push(...regra.acoes);
      regrasDisparadas.push(regra.id);

      if (regra.modoAvaliacao === 'parar_no_primeiro_match') {
        break;
      }
    }

    return { acoes, regrasDisparadas };
  }

  private async runSingleRule(
    rule: EngineRule,
    facts: Record<string, unknown>,
  ): Promise<boolean> {
    const engine = this.createEngine();
    engine.addRule(rule);

    for (const [factName, value] of Object.entries(facts)) {
      engine.addFact(factName, value);
    }

    const { events } = await engine.run(facts);
    return events.length > 0;
  }
}
