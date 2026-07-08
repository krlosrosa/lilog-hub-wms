import type { TarefaArmazenagemInput } from '../model/armazenagem/armazenagem.model.js';
import type { AlocadorSaldoClassificado } from './alocar-itens-por-classificacao-saldo.js';
import type { ItemAguardandoArmazenagem } from './build-itens-aguardando-armazenagem.js';

export type BuildTarefasFromItensBipadosResult = {
  tarefas: TarefaArmazenagemInput[];
  itensSemUnitizador: ItemAguardandoArmazenagem[];
};

function mapItemParaTarefa(
  item: ItemAguardandoArmazenagem,
  alocador?: AlocadorSaldoClassificado,
) {
  const base = {
    produtoId: item.produtoId,
    unidadeMedida: item.unidadeMedida,
    lote: item.lote,
    validade: item.validade,
    numeroSerie: item.numeroSerie,
  };

  if (!alocador) {
    return [
      {
        ...base,
        quantidade: item.quantidade,
        statusSaldo: item.statusSaldo ?? ('liberado' as const),
      },
    ];
  }

  return alocador.alocar({
    ...base,
    quantidade: item.quantidade,
  });
}

export function buildTarefasFromItensBipados(
  itens: ItemAguardandoArmazenagem[],
  alocador?: AlocadorSaldoClassificado,
): BuildTarefasFromItensBipadosResult {
  const itensSemUnitizador: ItemAguardandoArmazenagem[] = [];
  const gruposPorUnitizador = new Map<string, ItemAguardandoArmazenagem[]>();

  for (const item of itens) {
    if (!item.unitizadorId) {
      if (alocador) {
        itensSemUnitizador.push(
          ...alocador.alocar(item).map((alocado) => ({
            ...item,
            quantidade: alocado.quantidade,
            statusSaldo: alocado.statusSaldo,
          })),
        );
      } else {
        itensSemUnitizador.push(item);
      }
      continue;
    }

    const grupo = gruposPorUnitizador.get(item.unitizadorId) ?? [];
    grupo.push(item);
    gruposPorUnitizador.set(item.unitizadorId, grupo);
  }

  const tarefas: TarefaArmazenagemInput[] = [];
  let sequencia = 1;

  for (const [unitizadorId, grupoItens] of gruposPorUnitizador) {
    tarefas.push({
      unitizadorId,
      sequencia,
      itens: grupoItens.flatMap((item) => mapItemParaTarefa(item, alocador)),
    });
    sequencia += 1;
  }

  return { tarefas, itensSemUnitizador };
}
