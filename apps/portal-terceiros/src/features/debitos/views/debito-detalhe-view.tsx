'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock,
  DollarSign,
  Info,
  MessageSquare,
  Package,
  Truck,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { DebitoConversa } from '../components/debito-conversa';
import { DebitoEvidenciasTab } from '../components/debito-evidencias-tab';
import { DebitoItensTab } from '../components/debito-itens-tab';
import { DebitoStatusBadge } from '../components/debito-status-badge';
import { DebitoTimelineTab } from '../components/debito-timeline-tab';
import { useDebitoDetalhe } from '../hooks/use-debito-detalhe';
import {
  formatData,
  formatMoeda,
  proximoPassoDebito,
  temSolicitacaoProvaPendente,
} from '../types/debito.types';

type DebitoDetalheViewProps = {
  processoId: string;
};

type AbaDetalhe = 'itens' | 'nfs' | 'evidencias' | 'historico';

const ABAS: Array<{ id: AbaDetalhe; label: string }> = [
  { id: 'itens', label: 'Itens' },
  { id: 'nfs', label: 'Notas fiscais' },
  { id: 'evidencias', label: 'Evidências' },
  { id: 'historico', label: 'Histórico' },
];

function KpiCard({
  label,
  value,
  icon: Icon,
  accent = 'default',
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent?: 'default' | 'primary';
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card px-3 py-2">
      <Icon
        className={cn(
          'pointer-events-none absolute -right-0.5 -top-0.5 size-6 opacity-[0.07]',
          accent === 'primary' ? 'text-primary' : 'text-muted-foreground',
        )}
        aria-hidden
      />
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-sm font-semibold tabular-nums leading-tight',
          accent === 'primary' ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: typeof Truck;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border/50">
      <Icon className="size-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

export function DebitoDetalheView({ processoId }: DebitoDetalheViewProps) {
  const { processo, isLoading, error, recarregar } = useDebitoDetalhe(processoId);
  const [aba, setAba] = useState<AbaDetalhe>('itens');

  if (isLoading) {
    return (
      <div className="flex min-h-[32vh] items-center justify-center text-sm text-muted-foreground">
        Carregando processo…
      </div>
    );
  }

  if (error || !processo) {
    return (
      <div className="space-y-3">
        <Link
          href="/debitos"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Voltar para débitos
        </Link>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error ?? 'Processo não encontrado'}
        </div>
      </div>
    );
  }

  const placa = processo.transporte?.placa ?? processo.demanda.placa ?? '—';
  const acaoPendente = temSolicitacaoProvaPendente(processo.interacoes);
  const proximoPasso = proximoPassoDebito(processo.status, processo.interacoes);

  const contagemAbas: Record<AbaDetalhe, number> = {
    itens: processo.itens.length,
    nfs: processo.notasFiscais.length,
    evidencias: processo.evidencias.length,
    historico: processo.eventos.length,
  };

  return (
    <div className="space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-[11px] text-muted-foreground"
      >
        <Link
          href="/debitos"
          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Débitos
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden />
        <span className="truncate font-medium text-foreground">
          {processo.codigoDemanda}
        </span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {processo.codigoDemanda}
            </h1>
            <DebitoStatusBadge status={processo.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {processo.transportadoraNome ? (
              <MetaChip icon={Building2}>{processo.transportadoraNome}</MetaChip>
            ) : null}
            <MetaChip icon={Truck}>Placa {placa}</MetaChip>
            <MetaChip icon={Clock}>
              Atualizado {formatData(processo.updatedAt)}
            </MetaChip>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <KpiCard
          label="Valor total"
          value={formatMoeda(processo.valorTotal)}
          icon={DollarSign}
          accent="primary"
        />
        <KpiCard
          label="Itens"
          value={String(processo.quantidadeItens)}
          icon={Package}
        />
        <KpiCard
          label="Mensagens"
          value={String(processo.interacoes.length)}
          icon={MessageSquare}
        />
      </div>

      <div
        className={cn(
          'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed',
          acaoPendente
            ? 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-100'
            : 'border-border/60 bg-muted/30 text-muted-foreground',
        )}
      >
        <Info
          className={cn(
            'mt-0.5 size-3.5 shrink-0',
            acaoPendente ? 'text-amber-600 dark:text-amber-400' : 'text-primary',
          )}
          aria-hidden
        />
        <p>{proximoPasso}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_min(340px,34%)] lg:items-start">
        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <div
            className="flex gap-0 overflow-x-auto border-b border-border/60 px-1"
            role="tablist"
            aria-label="Detalhes do processo"
          >
            {ABAS.map((item) => {
              const ativa = aba === item.id;
              const count = contagemAbas[item.id];

              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  onClick={() => setAba(item.id)}
                  className={cn(
                    'relative shrink-0 px-3 py-2.5 text-xs font-medium transition-colors',
                    ativa
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    {count > 0 ? (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                          ativa
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {count}
                      </span>
                    ) : null}
                  </span>
                  {ativa ? (
                    <span
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="p-3">
            {aba === 'itens' ? <DebitoItensTab itens={processo.itens} /> : null}
            {aba === 'nfs' ? (
              <div className="space-y-1.5">
                {processo.notasFiscais.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nenhuma nota fiscal vinculada.
                  </p>
                ) : (
                  processo.notasFiscais.map((nf) => (
                    <div
                      key={nf.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">NF {nf.numeroNf}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {nf.tipo.replaceAll('_', ' ')}
                          {nf.cliente ? ` · ${nf.cliente}` : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
            {aba === 'evidencias' ? (
              <DebitoEvidenciasTab evidencias={processo.evidencias} />
            ) : null}
            {aba === 'historico' ? (
              <DebitoTimelineTab eventos={processo.eventos} />
            ) : null}
          </div>
        </section>

        <div className="lg:sticky lg:top-4">
          <DebitoConversa
            processoId={processo.id}
            status={processo.status}
            interacoes={processo.interacoes}
            onSuccess={() => void recarregar()}
          />
        </div>
      </div>
    </div>
  );
}
