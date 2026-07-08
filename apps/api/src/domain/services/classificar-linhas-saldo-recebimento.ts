import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';
import type { ItemRecebimentoRecord } from '../repositories/recebimento/recebimento.repository.js';
import type { DivergenciaRecebimentoRecord } from '../repositories/recebimento/recebimento.repository.js';
import { toBaseUnits } from './unidade-medida.js';

export type LinhaSaldoRecebimentoClassificada = {
  produtoId: string;
  quantidade: number;
  unidadeMedida: 'UN';
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  status: 'liberado' | 'bloqueado';
  tipoAnomalia: 'sobra' | 'produto_nao_esperado' | 'avaria' | null;
};

type ClassificarLinhasSaldoRecebimentoInput = {
  itensConferidos: ItemRecebimentoRecord[];
  divergencias: DivergenciaRecebimentoRecord[];
  unidadesPorCaixaMap: Map<string, number>;
};

function groupKey(
  produtoId: string,
  lote: string | null,
  validade: Date | null,
  numeroSerie: string | null,
): string {
  return [
    produtoId,
    lote ?? '',
    validade?.toISOString() ?? '',
    numeroSerie ?? '',
  ].join('|');
}

function divergenciasPorProduto(
  divergencias: DivergenciaRecebimentoRecord[],
): Map<string, DivergenciaRecebimentoRecord[]> {
  const map = new Map<string, DivergenciaRecebimentoRecord[]>();

  for (const divergencia of divergencias) {
    if (!divergencia.produtoId) {
      continue;
    }

    const current = map.get(divergencia.produtoId) ?? [];
    current.push(divergencia);
    map.set(divergencia.produtoId, current);
  }

  return map;
}

function hasTipo(
  divergencias: DivergenciaRecebimentoRecord[],
  tipo: TipoDivergencia,
): boolean {
  return divergencias.some((d) => d.tipoDivergencia === tipo);
}

function getQuantidadeMaiorEsperada(
  divergencias: DivergenciaRecebimentoRecord[],
): number | null {
  const div = divergencias.find((d) => d.tipoDivergencia === 'quantidade_maior');
  return div?.quantidadeEsperada ?? null;
}

export function classificarLinhasSaldoRecebimento(
  input: ClassificarLinhasSaldoRecebimentoInput,
): LinhaSaldoRecebimentoClassificada[] {
  const divergenciasMap = divergenciasPorProduto(input.divergencias);
  const aggregated = new Map<
    string,
    {
      produtoId: string;
      quantidadeUN: number;
      lote: string | null;
      validade: Date | null;
      numeroSerie: string | null;
    }
  >();

  for (const item of input.itensConferidos) {
    const unidadesPorCaixa = input.unidadesPorCaixaMap.get(item.produtoId) ?? 1;
    const quantidadeUN = toBaseUnits(
      item.quantidadeRecebida,
      item.unidadeMedida,
      unidadesPorCaixa,
    );

    if (quantidadeUN <= 0) {
      continue;
    }

    const key = groupKey(
      item.produtoId,
      item.loteRecebido,
      item.validade,
      item.numeroSerie,
    );
    const existing = aggregated.get(key);

    if (!existing) {
      aggregated.set(key, {
        produtoId: item.produtoId,
        quantidadeUN,
        lote: item.loteRecebido,
        validade: item.validade,
        numeroSerie: item.numeroSerie,
      });
      continue;
    }

    existing.quantidadeUN += quantidadeUN;
  }

  const linhas: LinhaSaldoRecebimentoClassificada[] = [];

  for (const group of aggregated.values()) {
    const divs = divergenciasMap.get(group.produtoId) ?? [];

    if (hasTipo(divs, 'produto_nao_esperado')) {
      linhas.push({
        produtoId: group.produtoId,
        quantidade: group.quantidadeUN,
        unidadeMedida: 'UN',
        lote: group.lote,
        validade: group.validade,
        numeroSerie: group.numeroSerie,
        status: 'bloqueado',
        tipoAnomalia: 'produto_nao_esperado',
      });
      continue;
    }

    const quantidadeEsperada = getQuantidadeMaiorEsperada(divs);

    if (quantidadeEsperada !== null && group.quantidadeUN > quantidadeEsperada) {
      const quantidadeLiberada = quantidadeEsperada;
      const quantidadeSobra = group.quantidadeUN - quantidadeEsperada;

      if (quantidadeLiberada > 0) {
        linhas.push({
          produtoId: group.produtoId,
          quantidade: quantidadeLiberada,
          unidadeMedida: 'UN',
          lote: group.lote,
          validade: group.validade,
          numeroSerie: group.numeroSerie,
          status: 'liberado',
          tipoAnomalia: null,
        });
      }

      if (quantidadeSobra > 0) {
        linhas.push({
          produtoId: group.produtoId,
          quantidade: quantidadeSobra,
          unidadeMedida: 'UN',
          lote: group.lote,
          validade: group.validade,
          numeroSerie: group.numeroSerie,
          status: 'bloqueado',
          tipoAnomalia: 'sobra',
        });
      }

      continue;
    }

    linhas.push({
      produtoId: group.produtoId,
      quantidade: group.quantidadeUN,
      unidadeMedida: 'UN',
      lote: group.lote,
      validade: group.validade,
      numeroSerie: group.numeroSerie,
      status: 'liberado',
      tipoAnomalia: null,
    });
  }

  return linhas;
}
