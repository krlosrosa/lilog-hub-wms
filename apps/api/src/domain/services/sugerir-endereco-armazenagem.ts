import type {
  RegraEnderecamentoCriterioTipo,
  RegraEnderecamentoDestino,
} from '../model/armazenagem/regra-enderecamento.model.js';

export type ProdutoCriterioArmazenagem = {
  produtoId: string;
  grupo: string | null;
  categoria: string;
};

export type RegraEnderecamentoParaSugestao = {
  id: string;
  criterioTipo: RegraEnderecamentoCriterioTipo;
  criterioValor: string;
  prioridade: number;
  destinos: RegraEnderecamentoDestino[];
};

export type ResolverEnderecoDisponivel = (params: {
  tipo: 'zona' | 'endereco';
  zona?: string | null;
  rua?: string | null;
  enderecoId?: string | null;
}) => Promise<string | null>;

const CRITERIO_PESO: Record<RegraEnderecamentoCriterioTipo, number> = {
  produto: 0,
  grupo: 1,
  categoria: 2,
};

function regraCombinaComProduto(
  regra: RegraEnderecamentoParaSugestao,
  produto: ProdutoCriterioArmazenagem,
): boolean {
  switch (regra.criterioTipo) {
    case 'produto':
      return regra.criterioValor === produto.produtoId;
    case 'grupo':
      return (
        produto.grupo !== null &&
        regra.criterioValor.toLowerCase() === produto.grupo.toLowerCase()
      );
    case 'categoria':
      return (
        regra.criterioValor.toLowerCase() === produto.categoria.toLowerCase()
      );
    default:
      return false;
  }
}

export function selecionarRegraEnderecamento(
  regras: RegraEnderecamentoParaSugestao[],
  produto: ProdutoCriterioArmazenagem,
): RegraEnderecamentoParaSugestao | null {
  const matching = regras
    .filter((regra) => regraCombinaComProduto(regra, produto))
    .sort((left, right) => {
      const pesoDiff =
        CRITERIO_PESO[left.criterioTipo] - CRITERIO_PESO[right.criterioTipo];

      if (pesoDiff !== 0) {
        return pesoDiff;
      }

      return left.prioridade - right.prioridade;
    });

  return matching[0] ?? null;
}

export async function sugerirEnderecoArmazenagem(
  produto: ProdutoCriterioArmazenagem,
  regras: RegraEnderecamentoParaSugestao[],
  resolverEndereco: ResolverEnderecoDisponivel,
): Promise<string | null> {
  const regra = selecionarRegraEnderecamento(regras, produto);

  if (!regra) {
    return null;
  }

  const destinos = [...regra.destinos]
    .filter((destino) => destino.ativo)
    .sort((left, right) => left.prioridade - right.prioridade);

  for (const destino of destinos) {
    const enderecoId = await resolverEndereco({
      tipo: destino.tipo,
      zona: destino.zona,
      rua: destino.rua,
      enderecoId: destino.enderecoId,
    });

    if (enderecoId) {
      return enderecoId;
    }
  }

  return null;
}
