'use client';

import { cn } from '@lilog/ui';
import { Coffee, Loader2, UserCircle, UserPlus, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

function OperadorStatusBadge({ operator }: { operator: Operator }) {
  if (operator.emPausa) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
        <Coffee className="size-2.5" aria-hidden />
        Pausa
      </span>
    );
  }

  if (operator.status === 'atuando') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary-container px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
        Atuando
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-container-high px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
      Disponível
    </span>
  );
}

type AtribuirConferenteSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
  preRecebimentoId: string | null;
  onAtribuir: (preRecebimentoId: string, sessaoFuncionarioId: string) => Promise<void>;
  isLoading?: boolean;
  title?: string;
};

export function AtribuirConferenteSheet({
  isOpen,
  onClose,
  operators,
  preRecebimentoId,
  onAtribuir,
  isLoading,
  title = 'Atribuir conferente',
}: AtribuirConferenteSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const elegiveis = operators
    .filter((operator) => operator.status === 'ocioso')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-scrim/50"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface shadow-lg"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" aria-hidden />
            <h2 className="text-title-sm font-semibold text-on-surface">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container active:bg-surface-container-high"
            aria-label="Fechar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {elegiveis.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UserCircle className="size-10 text-on-surface-variant/40" aria-hidden />
              <p className="text-body-md text-on-surface-variant">
                Nenhum conferente disponível na sessão
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {elegiveis.map((operator) => (
                <li key={operator.id}>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      if (preRecebimentoId) {
                        void onAtribuir(preRecebimentoId, operator.id);
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-left transition-colors shadow-sm',
                      'hover:bg-surface-container active:bg-surface-container-high disabled:opacity-50',
                      operator.emPausa && 'opacity-70',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-semibold text-on-primary-container">
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        getInitials(operator.name)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-md font-semibold text-on-surface">
                        {operator.name}
                      </p>
                      <p className="truncate text-[11px] text-on-surface-variant">
                        {operator.sector}
                      </p>
                    </div>

                    <OperadorStatusBadge operator={operator} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </>
  );
}
