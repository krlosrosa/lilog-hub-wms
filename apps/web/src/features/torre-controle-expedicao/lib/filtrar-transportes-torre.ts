import { classificarStatusMeta } from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import type {
  FiltroRapidoTorre,
  StatusTransporteTorre,
  TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export function isTransporteAtrasado(transporte: TransporteRisco): boolean {
  return classificarStatusMeta(transporte.tempoRestanteSaidaMin) === 'atrasado';
}

export function isPrioritarioAtrasado(transporte: TransporteRisco): boolean {
  return transporte.prioridade && isTransporteAtrasado(transporte);
}

export function isTransporteDecisaoPrioritaria(
  transporte: TransporteRisco,
): boolean {
  if (!transporte.prioridade || transporte.etapaAtual === 'finalizado') {
    return false;
  }

  if (isTransporteAtrasado(transporte)) {
    return true;
  }

  if (
    transporte.tempoEstimadoFinalizarMin > transporte.tempoRestanteSaidaMin
  ) {
    return true;
  }

  return (
    transporte.etapaAtual === 'separacao' && transporte.mapasConcluidos === 0
  );
}

export function filtrarTransportesNaoFinalizados(
  transportes: TransporteRisco[],
): TransporteRisco[] {
  return transportes.filter(
    (transporte) => transporte.etapaAtual !== 'finalizado',
  );
}

export function filtrarTransportesTorre(
  transportes: TransporteRisco[],
  filtro: FiltroRapidoTorre,
): TransporteRisco[] {
  switch (filtro) {
    case 'prioritarios':
      return transportes.filter((transporte) => transporte.prioridade);
    case 'atrasados':
      return transportes.filter(isTransporteAtrasado);
    case 'criticos':
      return transportes.filter((transporte) => transporte.nivelRisco === 'critico');
    case 'prioritarios_atrasados':
      return transportes.filter(isPrioritarioAtrasado);
    default:
      return transportes;
  }
}

export function contarTransportesPorFiltro(
  transportes: TransporteRisco[],
): Record<FiltroRapidoTorre, number> {
  return {
    todos: transportes.length,
    prioritarios: transportes.filter((transporte) => transporte.prioridade).length,
    atrasados: transportes.filter(isTransporteAtrasado).length,
    criticos: transportes.filter((transporte) => transporte.nivelRisco === 'critico')
      .length,
    prioritarios_atrasados: transportes.filter(isPrioritarioAtrasado).length,
  };
}

export function listarTransportesDecisaoPrioritaria(
  transportes: TransporteRisco[],
): TransporteRisco[] {
  return transportes.filter(isTransporteDecisaoPrioritaria);
}

export function filtrarTransportesPorStatus(
  transportes: TransporteRisco[],
  status: StatusTransporteTorre | 'todos',
): TransporteRisco[] {
  if (status === 'todos') {
    return transportes;
  }

  return transportes.filter((transporte) => transporte.status === status);
}

export function contarTransportesPorStatus(
  transportes: TransporteRisco[],
): Record<StatusTransporteTorre, number> {
  const base: Record<StatusTransporteTorre, number> = {
    PENDENTE: 0,
    ALOCADO: 0,
    PARCIAL: 0,
    EM_SEPARACAO: 0,
    SEPARADO: 0,
    EM_CONFERENCIA: 0,
    CONFERIDO: 0,
    EM_CARREGAMENTO: 0,
    CARREGADO: 0,
    EM_VIAGEM: 0,
    VIAGEM_FINALIZADA: 0,
  };

  for (const t of transportes) {
    base[t.status] = (base[t.status] ?? 0) + 1;
  }

  return base;
}
