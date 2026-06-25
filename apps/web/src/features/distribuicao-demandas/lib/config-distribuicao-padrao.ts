import type {
  ConfigDistribuicao,
  Doca,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export function criarConfigDistribuicaoPadrao(docas: Doca[]): ConfigDistribuicao {
  const docasDisponiveis = docas.filter((d) => !d.ocupada);
  const selecionadas = docasDisponiveis.slice(0, 3);
  const qtdDocas = Math.max(1, Math.min(3, selecionadas.length || docas.length));

  const transportadoras = [
    ...new Set(
      docas
        .map((d) => d.transportadoraDedicada)
        .filter((t): t is string => Boolean(t)),
    ),
  ];

  return {
    qtdDocas,
    qtdFuncionarios: 8,
    usarDocasDedicadas: transportadoras.length > 0,
    docasSelecionadasIds: (selecionadas.length > 0 ? selecionadas : docas)
      .slice(0, qtdDocas)
      .map((d) => d.id),
    regrasPorTransportadora: transportadoras.map((transportadora) => {
      const doca = docas.find((d) => d.transportadoraDedicada === transportadora);
      return {
        transportadora,
        docaDedicadaId: doca?.id ?? null,
        maxSeparadores: 4,
      };
    }),
    maxSeparadoresPorWorkload: 4,
    estrategia: 'score_composto',
  };
}
