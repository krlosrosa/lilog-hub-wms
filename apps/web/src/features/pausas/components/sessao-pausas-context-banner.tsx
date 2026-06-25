'use client';

import Link from 'next/link';

import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@lilog/ui';

import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';

type SessaoPausasContextBannerProps = {
  semUnidade?: boolean;
  semSessaoAberta?: boolean;
  isLoading?: boolean;
  sessaoAtiva?: SessaoApi | null;
  sessoesAbertas?: SessaoApi[];
  onSelectSessao?: (sessaoId: string) => void;
  semUnidadeMessage?: string;
  emptySessaoTitle?: string;
  emptySessaoDescription?: string;
  showDataReferenciaInSelector?: boolean;
};

export function SessaoPausasContextBanner({
  semUnidade,
  semSessaoAberta,
  isLoading,
  sessaoAtiva,
  sessoesAbertas = [],
  onSelectSessao,
  semUnidadeMessage = 'Selecione uma unidade no menu superior para gerenciar pausas.',
  emptySessaoTitle = 'Nenhuma sessão aberta',
  emptySessaoDescription = 'Abra uma sessão em Sessão Operação para registrar pausas.',
  showDataReferenciaInSelector = false,
}: SessaoPausasContextBannerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-muted/50 px-4 py-3 text-body-md text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Carregando sessão operacional...
      </div>
    );
  }

  if (semUnidade) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-outline-variant bg-muted/50 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-body-md text-muted-foreground">
          {semUnidadeMessage}
        </p>
      </div>
    );
  }

  if (semSessaoAberta) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-body-md font-medium text-foreground">
              {emptySessaoTitle}
            </p>
            <p className="text-caption text-muted-foreground">
              {emptySessaoDescription}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/sessao-operacao/sessoes">Ir para Sessões</Link>
        </Button>
      </div>
    );
  }

  if (!sessaoAtiva) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-label-md font-medium text-foreground">
          Sessão ativa: {sessaoAtiva.equipeNome} — {sessaoAtiva.escalaNome}
        </p>
        <p className="text-caption text-muted-foreground">
          Data de referência: {sessaoAtiva.dataReferencia}
        </p>
      </div>
      {sessoesAbertas.length > 1 && onSelectSessao && (
        <select
          value={sessaoAtiva.id}
          onChange={(e) => onSelectSessao(e.target.value)}
          className="rounded-lg border border-outline-variant bg-background px-3 py-2 text-label-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Selecionar sessão aberta"
        >
          {sessoesAbertas.map((s) => (
            <option key={s.id} value={s.id}>
              {showDataReferenciaInSelector
                ? `${s.equipeNome} — ${s.escalaNome} (${s.dataReferencia})`
                : `${s.equipeNome} — ${s.escalaNome}`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
