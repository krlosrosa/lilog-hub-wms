import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GitCompareArrows,
  ListChecks,
  Loader2,
  Timer,
  Verified,
} from 'lucide-react';

import { useTerminoProcesso } from '../hooks/use-termino-processo';
import type { TerminoAvariaItem, TerminoDivergenciaItem } from '../hooks/use-termino-processo';

interface TerminoProcessoViewProps {
  demandId: string;
}

function TerminoBottomDock({
  dock,
  isFinalizing,
  onRequestFinalize,
}: {
  dock: string;
  isFinalizing: boolean;
  onRequestFinalize: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <div className="pointer-events-auto w-full border-t border-outline-variant bg-surface-container-highest/95 shadow-[0_-4px_16px_rgba(11,28,48,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-surface-container-highest/90">
        <p className="px-4 pb-3 pt-3 text-center text-label-sm text-on-surface-variant">
          Doca <span className="font-semibold text-on-surface">{dock}</span> · confirme para liberar
        </p>
        <Button
          type="button"
          onClick={onRequestFinalize}
          disabled={isFinalizing}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-none border-t border-outline-variant bg-secondary text-on-secondary text-label-md font-semibold touch-manipulation active:scale-[0.99] hover:bg-secondary/90"
        >
          {isFinalizing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Liberando doca...
            </>
          ) : (
            <>
              <ListChecks className="h-5 w-5" aria-hidden />
              Finalizar e liberar doca
            </>
          )}
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ConfirmarLiberacaoModal({
  open,
  dock,
  isFinalizing,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  dock: string;
  isFinalizing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-4 pb-safe sm:items-center',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-liberacao-title"
        className={cn(
          'w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-4'
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <ListChecks className="h-6 w-6" aria-hidden />
        </div>
        <h2
          id="confirmar-liberacao-title"
          className="mb-2 text-headline-md font-semibold text-on-surface"
        >
          Confirmar conclusão?
        </h2>
        <p className="mb-5 text-body-sm text-on-surface-variant">
          A doca <span className="font-semibold text-on-surface">{dock}</span> será liberada e o
          recebimento encerrado. Esta ação não pode ser desfeita.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isFinalizing}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary touch-manipulation hover:bg-secondary/90 active:scale-[0.98]"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Liberando...
              </>
            ) : (
              'Confirmar e liberar doca'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isFinalizing}
            className="flex h-12 flex-1 items-center justify-center rounded-lg touch-manipulation active:scale-[0.98]"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-secondary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-label-sm text-on-surface-variant">{label}</span>
        <p className="font-mono text-headline-md font-bold text-on-surface">{value}</p>
      </div>
    </article>
  );
}

function AvariaRow({ item }: { item: TerminoAvariaItem }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="flex items-start justify-between gap-2 border-l-4 border-destructive pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-label-md font-bold text-primary">{item.sku}</span>
            <span className="inline-flex shrink-0 items-center rounded-full bg-destructive/10 px-2 py-0.5 text-label-sm font-bold text-destructive">
              {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{item.name}</p>
          <p className="mt-1.5 flex items-center gap-1 text-label-sm font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {item.motivo}
          </p>
        </div>
      </div>
    </article>
  );
}

function DivergenciaRow({ item }: { item: TerminoDivergenciaItem }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="border-l-4 border-secondary pl-3">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-label-md font-bold text-primary">{item.sku}</span>
          <span className="inline-flex shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 text-center text-label-sm font-bold text-secondary">
            {item.label}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">{item.name}</p>
      </div>
    </article>
  );
}

