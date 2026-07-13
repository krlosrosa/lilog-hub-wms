import type { RecebimentoPainelSnapshotDto } from '../../dtos/recebimento/recebimento-painel-snapshot.dto.js';
import type {
  RecebimentoPainelAnomaliaRow,
  RecebimentoPainelCentroRow,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';

export type AnomaliaCategoriaPainel =
  | 'falta'
  | 'sobra'
  | 'avaria'
  | 'divergencia_peso';

const CATEGORIA_LABELS: Record<AnomaliaCategoriaPainel, string> = {
  falta: 'Falta',
  sobra: 'Sobra',
  avaria: 'Avaria',
  divergencia_peso: 'Divergência de peso',
};

const CATEGORIAS_ORDEM: AnomaliaCategoriaPainel[] = [
  'falta',
  'sobra',
  'avaria',
  'divergencia_peso',
];

const ORIGEM_PADRAO = '3201';

export function normalizarOrigemPreRecebimento(origem: string | null): string {
  const trimmed = origem?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : ORIGEM_PADRAO;
}

export function buildCentrosPorCodigo(
  centros: RecebimentoPainelCentroRow[],
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const row of centros) {
    const codigo = row.centro.trim();
    if (!map[codigo]) {
      map[codigo] = row.nome;
    }
  }

  return map;
}

export function resolverNomeCentro(
  centro: string,
  centrosPorCodigo: Record<string, string>,
): string {
  const codigo = centro.trim();
  return centrosPorCodigo[codigo] ?? codigo;
}

export function mapSubtipoToCategoria(
  subtipo: string | null,
): AnomaliaCategoriaPainel | null {
  switch (subtipo) {
    case 'falta':
      return 'falta';
    case 'sobra':
    case 'produto_nao_previsto':
      return 'sobra';
    case 'avaria':
      return 'avaria';
    case 'peso_divergente':
      return 'divergencia_peso';
    default:
      return null;
  }
}

export function resolverCategoriaLabel(
  categoria: AnomaliaCategoriaPainel,
): string {
  return CATEGORIA_LABELS[categoria];
}

export function montarAnomaliasRecebimentoPainel(
  anomalias: RecebimentoPainelAnomaliaRow[],
  centros: RecebimentoPainelCentroRow[] = [],
): RecebimentoPainelSnapshotDto['anomalias'] {
  const centrosPorCodigo = buildCentrosPorCodigo(centros);
  const porCategoria = new Map<AnomaliaCategoriaPainel, number>(
    CATEGORIAS_ORDEM.map((categoria) => [categoria, 0]),
  );
  const porOrigem = new Map<string, { count: number; nome: string }>();
  const recebimentosAfetados = new Set<string>();

  for (const item of anomalias) {
    const categoria = mapSubtipoToCategoria(item.subtipoOcorrencia);
    if (!categoria) {
      continue;
    }

    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + 1);
    recebimentosAfetados.add(item.recebimentoId);

    const centro = normalizarOrigemPreRecebimento(item.origem);
    const atual = porOrigem.get(centro) ?? {
      count: 0,
      nome: resolverNomeCentro(centro, centrosPorCodigo),
    };
    atual.count += 1;
    porOrigem.set(centro, atual);
  }

  const totalOcorrencias = [...porCategoria.values()].reduce(
    (sum, count) => sum + count,
    0,
  );

  const rankingOrigens = [...porOrigem.entries()]
    .map(([centro, stats]) => ({
      centro,
      nome: stats.nome,
      count: stats.count,
      percentual:
        totalOcorrencias > 0
          ? Math.round((stats.count / totalOcorrencias) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    resumo: {
      totalOcorrencias,
      recebimentosAfetados: recebimentosAfetados.size,
      porCategoria: CATEGORIAS_ORDEM.map((categoria) => ({
        categoria,
        label: resolverCategoriaLabel(categoria),
        count: porCategoria.get(categoria) ?? 0,
      })),
    },
    rankingOrigens,
  };
}
