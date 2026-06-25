import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import type { RegraExpedicaoForm } from '@/features/regras-expedicao/types/regra-expedicao.schema';

export { formatarTempoEsperado };

export type ItemTempoSeparacaoInput = {
  caixas: number;
  slottingOrdem: number | null;
};

type ParametrosTempo = Pick<
  RegraExpedicaoForm,
  | 'deslocamentoEntreEnderecosSeg'
  | 'deslocamentoItensSemEnderecoSeg'
  | 'tempoPrimeiraCaixaSeg'
  | 'tempoDemaisCaixasSeg'
  | 'gorduraInicioMapaSeg'
  | 'gorduraFimMapaSeg'
>;

export function montarItensPreviewSeparacao(
  qtdItens: number,
  qtdEnderecos: number,
  qtdItensSemEndereco: number,
): ItemTempoSeparacaoInput[] {
  const total = Math.max(0, qtdItens);
  const semEndereco = Math.min(total, Math.max(0, qtdItensSemEndereco));
  const comEndereco = total - semEndereco;
  const enderecos = Math.max(1, qtdEnderecos);

  return Array.from({ length: total }, (_, index) => {
    if (index >= comEndereco) {
      return { caixas: 1, slottingOrdem: null };
    }

    const bloco = Math.floor((index / Math.max(1, comEndereco)) * enderecos);
    const ordemBase = Math.min(enderecos - 1, bloco);

    return {
      caixas: 1,
      slottingOrdem: (ordemBase + 1) * 10,
    };
  });
}

export function calcularTempoEsperadoSeg(
  params: ParametrosTempo,
  itens: ItemTempoSeparacaoInput[],
): number {
  let total = params.gorduraInicioMapaSeg + params.gorduraFimMapaSeg;

  itens.forEach((item, index) => {
    const caixas = Math.max(0, Math.floor(item.caixas));

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
      total += (item.slottingOrdem - ordemAnterior) * params.deslocamentoEntreEnderecosSeg;
      return;
    }

    total += params.deslocamentoItensSemEnderecoSeg;
  });

  return Math.max(0, Math.round(total));
}

export function calcularTempoEsperadoFromCounts(
  params: ParametrosTempo,
  qtdItens: number,
  qtdEnderecos: number,
  qtdItensSemEndereco = 0,
): number {
  return calcularTempoEsperadoSeg(
    params,
    montarItensPreviewSeparacao(qtdItens, qtdEnderecos, qtdItensSemEndereco),
  );
}
