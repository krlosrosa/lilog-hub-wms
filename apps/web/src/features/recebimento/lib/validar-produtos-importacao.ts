import { getProduto, listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';
import type { RecebimentoXlsxDemanda } from '@/features/recebimento/lib/parse-recebimento-xlsx';
import type { ItemPreRecebimentoFormValues } from '@/features/recebimento/types/recebimento-cadastro.schema';
import { ApiClientError } from '@/lib/api';

const CONCORRENCIA = 8;

export type ValidarProdutosImportacaoResult = {
  validos: Map<string, ProdutoApi>;
  naoEncontrados: string[];
};

function normalizarCodigo(codigo: string): string {
  return codigo.trim();
}

function correspondeCodigo(produto: ProdutoApi, codigo: string): boolean {
  const normalizado = normalizarCodigo(codigo).toLowerCase();

  return (
    produto.produtoId.toLowerCase() === normalizado ||
    produto.sku.toLowerCase() === normalizado
  );
}

export function extrairCodigosProdutoDemandas(
  demandas: RecebimentoXlsxDemanda[],
): string[] {
  const codigos = new Set<string>();

  for (const demanda of demandas) {
    for (const item of demanda.itens) {
      const codigo = normalizarCodigo(item.produtoId);
      if (codigo) {
        codigos.add(codigo);
      }
    }
  }

  return [...codigos];
}

async function resolverProdutoPorCodigo(
  codigo: string,
): Promise<ProdutoApi | null> {
  const normalizado = normalizarCodigo(codigo);

  if (!normalizado) {
    return null;
  }

  try {
    return await getProduto(normalizado);
  } catch (error) {
    if (!(error instanceof ApiClientError && error.status === 404)) {
      throw error;
    }
  }

  const response = await listProdutos({ search: normalizado, limit: 20 });

  return (
    response.items.find((produto) => correspondeCodigo(produto, normalizado)) ??
    null
  );
}

export async function validarProdutosImportacao(
  demandas: RecebimentoXlsxDemanda[],
): Promise<ValidarProdutosImportacaoResult> {
  const codigos = extrairCodigosProdutoDemandas(demandas);
  const validos = new Map<string, ProdutoApi>();
  const naoEncontrados: string[] = [];

  for (let index = 0; index < codigos.length; index += CONCORRENCIA) {
    const lote = codigos.slice(index, index + CONCORRENCIA);

    await Promise.all(
      lote.map(async (codigo) => {
        const produto = await resolverProdutoPorCodigo(codigo);

        if (produto) {
          validos.set(codigo, produto);
        } else {
          naoEncontrados.push(codigo);
        }
      }),
    );
  }

  naoEncontrados.sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return { validos, naoEncontrados };
}

export function aplicarProdutosValidadosNasDemandas(
  demandas: RecebimentoXlsxDemanda[],
  validos: Map<string, ProdutoApi>,
): RecebimentoXlsxDemanda[] {
  return demandas.map((demanda) => ({
    ...demanda,
    itens: demanda.itens.map((item) => {
      const codigoImportado = normalizarCodigo(item.produtoId);
      const produto = validos.get(codigoImportado);

      if (!produto) {
        return {
          ...item,
          produtoId: codigoImportado,
        };
      }

      return {
        ...item,
        produtoId: produto.produtoId,
        produtoLabel: `${produto.sku} — ${produto.descricao}`,
      };
    }),
  }));
}

export function itemProdutoSemCadastro(
  item: ItemPreRecebimentoFormValues,
  naoEncontrados: ReadonlySet<string>,
): boolean {
  if (naoEncontrados.size === 0) {
    return false;
  }

  const codigoId = normalizarCodigo(item.produtoId);
  if (naoEncontrados.has(codigoId)) {
    return true;
  }

  const labelPrefix = item.produtoLabel?.split(' — ')[0]?.trim();
  if (labelPrefix && naoEncontrados.has(normalizarCodigo(labelPrefix))) {
    return true;
  }

  return false;
}
