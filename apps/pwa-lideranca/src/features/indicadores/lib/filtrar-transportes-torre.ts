import { classificarStatusMeta } from '@/features/indicadores/lib/formatar-tempo';
import type {
  FiltroRapidoTorre,
  TransporteRisco,
} from '@/features/indicadores/lib/torre-controle.schema';

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
