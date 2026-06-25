export function formatarRelogio(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatarMetaLargada(date: Date | null | undefined): string {
  if (!date) {
    return '—';
  }

  const data = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${data} ${hora}`;
}

export const metaLargadaClassName =
  'whitespace-nowrap text-[11px] font-semibold tabular-nums leading-none text-foreground';

export function formatarMinutos(minutos: number): string {
  const safe = Math.max(0, Math.round(minutos));
  const horas = Math.floor(safe / 60);
  const mins = safe % 60;

  if (horas > 0) {
    return `${horas}h ${mins.toString().padStart(2, '0')}min`;
  }

  return `${mins} min`;
}

export function formatarDuracaoSegundos(totalSegundos: number): string {
  const safe = Math.max(0, Math.round(totalSegundos));
  const horas = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const segs = safe % 60;

  if (horas > 0) {
    return `${horas}h ${mins.toString().padStart(2, '0')}min ${segs.toString().padStart(2, '0')}s`;
  }

  if (mins > 0) {
    return `${mins} min ${segs.toString().padStart(2, '0')}s`;
  }

  return `${segs}s`;
}

/** Formato curto em linha única para células de tabela (ex.: 20m 17s). */
export function formatarDuracaoSegundosInline(totalSegundos: number): string {
  const safe = Math.max(0, Math.round(totalSegundos));
  const horas = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const segs = safe % 60;

  if (horas > 0) {
    return `${horas}h ${mins.toString().padStart(2, '0')}m ${segs.toString().padStart(2, '0')}s`;
  }

  if (mins > 0) {
    return `${mins}m ${segs.toString().padStart(2, '0')}s`;
  }

  return `${segs}s`;
}

export function formatarCountdownSaida(minutos: number): string {
  if (minutos < 0) {
    return formatarDuracaoSegundos(Math.abs(minutos) * 60);
  }

  return formatarDuracaoSegundos(minutos * 60);
}

export function resolverTempoRestanteExpedicaoSeg(
  minutos: number,
  segundos?: number,
): number {
  if (segundos != null) {
    return segundos;
  }

  return minutos * 60;
}

export function obterSegundosAtrasoExpedicao(
  minutos: number,
  segundos?: number,
): number {
  const totalSeg = resolverTempoRestanteExpedicaoSeg(minutos, segundos);
  return totalSeg < 0 ? Math.abs(totalSeg) : 0;
}

export type UrgenciaCountdown = 'ok' | 'atencao' | 'critico';

export function classificarUrgenciaSaida(minutos: number): UrgenciaCountdown {
  if (minutos < 0) {
    return 'critico';
  }

  if (minutos <= 15) {
    return 'critico';
  }

  if (minutos <= 45) {
    return 'atencao';
  }

  return 'ok';
}

export const URGENCIA_SAIDA_CLASSES: Record<UrgenciaCountdown, string> = {
  ok: 'text-accent font-semibold',
  atencao: 'text-tertiary font-semibold',
  critico: 'text-destructive font-bold animate-pulse',
};

export type StatusMetaSaida = 'ok' | 'risco_atraso' | 'atrasado';

export const STATUS_META_LABELS: Record<StatusMetaSaida, string> = {
  ok: '',
  risco_atraso: 'Risco de atraso',
  atrasado: 'Atrasado',
};

export const STATUS_META_CLASSES: Record<StatusMetaSaida, string> = {
  ok: '',
  risco_atraso: 'text-warning',
  atrasado: 'text-destructive',
};

/** Meta ultrapassada ou com menos de 1h até o horário previsto. */
export function classificarStatusMeta(tempoRestanteMin: number): StatusMetaSaida {
  if (tempoRestanteMin < 0) {
    return 'atrasado';
  }

  if (tempoRestanteMin < 60) {
    return 'risco_atraso';
  }

  return 'ok';
}

export function segundosDesde(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 1000);
}

export function formatarAtualizadoHa(segundos: number): string {
  if (segundos < 5) {
    return 'agora';
  }

  if (segundos < 60) {
    return `há ${segundos}s`;
  }

  const minutos = Math.floor(segundos / 60);
  return `há ${minutos} min`;
}

export function formatarLinhaHorarioProcesso(
  valor: string | null,
  label: 'Início' | 'Fim',
): string {
  return `${label}: ${valor ?? '—'}`;
}
