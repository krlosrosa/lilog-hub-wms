import type { RecebimentoPainelSnapshot } from '@/features/recebimento-painel/types/recebimento-painel.schema';

export function criarSnapshotVazio(unidadeId = ''): RecebimentoPainelSnapshot {
  const now = new Date();

  return {
    unidadeId,
    dataReferencia: now.toLocaleDateString('pt-BR'),
    turnoLabel: '—',
    geradoEm: now.toISOString(),
    totalPrevistoDia: 0,
    kpis: [],
    pipeline: [],
    recebimentosPorHora: [],
    rankingPorEmpresa: [],
    docas: [],
    fila: [],
    alertas: [],
    anomalias: {
      resumo: {
        totalOcorrencias: 0,
        recebimentosAfetados: 0,
        porCategoria: [
          { categoria: 'falta', label: 'Falta', count: 0 },
          { categoria: 'sobra', label: 'Sobra', count: 0 },
          { categoria: 'avaria', label: 'Avaria', count: 0 },
          {
            categoria: 'divergencia_peso',
            label: 'Divergência de peso',
            count: 0,
          },
        ],
      },
      rankingOrigens: [],
    },
    sessaoOperacional: {
      sessaoId: null,
      semSessaoAtiva: true,
      equipeNome: 'Sem sessão ativa',
      escalaNome: '—',
      status: 'planejada',
      horaInicio: '00:00',
      horaFim: '00:00',
      presenca: {
        presentes: 0,
        esperados: 0,
        faltas: 0,
        atrasos: 0,
        folgas: 0,
      },
      kpis: [],
      conferentesAtivos: 0,
      emConferencia: 0,
      atuando: 0,
      ociosos: 0,
      emPausa: 0,
      precisamPausa: 0,
      demandasPendentes: 0,
      apoiosTotal: 0,
      gestaoRecursosPath: null,
      operadores: [],
    },
    produtividadeEquipe: {
      taxaUtilizacao: 0,
      tempoMedioGlobalMin: 0,
      mediaCarrosPorOperador: 0,
      operadores: [],
    },
  };
}
