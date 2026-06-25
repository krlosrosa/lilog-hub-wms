import type { SessaoPausaTipoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { PausaMonitorStatus } from '@/features/gestao-recursos/types/gestao-recursos.schema';

const PAUSA_LIMITE_MINUTOS: Record<SessaoPausaTipoApi, number | null> = {
  termica: 20,
  refeicao: 75,
  outros: null,
};

export function formatTimeFromIso(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, '0')}min`;
  }
  return `${m} min`;
}

export function getElapsedMinutes(startIso: string, now = new Date()): number {
  const start = new Date(startIso).getTime();
  return Math.max(0, Math.round((now.getTime() - start) / 60_000));
}

export function computePausaAtivaDeslocamentoMs(
  pausaInicio: string | null | undefined,
  now = new Date(),
): number {
  if (!pausaInicio) {
    return 0;
  }

  const inicioMs = new Date(pausaInicio).getTime();
  return Math.max(0, now.getTime() - inicioMs);
}

function getPrevisaoRetorno(inicioIso: string, tipo: SessaoPausaTipoApi): string {
  const limite = PAUSA_LIMITE_MINUTOS[tipo];
  if (limite == null) {
    return '—';
  }
  const previsao = new Date(new Date(inicioIso).getTime() + limite * 60_000);
  return formatTimeFromIso(previsao.toISOString());
}

function getTempoRestante(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  now = new Date(),
): string {
  const limite = PAUSA_LIMITE_MINUTOS[tipo];
  if (limite == null) {
    return '—';
  }
  const elapsed = getElapsedMinutes(inicioIso, now);
  const restante = Math.max(0, limite - elapsed);
  return formatDurationMinutes(restante);
}

export function getPausaMonitorInfo(
  inicioIso: string,
  tipo: SessaoPausaTipoApi,
  now = new Date(),
) {
  const limiteMinutos = PAUSA_LIMITE_MINUTOS[tipo];
  const elapsed = getElapsedMinutes(inicioIso, now);
  const status: PausaMonitorStatus =
    limiteMinutos == null
      ? 'em-tempo'
      : elapsed > limiteMinutos
        ? 'atrasado'
        : 'em-tempo';

  return {
    elapsed,
    limiteMinutos,
    status,
    previsaoRetorno: getPrevisaoRetorno(inicioIso, tipo),
    tempoRestante: getTempoRestante(inicioIso, tipo, now),
  };
}
