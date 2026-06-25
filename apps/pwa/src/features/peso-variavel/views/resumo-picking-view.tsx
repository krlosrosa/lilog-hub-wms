import { Button, cn } from '@lilog/ui';
import { Link, useParams } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  CheckCircle,
  Loader2,
  Package,
  Printer,
  Warehouse,
  Weight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  useResumoPicking,
  type ResumoPickingToast,
} from '../hooks/use-resumo-picking';
import type { SkuResumoStatus } from '../types/peso-variavel.schema';

function ResumoToastPortal({ toast }: { toast: ResumoPickingToast | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+16px)] z-[60] flex justify-center px-margin-mobile transition-opacity duration-300',
        toast ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-body-sm font-medium shadow-lg',
          toast?.variant === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-secondary-container text-on-secondary-container',
        )}
      >
        {toast?.message ?? ''}
      </div>
    </div>,
    document.body,
  );
}

function StatusBadge({ status }: { status: SkuResumoStatus }) {
  const isOk = status === 'correspondido';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-medium',
        isOk
          ? 'bg-secondary-container/10 text-secondary'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      {isOk ? (
        <CheckCircle className="h-3 w-3" aria-hidden />
      ) : (
        <AlertTriangle className="h-3 w-3" aria-hidden />
      )}
      {isOk ? 'Correspondido' : 'Divergente'}
    </span>
  );
}

function SkuResumoCard({
  sku,
  descricao,
  separado,
  esperado,
  status,
}: {
  sku: string;
  descricao: string;
  separado: number;
  esperado: number;
  status: SkuResumoStatus;
}) {
  return (
    <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-label-md font-bold text-primary">{sku}</p>
          <p className="line-clamp-2 text-body-sm text-on-surface-variant">
            {descricao}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex gap-6">
        <div>
          <p className="text-label-sm text-on-surface-variant">Separado</p>
          <p className="font-mono text-body-md font-semibold text-on-surface">
            {separado}
          </p>
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant">Esperado</p>
          <p className="font-mono text-body-md font-semibold text-on-surface">
            {esperado}
          </p>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  icon: Icon,
  value,
  suffix,
  detail,
  detailClassName,
  valueClassName,
}: {
  label: string;
  icon: typeof Package;
  value: string | number;
  suffix?: string;
  detail: string;
  detailClassName?: string;
  valueClassName?: string;
}) {
  return (
    <article className="flex flex-col justify-between rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <Icon className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
      </div>
      <div>
        <p className={cn('text-headline-xl font-bold text-on-surface', valueClassName)}>
          {value}
          {suffix && (
            <span className="ml-1 text-headline-md font-semibold">{suffix}</span>
          )}
        </p>
        <p className={cn('text-body-sm text-on-surface-variant', detailClassName)}>
          {detail}
        </p>
      </div>
    </article>
  );
}

export function ResumoPickingView() {
  const { id } = useParams({ from: '/peso-variavel/$id/resumo' });
  const { state, actions } = useResumoPicking(id);
  const { resumo } = state;

  return (
    <div className="page-enter pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <ResumoToastPortal toast={state.toast} />

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/peso-variavel/$id"
            params={{ id }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-90 transition-transform touch-manipulation"
            aria-label="Voltar para separação"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Separação Concluída
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {resumo.loteId} · {resumo.zona}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        <article className="flex items-center gap-3 rounded-lg border border-secondary/30 bg-secondary-container/10 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
            <CheckCircle className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-md font-semibold text-on-surface">
              Tarefa finalizada com sucesso
            </p>
            <p className="text-body-sm text-on-surface-variant">
              {resumo.totalCaixas} caixas ·{' '}
              {resumo.pesoTotalKg.toLocaleString('pt-BR')} kg · 100% meta
            </p>
          </div>
        </article>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="TOTAL DE CAIXAS"
            icon={Package}
            value={resumo.totalCaixas}
            detail="100% meta atingida"
            detailClassName="font-medium text-secondary"
          />
          <StatCard
            label="PESO TOTAL"
            icon={Weight}
            value={resumo.pesoTotalKg.toLocaleString('pt-BR')}
            suffix="kg"
            detail="Balança nº 4"
          />
          <div className="col-span-2">
            <StatCard
              label="DIVERGÊNCIAS"
              icon={AlertTriangle}
              value={resumo.divergencias}
              detail={
                resumo.divergencias === 0
                  ? 'Todos os itens verificados'
                  : 'Itens com diferença de quantidade'
              }
              valueClassName="text-destructive"
            />
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-headline-md font-semibold text-on-surface">
              Resumo de SKU
            </h2>
            <span className="text-label-sm text-on-surface-variant">
              {resumo.skus.length} SKUs
            </span>
          </div>
          <div className="space-y-3">
            {resumo.skus.map((sku) => (
              <SkuResumoCard
                key={sku.id}
                sku={sku.sku}
                descricao={sku.descricao}
                separado={sku.separado}
                esperado={sku.esperado}
                status={sku.status}
              />
            ))}
          </div>
        </section>

        <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
            <Warehouse className="h-5 w-5 text-secondary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-md font-semibold text-on-surface">
              {resumo.zona}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              Pronto para estocagem na Pista 04
            </p>
          </div>
        </article>

        <article className="flex items-start gap-3 rounded-lg border border-secondary/20 bg-secondary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface">
            <Barcode className="h-5 w-5 text-secondary" aria-hidden />
          </div>
          <div>
            <h3 className="text-body-md font-semibold text-on-surface">
              Pronto para Estocagem
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Bipe a etiqueta do palete para confirmar a colocação na Pista 04 para
              o despacho final.
            </p>
          </div>
        </article>

        <article className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
          <p className="text-label-sm text-on-surface-variant">Operador assinado</p>
          <p className="text-body-md font-semibold text-on-surface">
            {resumo.operador} · Turno {resumo.turno}
          </p>
        </article>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            disabled={state.isSubmitting || state.isFinished}
            onClick={() => void actions.handleFinalizar()}
            className={cn(
              'h-12 w-full rounded-lg bg-secondary text-secondary-foreground touch-manipulation active:scale-95 transition-transform',
              state.isFinished && 'bg-secondary-container text-on-secondary-container',
            )}
          >
            {state.isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Processando...
              </>
            ) : state.isFinished ? (
              <>
                <CheckCircle className="h-5 w-5" aria-hidden />
                Finalizado
              </>
            ) : (
              <>
                Finalizar Separação
                <ArrowRight className="h-5 w-5" aria-hidden />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-lg touch-manipulation active:scale-95 transition-transform"
            onClick={() => actions.handleImprimir()}
          >
            <Printer className="h-4 w-4" aria-hidden />
            Imprimir Etiquetas
          </Button>
        </div>
      </div>
    </div>
  );
}
