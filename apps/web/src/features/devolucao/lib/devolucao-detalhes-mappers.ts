import type { BuscarDemandaDevolucaoResponse } from '@/features/devolucao/types/devolucao-buscar.schema';
import type {
  ConferenceItem,
  ConferenceItemStatus,
  DemandaDetalhe,
  TimelineStep,
} from '@/features/devolucao/types/devolucao-detalhes.schema';
import type { DemandaDevolucaoStatus } from '@/features/devolucao/types/devolucao-gestao.schema';
import { DEMANDA_DEVOLUCAO_STATUS_LABELS } from '@/features/devolucao/types/devolucao-gestao.schema';

const TEMPERATURA_ALVO_PADRAO = -18;

export function mapDbStatusToUiStatus(
  status: DemandaDevolucaoStatus,
): DemandaDetalhe['status'] {
  switch (status) {
    case 'rascunho':
    case 'aberta':
      return 'aguardando';
    case 'em_analise':
      return 'aguardando-conferencia';
    case 'em_execucao':
      return 'em-conferencia';
    case 'conferida':
      return 'conferido';
    case 'concluida':
      return 'finalizado';
    case 'cancelada':
      return 'cancelada';
  }
}

function mapCondicaoToConferenceStatus(
  condicao: BuscarDemandaDevolucaoResponse['notasFiscais'][number]['itens'][number]['condicao'],
  previsto: number,
  confirmado: number,
): ConferenceItemStatus {
  if (
    condicao === 'avariado' ||
    condicao === 'vencido' ||
    condicao === 'violado'
  ) {
    return 'divergente';
  }

  if (confirmado === 0) return 'pendente';
  if (confirmado >= previsto && condicao === 'integro') return 'concluido';
  if (confirmado > 0 && confirmado < previsto) return 'iniciando';
  if (confirmado >= previsto) return 'concluido';

  return 'pendente';
}

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

function computeDuracao(inicioIso: string, fimIso?: string | null): string {
  const inicio = new Date(inicioIso).getTime();
  const fim = fimIso ? new Date(fimIso).getTime() : Date.now();
  const diffMs = Math.max(0, fim - inicio);
  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

export function mapItensToConferenceItems(
  response: BuscarDemandaDevolucaoResponse,
): ConferenceItem[] {
  return response.notasFiscais.flatMap((nf) =>
    nf.itens.map((item) => {
      const previsto = Math.round(item.quantidadeNormalizadaUnidades);
      const confirmado = Math.round(item.qtdConferida ?? 0);
      const status = mapCondicaoToConferenceStatus(
        item.condicao,
        previsto,
        confirmado,
      );

      return {
        id: item.id,
        sku: item.sku,
        produto: item.descricaoProduto ?? item.sku,
        previsto,
        confirmado,
        status,
        condicao: item.condicao,
        pesoVariavel: item.pesoVariavel,
        diferencaPesoKg: null,
        quantidadeFiscalOriginal: null,
        faltaPesoId: null,
      };
    }),
  );
}

export function mapEventosToTimeline(
  response: BuscarDemandaDevolucaoResponse,
): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      id: 'tl-created',
      titulo: 'Demanda criada',
      descricao: `${formatDateTime(response.createdAt)} — ${response.codigoDemanda}`,
      status: 'completed',
    },
  ];

  response.eventos.forEach((evento, index) => {
    const statusAnteriorLabel = evento.statusAnterior
      ? DEMANDA_DEVOLUCAO_STATUS_LABELS[evento.statusAnterior]
      : '—';
    const statusNovoLabel = DEMANDA_DEVOLUCAO_STATUS_LABELS[evento.statusNovo];
    const isLast = index === response.eventos.length - 1;
    const isActive =
      isLast &&
      response.status !== 'concluida' &&
      response.status !== 'cancelada';

    steps.push({
      id: evento.id,
      titulo: `${statusAnteriorLabel} → ${statusNovoLabel}`,
      descricao:
        evento.descricao ??
        `${formatDateTime(evento.createdAt)} — atualização de status`,
      status: isActive ? 'active' : 'completed',
    });
  });

  if (response.status === 'concluida' && response.concluidaAt) {
    steps.push({
      id: 'tl-concluida',
      titulo: 'Demanda concluída',
      descricao: formatDateTime(response.concluidaAt),
      status: 'completed',
    });
  } else if (response.status !== 'cancelada') {
    steps.push({
      id: 'tl-future',
      titulo: 'Liberação e encerramento',
      descricao: 'Aguardando conclusão da operação',
      status: 'future',
    });
  }

  return steps;
}

export function mapApiToDemandaDetalhe(
  response: BuscarDemandaDevolucaoResponse,
): DemandaDetalhe {
  const conferenceItems = mapItensToConferenceItems(response);
  const totalItensEsperado = conferenceItems.reduce(
    (acc, item) => acc + item.previsto,
    0,
  );
  const totalItens = conferenceItems.reduce(
    (acc, item) => acc + item.confirmado,
    0,
  );

  const tempBau = response.checklist?.tempBau ?? null;
  const tempProduto = response.checklist?.tempProduto ?? null;
  const hasTemperatura = tempBau !== null || tempProduto !== null;

  return {
    id: response.id,
    codigoDemanda: response.codigoDemanda,
    placa: response.placa ?? '—',
    motorista: '—',
    viagemId: response.transporteId ? `#${response.transporteId}` : '—',
    status: mapDbStatusToUiStatus(response.status),
    statusDb: response.status,
    observacao: response.observacao,
    totalNfs: response.totalNfs,
    pesoDevolvido: response.pesoDevolvido,
    cliente: response.cliente,
    transporteId: response.transporteId,
    totalItens,
    totalItensEsperado: Math.max(totalItensEsperado, 1),
    temperaturaBau: tempBau,
    temperaturaBauAlvo: hasTemperatura ? TEMPERATURA_ALVO_PADRAO : null,
    temperaturaProduto: tempProduto,
    temperaturaProdutoAlvo: hasTemperatura ? TEMPERATURA_ALVO_PADRAO : null,
    inicioOperacao: formatTime(response.createdAt),
    duracao: computeDuracao(response.createdAt, response.concluidaAt),
    estimativaTermino: response.concluidaAt
      ? formatTime(response.concluidaAt)
      : '—',
    eficiencia: null,
  };
}