function AccordionSection({
  title,
  count,
  icon: Icon,
  variant,
  isOpen,
  onToggle,
  children,
  isEmpty,
  emptyMessage,
}: {
  title: string;
  count: number;
  icon: typeof AlertCircle;
  variant: 'destructive' | 'secondary';
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  isEmpty: boolean;
  emptyMessage: string;
}) {
  const isDestructive = variant === 'destructive';

  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between gap-2 border-b border-outline-variant px-4 py-3 transition-colors touch-manipulation active:scale-[0.99]',
          isDestructive ? 'bg-destructive/10' : 'bg-secondary/5'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={cn('h-5 w-5 shrink-0', isDestructive ? 'text-destructive' : 'text-secondary')}
            aria-hidden
          />
          <span
            className={cn(
              'truncate text-label-md font-semibold uppercase tracking-wide',
              isDestructive ? 'text-destructive' : 'text-secondary'
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
              isDestructive
                ? 'bg-destructive/15 text-destructive'
                : 'bg-secondary/15 text-secondary'
            )}
          >
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp
            className={cn('h-5 w-5 shrink-0', isDestructive ? 'text-destructive' : 'text-secondary')}
            aria-hidden
          />
        ) : (
          <ChevronDown
            className={cn('h-5 w-5 shrink-0', isDestructive ? 'text-destructive' : 'text-secondary')}
            aria-hidden
          />
        )}
      </button>
      {isOpen && (
        <div className="space-y-2 p-4">
          {isEmpty ? (
            <p className="py-4 text-center text-body-sm text-on-surface-variant">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}

export function TerminoProcessoView({ demandId }: TerminoProcessoViewProps) {
  const { state, actions } = useTerminoProcesso(demandId);
  const {
    demand,
    dock,
    avarias,
    naoConferidos,
    divergencias,
    tempoTotal,
    acuracia,
    isAccordionAvariaOpen,
    isAccordionNaoConferidoOpen,
    isAccordionDivergenciaOpen,
    isFinalizing,
    confirmModalOpen,
  } = state;

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-2 px-margin-mobile">
          <Link
            to="/recebimento"
            aria-label="Voltar para recebimentos"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Resumo da conferência
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {demand ? `${demand.supplier} · ${demand.dock}` : demandId}
            </p>
          </div>
        </div>
      </div>

      <div className="px-margin-mobile pb-[calc(140px+env(safe-area-inset-bottom,0px))] pt-4">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-lg">
            <CheckCircle2 className="h-12 w-12 fill-current" aria-hidden />
          </div>
          <h2 className="mb-1 text-headline-lg font-semibold text-on-surface">
            Conferência encerrada
          </h2>
          <p className="max-w-sm text-body-sm text-on-surface-variant">
            Revise avarias e divergências abaixo. Confirme a liberação da doca para concluir o
            recebimento.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2">
          <MetricCard icon={Timer} label="Tempo total" value={tempoTotal} />
          <MetricCard icon={Verified} label="Acurácia" value={acuracia} />
        </div>

        <div className="space-y-3">
          <AccordionSection
            title="Avarias registradas"
            count={avarias.length}
            icon={AlertCircle}
            variant="destructive"
            isOpen={isAccordionAvariaOpen}
            onToggle={actions.toggleAvariaAccordion}
            isEmpty={avarias.length === 0}
            emptyMessage="Nenhuma avaria registrada neste recebimento."
          >
            {avarias.map((item) => (
              <AvariaRow key={item.sku} item={item} />
            ))}
          </AccordionSection>

          <AccordionSection
            title="Itens não conferidos"
            count={naoConferidos.length}
            icon={Clock}
            variant="secondary"
            isOpen={isAccordionNaoConferidoOpen}
            onToggle={actions.toggleNaoConferidoAccordion}
            isEmpty={naoConferidos.length === 0}
            emptyMessage="Todos os itens foram conferidos neste recebimento."
          >
            {naoConferidos.map((item) => (
              <DivergenciaRow key={item.sku} item={item} />
            ))}
          </AccordionSection>

          <AccordionSection
            title="Divergências encontradas"
            count={divergencias.length}
            icon={GitCompareArrows}
            variant="secondary"
            isOpen={isAccordionDivergenciaOpen}
            onToggle={actions.toggleDivergenciaAccordion}
            isEmpty={divergencias.length === 0}
            emptyMessage="Nenhuma divergência encontrada neste recebimento."
          >
            {divergencias.map((item) => (
              <DivergenciaRow key={item.sku} item={item} />
            ))}
          </AccordionSection>
        </div>
      </div>

      <TerminoBottomDock
        dock={dock}
        isFinalizing={isFinalizing}
        onRequestFinalize={actions.openConfirmModal}
      />

      <ConfirmarLiberacaoModal
        open={confirmModalOpen}
        dock={dock}
        isFinalizing={isFinalizing}
        onCancel={actions.closeConfirmModal}
        onConfirm={actions.handleFinalizarDoca}
      />
    </div>
  );
}
