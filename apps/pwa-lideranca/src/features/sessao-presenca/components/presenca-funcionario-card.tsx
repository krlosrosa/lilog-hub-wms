import { cn } from '@lilog/ui';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  getInitials,
  PRESENCA_STATUS_LABELS,
  PRESENCA_STATUS_TONE,
} from '../lib/sessao-labels';
import type { SessaoFuncionarioApi, SessaoPresencaStatusApi } from '../types';
import { PresencaStatusSheet } from './presenca-status-sheet';

const BADGE_TONE_CLASS = {
  neutral: 'bg-surface-container text-on-surface-variant',
  success: 'bg-secondary-container text-on-secondary-container',
  warning: 'bg-warning-container text-on-warning-container',
  danger: 'bg-destructive-container text-on-destructive-container',
  info: 'bg-primary-container text-on-primary-container',
  muted: 'bg-surface-container-high text-on-surface-variant',
} as const;

const QUICK_ACTIONS: {
  status: SessaoPresencaStatusApi;
  label: string;
  className: string;
}[] = [
  {
    status: 'presente',
    label: 'Presente',
    className: 'bg-secondary text-on-secondary',
  },
  {
    status: 'atraso',
    label: 'Atraso',
    className: 'bg-warning-container text-on-warning-container',
  },
  {
    status: 'falta',
    label: 'Falta',
    className: 'bg-destructive-container text-on-destructive-container',
  },
];

export interface PresencaFuncionarioCardProps {
  funcionario: SessaoFuncionarioApi;
  editavel: boolean;
  isUpdating: boolean;
  onAtualizar: (
    funcionarioId: number,
    status: SessaoPresencaStatusApi,
    observacao?: string | null,
  ) => void;
}

export function PresencaFuncionarioCard({
  funcionario,
  editavel,
  isUpdating,
  onAtualizar,
}: PresencaFuncionarioCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const tone = PRESENCA_STATUS_TONE[funcionario.status];

  return (
    <>
      <article
        className={cn(
          'rounded-lg border border-outline-variant bg-surface p-4 shadow-sm',
          isUpdating && 'opacity-70',
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-md font-semibold text-on-primary-container"
            aria-hidden
          >
            {getInitials(funcionario.nome)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-on-surface">
                  {funcionario.nome}
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Mat. {funcionario.matricula} · {funcionario.cargo}
                </p>
              </div>
              {isUpdating ? (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-secondary"
                  aria-label="Atualizando"
                />
              ) : (
                <span
                  className={cn(
                    'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    BADGE_TONE_CLASS[tone],
                  )}
                >
                  {PRESENCA_STATUS_LABELS[funcionario.status]}
                </span>
              )}
            </div>

            {editavel ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        hapticMedium();
                        onAtualizar(funcionario.funcionarioId, action.status);
                      }}
                      className={cn(
                        'flex h-11 items-center justify-center rounded-lg text-label-sm font-semibold transition-transform touch-manipulation active:scale-95 disabled:opacity-50',
                        funcionario.status === action.status
                          ? action.className
                          : 'border border-outline-variant bg-surface-container text-on-surface',
                      )}
                      aria-pressed={funcionario.status === action.status}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    hapticLight();
                    setSheetOpen(true);
                  }}
                  className="w-full py-1 text-center text-label-sm font-medium text-secondary touch-manipulation"
                >
                  Mais opções
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <PresencaStatusSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        funcionario={funcionario}
        onConfirm={(status, observacao) => {
          onAtualizar(funcionario.funcionarioId, status, observacao);
          setSheetOpen(false);
        }}
      />
    </>
  );
}
