import type {
  AvariaRegistro,
  QuantidadeModo,
} from '../types/recebimento.schema';
import { getConferenciaContextStore } from './conferencia-context-store';
import { resolveConferidoTotaisForSkuRecebimento } from './resolve-conferido-totais';
import type { RecebimentoConferenciaRascunhoEntry } from './recebimento-conferencia-rascunho';

export type QuantidadePar = { caixa: number; unidade: number };

export function sumAvariasQuantidade(
  avarias: Pick<AvariaRegistro, 'quantidadeCaixa' | 'quantidadeUnidade'>[],
): QuantidadePar {
  return avarias.reduce(
    (acc, avaria) => ({
      caixa: acc.caixa + avaria.quantidadeCaixa,
      unidade: acc.unidade + avaria.quantidadeUnidade,
    }),
    { caixa: 0, unidade: 0 },
  );
}

function avariaMatchesSku(
  avaria: AvariaRegistro,
  sku: string,
  produtoId?: string | null,
): boolean {
  const normalized = sku.trim().toLowerCase();

  if (avaria.skusAfetados && avaria.skusAfetados.length > 0) {
    if (!normalized) {
      return Boolean(produtoId && avaria.produtoId === produtoId);
    }

    return avaria.skusAfetados.some((s) => s.toLowerCase() === normalized);
  }

  if (avaria.sku?.trim()) {
    return normalized ? avaria.sku.toLowerCase() === normalized : false;
  }

  return Boolean(produtoId && avaria.produtoId === produtoId);
}

export function filterAvariasForSku(
  avarias: AvariaRegistro[],
  sku: string,
  produtoId?: string | null,
): AvariaRegistro[] {
  if (!sku.trim() && !produtoId) {
    return avarias;
  }

  return avarias.filter((avaria) => avariaMatchesSku(avaria, sku, produtoId));
}

export function sumAvariasRegistradasForSku(
  avarias: AvariaRegistro[],
  sku: string,
  produtoId?: string | null,
): QuantidadePar {
  return sumAvariasQuantidade(
    filterAvariasForSku(avarias, sku, produtoId),
  );
}

export type AvariaQuantidadeValidationError = {
  field: 'quantidadeCaixa' | 'quantidadeUnidade';
  message: string;
};

export function validateAvariaQuantidade(input: {
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  conferido: QuantidadePar;
  avariasRegistradas: QuantidadePar;
  quantidadeModo: QuantidadeModo;
  skuLabel?: string;
}): AvariaQuantidadeValidationError | null {
  const prefix = input.skuLabel ? `${input.skuLabel}: ` : '';

  if (
    (input.quantidadeModo === 'caixa' || input.quantidadeModo === 'ambos') &&
    input.quantidadeCaixa > 0
  ) {
    const next = input.avariasRegistradas.caixa + input.quantidadeCaixa;
    if (next > input.conferido.caixa) {
      const restante = Math.max(0, input.conferido.caixa - input.avariasRegistradas.caixa);
      return {
        field: 'quantidadeCaixa',
        message:
          restante > 0
            ? `${prefix}Máximo ${restante} cx (conferido: ${input.conferido.caixa} cx, já avariado: ${input.avariasRegistradas.caixa} cx)`
            : `${prefix}Limite de caixas avariadas atingido (${input.conferido.caixa} cx conferidas)`,
      };
    }
  }

  if (
    (input.quantidadeModo === 'unidade' || input.quantidadeModo === 'ambos') &&
    input.quantidadeUnidade > 0
  ) {
    const next = input.avariasRegistradas.unidade + input.quantidadeUnidade;
    if (next > input.conferido.unidade) {
      const restante = Math.max(
        0,
        input.conferido.unidade - input.avariasRegistradas.unidade,
      );
      return {
        field: 'quantidadeUnidade',
        message:
          restante > 0
            ? `${prefix}Máximo ${restante} un (conferido: ${input.conferido.unidade} un, já avariado: ${input.avariasRegistradas.unidade} un)`
            : `${prefix}Limite de unidades avariadas atingido (${input.conferido.unidade} un conferidas)`,
      };
    }
  }

  return null;
}

export function validateAvariaQuantidadeForSkus(input: {
  demandId: string;
  skus: string[];
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  quantidadeModo: QuantidadeModo;
  avariasRegistradas: AvariaRegistro[];
  rascunhos: RecebimentoConferenciaRascunhoEntry[];
}): AvariaQuantidadeValidationError | null {
  for (const sku of input.skus) {
    const normalized = sku.trim().toLowerCase();
    const rascunho = input.rascunhos.find(
      (entry) => entry.sku.trim().toLowerCase() === normalized,
    );

    const conferido = resolveConferidoTotaisForSkuRecebimento({
      demandId: input.demandId,
      sku,
      quantidadeModo: input.quantidadeModo,
      rascunhoLotes: rascunho?.lotes,
    });

    if (!conferido.hasConferencia) {
      return {
        field: 'quantidadeCaixa',
        message: `${sku}: produto ainda não conferido`,
      };
    }

    const produtoId =
      getConferenciaContextStore(input.demandId)?.itemMetaBySku[normalized]
        ?.produtoId ?? null;

    const error = validateAvariaQuantidade({
      quantidadeCaixa: input.quantidadeCaixa,
      quantidadeUnidade: input.quantidadeUnidade,
      conferido,
      avariasRegistradas: sumAvariasRegistradasForSku(
        input.avariasRegistradas,
        sku,
        produtoId,
      ),
      quantidadeModo: input.quantidadeModo,
      skuLabel: input.skus.length > 1 ? sku : undefined,
    });

    if (error) {
      return error;
    }
  }

  return null;
}
