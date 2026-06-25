import type { ParametrosSeparacao } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';

export type ItemTempoSeparacaoInput = {
  caixas: number;
  slottingOrdem: number | null;
};

export function contarCaixasItem(caixas: number): number {
  return Math.max(0, Math.floor(caixas));
}

export function calcularTempoEsperadoSeparacaoSeg(
  params: ParametrosSeparacao,
  itens: ItemTempoSeparacaoInput[],
): number {
  let total = params.gorduraInicioMapaSeg + params.gorduraFimMapaSeg;

  itens.forEach((item, index) => {
    const caixas = contarCaixasItem(item.caixas);

    if (caixas > 0) {
      total +=
        params.tempoPrimeiraCaixaSeg +
        Math.max(0, caixas - 1) * params.tempoDemaisCaixasSeg;
    }

    if (index === 0) {
      return;
    }

    if (item.slottingOrdem != null) {
      const ordemAnterior = itens[index - 1]?.slottingOrdem ?? 0;
      const delta = item.slottingOrdem - ordemAnterior;
      total += delta * params.deslocamentoEntreEnderecosSeg;
      return;
    }

    total += params.deslocamentoItensSemEnderecoSeg;
  });

  return Math.max(0, Math.round(total));
}
