export function formatarMinutos(minutos: number): string {
  const safe = Math.max(0, Math.round(minutos));
  const horas = Math.floor(safe / 60);
  const mins = safe % 60;

  if (horas > 0) {
    return `${horas}h ${mins.toString().padStart(2, '0')}min`;
  }

  return `${mins} min`;
}

export function formatarCountdownSaida(minutos: number): string {
  if (minutos < 0) {
    return `-${formatarMinutos(-minutos)}`;
  }

  return formatarMinutos(minutos);
}

export type StatusMetaSaida = 'ok' | 'risco_atraso' | 'atrasado';

export function classificarStatusMeta(tempoRestanteMin: number): StatusMetaSaida {
  if (tempoRestanteMin < 0) {
    return 'atrasado';
  }

  if (tempoRestanteMin < 60) {
    return 'risco_atraso';
  }

  return 'ok';
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

export function formatarIntervaloHorarioProcesso(
  horario: { inicio: string | null; fim: string | null },
  status: 'pendente' | 'em_andamento' | 'concluido',
): string {
  if (status === 'pendente') {
    return 'Aguardando';
  }

  if (horario.inicio && horario.fim) {
    return `${horario.inicio} → ${horario.fim}`;
  }

  if (horario.inicio) {
    return `${horario.inicio} → …`;
  }

  return '—';
}
