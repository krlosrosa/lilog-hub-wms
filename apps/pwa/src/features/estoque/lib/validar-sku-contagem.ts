import { searchProduto } from '@/features/recebimento/lib/recebimento-api';
import { isApiConfigured } from '@/lib/offline/api-client';

export const SKU_INVALIDO_MSG =
  'SKU ou código de barras não encontrado. Verifique e escaneie novamente.';

export type SkuContagemValidado = {
  sku: string;
  descricao: string;
};

export async function validarSkuContagem(
  codigo: string,
): Promise<SkuContagemValidado | null> {
  const trimmed = codigo.trim();
  if (!trimmed) {
    return null;
  }

  if (!isApiConfigured()) {
    return { sku: trimmed, descricao: trimmed };
  }

  const produto = await searchProduto(trimmed);
  if (!produto) {
    return null;
  }

  return {
    sku: produto.sku,
    descricao: produto.descricao,
  };
}
