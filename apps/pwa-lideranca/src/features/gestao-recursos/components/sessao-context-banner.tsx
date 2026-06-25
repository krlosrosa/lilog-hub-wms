'use client';

import { cn } from '@lilog/ui';
import { AlertCircle, Building2, CalendarDays } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import type { SessaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

type SessaoContextBannerProps = {
  semUnidade: boolean;
  semSessaoAberta: boolean;
  isLoading: boolean;
  unidadeNome: string | null;
  sessaoAtiva: SessaoApi | null;
  sessoesAbertas: SessaoApi[];
  onSelectSessao: (sessaoId: string) => void;
};

function formatSessaoLabel(sessao: SessaoApi): string {
  const data = new Date(sessao.dataReferencia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  return `${sessao.equipeNome} · ${data}`;
}

export function SessaoContextBanner({
  semUnidade,
  semSessaoAberta,
  isLoading,
  unidadeNome,
  sessaoAtiva,
  sessoesAbertas,
  onSelectSessao,
}: SessaoContextBannerProps) {
  if (semUnidade) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-3">
        <Building2 className="mt-0.5 size-4 shrink-0 text-on-surface-variant" aria-hidden />
        <div>
          <p className="text-label-sm font-medium text-on-surface">
            Selecione uma unidade
          </p>
          <p className="text-[11px] text-on-surface-variant">
            Use o seletor no topo da tela para carregar os recursos da operação.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-outline-variant bg-surface-container px-3 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-outline-variant/40" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-outline-variant/30" />
      </div>
    );
  }

  if (semSessaoAberta) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning-container/20 px-3 py-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-on-warning-container" aria-hidden />
        <div>
          <p className="text-label-sm font-medium text-on-surface">
            Nenhuma sessão aberta
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {unidadeNome
              ? `Não há sessão ativa em ${unidadeNome}. Abra uma sessão no sistema web.`
              : 'Abra uma sessão em Sessão Operação para monitorar a equipe.'}
          </p>
        </div>
      </div>
    );
  }

  if (!sessaoAtiva) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2 rounded-lg border border-outline-variant/60 bg-surface-container/50 px-3 py-2.5">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-label-sm font-medium text-on-surface">
            {formatSessaoLabel(sessaoAtiva)}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            {sessaoAtiva.escalaNome} · {sessaoAtiva.horaInicioPlanejada}–
            {sessaoAtiva.horaFimPlanejada}
          </p>
        </div>
      </div>

      {sessoesAbertas.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sessoesAbertas.map((sessao) => {
            const active = sessao.id === sessaoAtiva.id;
            return (
              <button
                key={sessao.id}
                type="button"
                onClick={() => {
                  hapticLight();
                  onSelectSessao(sessao.id);
                }}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-[11px] font-medium touch-manipulation active:scale-95',
                  active
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant',
                )}
              >
                {sessao.equipeNome}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
