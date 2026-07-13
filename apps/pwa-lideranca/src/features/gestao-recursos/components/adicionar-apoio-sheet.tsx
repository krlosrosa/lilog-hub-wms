'use client';

import { cn } from '@lilog/ui';
import { Loader2, UserCircle, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { hapticLight } from '@/lib/haptics';

import type { FuncionarioApoioCandidatoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export type SessaoOrigemApoioOption = {
  id: string;
  label: string;
};

type AdicionarApoioSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  candidatos: FuncionarioApoioCandidatoApi[];
  sessoesOrigem: SessaoOrigemApoioOption[];
  onAdicionar: (funcionarioId: number) => Promise<void>;
  isLoading?: boolean;
  isLoadingCandidatos?: boolean;
  errorMessage?: string | null;
};

export function AdicionarApoioSheet({
  isOpen,
  onClose,
  candidatos,
  sessoesOrigem,
  onAdicionar,
  isLoading,
  isLoadingCandidatos,
  errorMessage,
}: AdicionarApoioSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [sessaoOrigemFilter, setSessaoOrigemFilter] = useState<'all' | string>(
    'all',
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSessaoOrigemFilter('all');
    }
  }, [isOpen]);

  const countsBySessao = useMemo(() => {
    const counts: Record<string, number> = { all: candidatos.length };

    for (const sessao of sessoesOrigem) {
      counts[sessao.id] = candidatos.filter(
        (candidato) => candidato.sessaoOrigemId === sessao.id,
      ).length;
    }

    return counts;
  }, [candidatos, sessoesOrigem]);

  const candidatosFiltrados = useMemo(() => {
    if (sessaoOrigemFilter === 'all') {
      return candidatos;
    }

    return candidatos.filter(
      (candidato) => candidato.sessaoOrigemId === sessaoOrigemFilter,
    );
  }, [candidatos, sessaoOrigemFilter]);

  const filterOptions = useMemo(
    () => [{ id: 'all' as const, label: 'Todas' }, ...sessoesOrigem],
    [sessoesOrigem],
  );

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
        aria-label="Adicionar apoio"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface shadow-lg"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" aria-hidden />
            <h2 className="text-title-sm font-semibold text-on-surface">
              Adicionar apoio
            </h2>
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
          {errorMessage ? (
            <div className="mb-3 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2 text-label-sm text-error">
              {errorMessage}
            </div>
          ) : null}

          {sessoesOrigem.length > 0 ? (
            <div className="mb-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                Buscar ajuda em
              </p>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {filterOptions.map((option) => {
                  const isActive = sessaoOrigemFilter === option.id;
                  const count = countsBySessao[option.id] ?? 0;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setSessaoOrigemFilter(option.id);
                      }}
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm font-semibold transition-colors touch-manipulation',
                        isActive
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container text-on-surface-variant',
                      )}
                    >
                      <span>{option.label}</span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                          isActive
                            ? 'bg-on-secondary/20 text-on-secondary'
                            : 'bg-outline-variant/30 text-on-surface-variant',
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isLoadingCandidatos ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Loader2
                className="size-8 animate-spin text-on-surface-variant/60"
                aria-hidden
              />
              <p className="text-body-md text-on-surface-variant">
                Carregando candidatos...
              </p>
            </div>
          ) : candidatosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <UserCircle
                className="size-10 text-on-surface-variant/40"
                aria-hidden
              />
              <p className="text-body-md text-on-surface-variant">
                {sessaoOrigemFilter === 'all'
                  ? 'Nenhum funcionário disponível em outras sessões'
                  : 'Nenhum funcionário disponível nesta sessão'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {candidatosFiltrados.map((candidato) => (
                <li key={`${candidato.funcionarioId}-${candidato.sessaoOrigemId}`}>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      void onAdicionar(candidato.funcionarioId);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-left transition-colors shadow-sm',
                      'hover:bg-surface-container active:bg-surface-container-high disabled:opacity-50',
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-semibold text-on-primary-container">
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        getInitials(candidato.nome)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-md font-semibold text-on-surface">
                        {candidato.nome}
                      </p>
                      <p className="truncate text-[11px] text-on-surface-variant">
                        {candidato.equipeOrigemNome}
                        {candidato.equipeOrigemArea
                          ? ` · ${candidato.equipeOrigemArea}`
                          : ''}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold uppercase text-on-secondary-container">
                      Apoio
                    </span>
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
