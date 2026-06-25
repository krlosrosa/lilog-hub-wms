import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { ChevronRight, Clock, Users } from 'lucide-react';

import { hapticMedium } from '@/lib/haptics';

import {
  formatDataReferencia,
  formatHorarioIntervalo,
  SESSAO_STATUS_LABELS,
  SESSAO_STATUS_TONE,
} from '../lib/sessao-labels';
import type { SessaoApi } from '../types';

export interface SessaoCardProps {
  sessao: SessaoApi;
  destacada?: boolean;
}

const STATUS_BADGE_CLASS: Record<
  'neutral' | 'success' | 'muted' | 'danger',
  string
> = {
  neutral: 'bg-surface-container text-on-surface-variant',
  success: 'bg-secondary-container text-on-secondary-container',
  muted: 'bg-surface-container-high text-on-surface-variant',
  danger: 'bg-destructive-container text-on-destructive-container',
};

export function SessaoCard({ sessao, destacada = false }: SessaoCardProps) {
  const tone = SESSAO_STATUS_TONE[sessao.status];
  const barWidth =
    sessao.status === 'encerrada'
      ? '100%'
      : sessao.status === 'aberta'
        ? '60%'
        : '20%';

  return (
    <Link
      to="/sessao-presenca/$sessaoId"
      params={{ sessaoId: sessao.id }}
      onClick={() => hapticMedium()}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-surface p-4 shadow-sm transition-colors touch-manipulation active:bg-surface-container',
        destacada
          ? 'border-secondary ring-1 ring-secondary/30'
          : 'border-outline-variant',
      )}
      aria-label={`Abrir sessão ${sessao.escalaNome}`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              STATUS_BADGE_CLASS[tone],
            )}
          >
            {SESSAO_STATUS_LABELS[sessao.status]}
          </span>
          {sessao.cruzaMeiaNoite ? (
            <span className="text-[10px] font-medium text-on-surface-variant">
              Noturno
            </span>
          ) : null}
        </div>
        <p className="truncate text-body-md font-semibold text-on-surface">
          {sessao.escalaNome}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {sessao.equipeNome}
        </p>
        <p className="mt-1 flex items-center gap-1 text-label-sm text-on-surface-variant">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {formatDataReferencia(sessao.dataReferencia)} ·{' '}
          {formatHorarioIntervalo(
            sessao.horaInicioPlanejada,
            sessao.horaFimPlanejada,
          )}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container"
            role="progressbar"
            aria-valuenow={sessao.totalFuncionarios}
            aria-valuemin={0}
            aria-valuemax={sessao.totalFuncionarios}
            aria-label="Funcionários na equipe"
          >
            <div
              className={cn(
                'h-full transition-all',
                sessao.status === 'aberta' ? 'bg-secondary' : 'bg-outline-variant',
              )}
              style={{ width: barWidth }}
            />
          </div>
          <span className="shrink-0 font-mono text-label-sm tabular-nums text-on-surface-variant">
            {sessao.totalFuncionarios} func.
          </span>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-outline" aria-hidden />
    </Link>
  );
}
