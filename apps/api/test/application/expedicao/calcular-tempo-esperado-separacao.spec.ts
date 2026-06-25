import { describe, expect, it } from 'vitest';

import {
  calcularTempoEsperadoSeparacaoSeg,
  contarCaixasItem,
} from '../../../src/application/services/expedicao/calcular-tempo-esperado-separacao.js';
import type { ParametrosSeparacao } from '../../../src/domain/model/configuracao-operacional/configuracao-operacional.model.js';

const paramsBase: ParametrosSeparacao = {
  deslocamentoEntreEnderecosSeg: 5,
  deslocamentoItensSemEnderecoSeg: 5,
  tempoPrimeiraCaixaSeg: 5,
  tempoDemaisCaixasSeg: 2,
  gorduraInicioMapaSeg: 60,
  gorduraFimMapaSeg: 60,
};

describe('calcularTempoEsperadoSeparacaoSeg', () => {
  it('retorna apenas gorduras para grupo vazio', () => {
    expect(calcularTempoEsperadoSeparacaoSeg(paramsBase, [])).toBe(120);
  });

  it('calcula tempo de caixas para item com 3 caixas sem deslocamento', () => {
    expect(
      calcularTempoEsperadoSeparacaoSeg(paramsBase, [
        { caixas: 3, slottingOrdem: 10 },
      ]),
    ).toBe(120 + 5 + 2 * 2);
  });

  it('calcula deslocamento por delta de slottingOrdem entre itens', () => {
    expect(
      calcularTempoEsperadoSeparacaoSeg(paramsBase, [
        { caixas: 1, slottingOrdem: 10 },
        { caixas: 1, slottingOrdem: 15 },
      ]),
    ).toBe(120 + 5 + 5 + (15 - 10) * 5);
  });

  it('aplica deslocamentoItensSemEnderecoSeg quando slottingOrdem é null', () => {
    expect(
      calcularTempoEsperadoSeparacaoSeg(paramsBase, [
        { caixas: 1, slottingOrdem: 10 },
        { caixas: 1, slottingOrdem: null },
      ]),
    ).toBe(120 + 5 + 5 + 5);
  });

  it('ignora tempo de caixa quando breakdown.caixas é zero', () => {
    expect(
      calcularTempoEsperadoSeparacaoSeg(paramsBase, [
        { caixas: 0, slottingOrdem: 10 },
        { caixas: 0, slottingOrdem: 20 },
      ]),
    ).toBe(120 + (20 - 10) * 5);
  });

  it('contarCaixasItem normaliza valores negativos', () => {
    expect(contarCaixasItem(-3)).toBe(0);
  });
});
