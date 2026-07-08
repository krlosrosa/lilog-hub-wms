import type {
  AvariaRegistro,
  QuantidadeModo,
} from '../types/recebimento.schema';
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

export function sumAvariasRegistradasForSku(
  avarias: AvariaRegistro[],
  sku: string,
): QuantidadePar {
  const normalized = sku.toLowerCase();

  return sumAvariasQuantidade(
    avarias.filter(
      (avaria) =>
        avaria.sku?.toLowerCase() === normalized ||
        avaria.skusAfetados?.some((s) => s.toLowerCase() === normalized),
    ),
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

    const error = validateAvariaQuantidade({
      quantidadeCaixa: input.quantidadeCaixa,
      quantidadeUnidade: input.quantidadeUnidade,
      conferido,
      avariasRegistradas: sumAvariasRegistradasForSku(input.avariasRegistradas, sku),
      quantidadeModo: input.quantidadeModo,
      skuLabel: input.skus.length > 1 ? sku : undefined,
    });

    if (error) {
      return error;
    }
  }

  return null;
}
