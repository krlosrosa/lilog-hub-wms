import type { ParametrosDevolucaoConferencia } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { DevolucaoAvariaDemandaRecord } from '../../../domain/repositories/devolucao/devolucao.repository.js';

type QuantidadeModo = ParametrosDevolucaoConferencia['quantidadeModo'];

export type QuantidadePar = { caixa: number; unidade: number };

export type DevolucaoItemConferidoRef = {
  sku: string;
  qtdConferida: number | null;
};

function sumAvariasQuantidade(
  avarias: Pick<DevolucaoAvariaDemandaRecord, 'quantidadeCaixa' | 'quantidadeUnidade'>[],
): QuantidadePar {
  return avarias.reduce(
    (acc, avaria) => ({
      caixa: acc.caixa + avaria.quantidadeCaixa,
      unidade: acc.unidade + avaria.quantidadeUnidade,
    }),
    { caixa: 0, unidade: 0 },
  );
}

export function sumConferidoForSku(
  items: DevolucaoItemConferidoRef[],
  sku: string,
  quantidadeModo: QuantidadeModo,
): QuantidadePar & { hasConferencia: boolean } {
  const normalized = sku.toLowerCase();
  let caixa = 0;
  let unidade = 0;
  let hasConferencia = false;

  for (const item of items) {
    if (item.sku.toLowerCase() !== normalized || item.qtdConferida == null) {
      continue;
    }

    const qtd = item.qtdConferida;
    caixa += quantidadeModo === 'unidade' ? 0 : qtd;
    unidade += quantidadeModo === 'caixa' ? 0 : qtd;
    hasConferencia = true;
  }

  return { caixa, unidade, hasConferencia };
}

export function sumAvariasForSku(
  avarias: DevolucaoAvariaDemandaRecord[],
  sku: string,
): QuantidadePar {
  const normalized = sku.toLowerCase();

  return sumAvariasQuantidade(
    avarias.filter((avaria) => {
      if (avaria.skusAfetados?.some((s) => s.toLowerCase() === normalized)) {
        return true;
      }

      return avaria.itemSku?.toLowerCase() === normalized;
    }),
  );
}

export function validateAvariaQuantidadeDevolucao(input: {
  skus: string[];
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  items: DevolucaoItemConferidoRef[];
  avarias: DevolucaoAvariaDemandaRecord[];
  quantidadeModo: QuantidadeModo;
}): string | null {
  if (
    input.quantidadeCaixa <= 0 &&
    input.quantidadeUnidade <= 0
  ) {
    return 'Informe caixa e/ou unidade avariada';
  }

  for (const sku of input.skus) {
    const conferido = sumConferidoForSku(
      input.items,
      sku,
      input.quantidadeModo,
    );

    if (!conferido.hasConferencia) {
      return `${sku}: produto ainda não conferido`;
    }

    const avariasRegistradas = sumAvariasForSku(input.avarias, sku);
    const prefix = input.skus.length > 1 ? `${sku}: ` : '';

    if (
      (input.quantidadeModo === 'caixa' || input.quantidadeModo === 'ambos') &&
      input.quantidadeCaixa > 0
    ) {
      const next = avariasRegistradas.caixa + input.quantidadeCaixa;
      if (next > conferido.caixa) {
        const restante = Math.max(
          0,
          conferido.caixa - avariasRegistradas.caixa,
        );
        return restante > 0
          ? `${prefix}Quantidade avariada em caixas excede o conferido (máximo ${restante} cx)`
          : `${prefix}Limite de caixas avariadas atingido (${conferido.caixa} cx conferidas)`;
      }
    }

    if (
      (input.quantidadeModo === 'unidade' || input.quantidadeModo === 'ambos') &&
      input.quantidadeUnidade > 0
    ) {
      const next = avariasRegistradas.unidade + input.quantidadeUnidade;
      if (next > conferido.unidade) {
        const restante = Math.max(
          0,
          conferido.unidade - avariasRegistradas.unidade,
        );
        return restante > 0
          ? `${prefix}Quantidade avariada em unidades excede o conferido (máximo ${restante} un)`
          : `${prefix}Limite de unidades avariadas atingido (${conferido.unidade} un conferidas)`;
      }
    }
  }

  return null;
}

export function resolveSkusValidacaoAvaria(input: {
  itemSku?: string | null;
  replicarSkus?: string[];
}): string[] {
  if (input.replicarSkus && input.replicarSkus.length > 0) {
    return [...new Set(input.replicarSkus)];
  }

  return input.itemSku ? [input.itemSku] : [];
}
