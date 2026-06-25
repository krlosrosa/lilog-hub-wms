import type {
  SessaoPresencaStatusApi,
  SessaoTrabalhoStatusApi,
} from '../types';

export const SESSAO_STATUS_LABELS: Record<SessaoTrabalhoStatusApi, string> = {
  planejada: 'Planejada',
  aberta: 'Aberta',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

export const PRESENCA_STATUS_LABELS: Record<SessaoPresencaStatusApi, string> = {
  esperado: 'Esperado',
  presente: 'Presente',
  falta: 'Falta',
  atestado: 'Atestado',
  folga: 'Folga',
  atraso: 'Atraso',
};

export const PRESENCA_STATUS_TONE: Record<
  SessaoPresencaStatusApi,
  'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
> = {
  esperado: 'neutral',
  presente: 'success',
  falta: 'danger',
  atestado: 'info',
  folga: 'muted',
  atraso: 'warning',
};

export const SESSAO_STATUS_TONE: Record<
  SessaoTrabalhoStatusApi,
  'neutral' | 'success' | 'muted' | 'danger'
> = {
  planejada: 'neutral',
  aberta: 'success',
  encerrada: 'muted',
  cancelada: 'danger',
};

export function formatDataReferencia(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatHorarioIntervalo(inicio: string, fim: string): string {
  return `${inicio} – ${fim}`;
}

export function todayReference(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}
