import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  GitCompareArrows,
  ListChecks,
  Loader2,
  Minus,
  Package,
  PackageCheck,
  Plus,
  Timer,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { hapticMedium } from '@/lib/haptics';

import { ChecklistResumoV2Card } from '../components/checklist-resumo-v2-card';
import { SyncStatusV2 } from '../components/sync-status-v2';
import { TemperaturaProdutoV2ModalButton } from '../components/temperatura-produto-v2-card';
import { useChecklistV2 } from '../hooks/use-checklist-v2';
import { useConflictV2 } from '../hooks/use-conflict-v2';
import { useDockDisplayLabelV2 } from '../hooks/use-dock-display-label-v2';
import { useFinalizarV2 } from '../hooks/use-finalizar-v2';
import { useForcePullV2 } from '../hooks/use-force-pull-v2';
import { useProcessV2 } from '../hooks/use-process-v2';
import { useSyncStatusV2 } from '../hooks/use-sync-status-v2';
import { syncNowV2 } from '../services/auto-sync-v2.service';
import { showSyncResultToast } from '../lib/sync-result-toast';
import { TEMPERATURAS_BAU_INCOMPLETAS_MSG } from '../lib/temperatura-bau-v2';
import type { DamageRecord } from '../local-db/schema';
import type { DivergenciaItem } from '../types/recebimento-v2.schema';

const STATUS_CONFIG: Record<
  DivergenciaItem['status'],
  { icon: LucideIcon; label: string; className: string; badgeClass: string }
> = {
  ok: {
    icon: CheckCircle2,
    label: 'OK',
    className: 'text-secondary',
    badgeClass: 'bg-secondary/10 text-secondary',
  },
  falta: {
    icon: Minus,
    label: 'Falta',
    className: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive',
  },
  sobra: {
    icon: Plus,
    label: 'Sobra',
    className: 'text-warning',
    badgeClass: 'bg-warning/10 text-warning',
  },
  nao_conferido: {
    icon: Package,
    label: 'Não conferido',
    className: 'text-muted-foreground',
    badgeClass: 'bg-surface-container text-on-surface-variant',
  },
};

function formatElapsed(minutes: number | null): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface p-3.5 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-label-sm text-on-surface-variant">{label}</span>
        <p className="font-mono text-headline-sm font-bold text-on-surface">{value}</p>
        {sublabel ? (
          <p className="truncate text-[11px] text-muted-foreground">{sublabel}</p>
        ) : null}
      </div>
    </article>
  );
}

function StatPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'bg-surface-container text-on-surface-variant',
    success: 'bg-secondary/10 text-secondary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  }[tone];

  return (
    <div className={cn('flex flex-col items-center rounded-xl px-3 py-2.5', toneClass)}>
      <span className="font-mono text-headline-sm font-bold tabular-nums">{count}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

function AccordionSection({
  title,
  count,
  icon: Icon,
  variant,
  defaultOpen = false,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  icon: LucideIcon;
  variant: 'destructive' | 'warning' | 'neutral';
  defaultOpen?: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isEmpty = count === 0;

  const headerTone = {
    destructive: 'bg-destructive/8 text-destructive',
    warning: 'bg-warning/8 text-warning',
    neutral: 'bg-secondary/5 text-secondary',
  }[variant];

  const iconTone = {
    destructive: 'text-destructive',
    warning: 'text-warning',
    neutral: 'text-secondary',
  }[variant];

  const badgeTone = {
    destructive: 'bg-destructive/15 text-destructive',
    warning: 'bg-warning/15 text-warning',
    neutral: 'bg-secondary/15 text-secondary',
  }[variant];

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between gap-2 px-4 py-3 transition-colors touch-manipulation active:scale-[0.99]',
          headerTone,
        )}
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('h-5 w-5 shrink-0', iconTone)} aria-hidden />
          <span className="truncate text-label-md font-semibold">{title}</span>
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums',
              badgeTone,
            )}
          >
            {count}
          </span>
        </div>
        {open ? (
          <ChevronUp className={cn('h-5 w-5 shrink-0', iconTone)} aria-hidden />
        ) : (
          <ChevronDown className={cn('h-5 w-5 shrink-0', iconTone)} aria-hidden />
        )}
      </button>
      {open && (
        <div className="space-y-2 border-t border-outline-variant/60 p-4">
          {isEmpty ? (
            <p className="py-3 text-center text-body-sm text-on-surface-variant">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}

function AvariaRow({ avaria }: { avaria: DamageRecord }) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container/40 p-3.5">
      <div className="border-l-[3px] border-destructive pl-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {avaria.sku ? (
              <span className="font-mono text-label-md font-bold text-primary">{avaria.sku}</span>
            ) : null}
            <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface">{avaria.description}</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-destructive/10 px-2.5 py-0.5 font-mono text-label-sm font-bold text-destructive">
            {avaria.quantity} un
          </span>
        </div>
        {avaria.motivo ? (
          <p className="mt-2 flex items-center gap-1 text-label-sm font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {avaria.motivo}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function DivergenciaRow({ item }: { item: DivergenciaItem }) {
  const config = STATUS_CONFIG[item.status];
  const StatusIcon = config.icon;

  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container/40 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-label-md font-bold text-primary">{item.sku}</span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                config.badgeClass,
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden />
              {config.label}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
            {item.description}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-label-md font-bold tabular-nums text-on-surface">
            {item.conferencedQuantity}
            <span className="text-on-surface-variant">/</span>
            {item.expectedQuantity}
          </p>
          <p className="text-[10px] text-muted-foreground">conf./esp.</p>
        </div>
      </div>
    </article>
  );
}

function TerminoBottomDock({
  dock,
  isFinalizing,
  hasBlockingIssues,
  temperaturasCompletas,
  quantidadePaletes,
  onQuantidadePaletesChange,
  paletesInvalid,
  onRequestFinalize,
}: {
  dock: string;
  isFinalizing: boolean;
  hasBlockingIssues: boolean;
  temperaturasCompletas: boolean;
  quantidadePaletes: string;
  onQuantidadePaletesChange: (value: string) => void;
  paletesInvalid: boolean;
  onRequestFinalize: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-outline-variant bg-surface/95 shadow-[0_8px_32px_rgba(11,28,48,0.16)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        <p className="flex items-center justify-center gap-2 px-4 pb-1 pt-3 text-center text-label-sm text-on-surface-variant">
          <PackageCheck className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
          Doca <span className="font-semibold text-on-surface">{dock}</span>
          {hasBlockingIssues ? ' · revise pendências' : ' · pronta para liberar'}
        </p>
        <div className="space-y-2 px-3 pb-1 pt-2">
          {!temperaturasCompletas ? (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-label-sm text-warning">
              {TEMPERATURAS_BAU_INCOMPLETAS_MSG}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <label
              htmlFor="quantidade-paletes-recebidos"
              className="text-label-sm font-medium text-on-surface"
            >
              Paletes recebidos *
            </label>
            <input
              id="quantidade-paletes-recebidos"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              required
              value={quantidadePaletes}
              onChange={(event) => onQuantidadePaletesChange(event.target.value)}
              placeholder="Ex: 12"
              aria-invalid={paletesInvalid}
              className={cn(
                'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none',
                'focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                paletesInvalid ? 'border-destructive' : 'border-input',
              )}
            />
            {paletesInvalid ? (
              <p className="text-label-sm text-destructive">
                Informe a quantidade de paletes recebidos (número inteiro maior que zero)
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            onClick={onRequestFinalize}
            disabled={isFinalizing || paletesInvalid || !temperaturasCompletas}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation active:scale-[0.98] hover:bg-secondary/90 disabled:opacity-60"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              <>
                <ListChecks className="h-5 w-5" aria-hidden />
                Finalizar e liberar doca
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
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
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmar-liberacao-v2-title"
        className={cn(
          'w-full max-w-sm rounded-2xl border border-outline-variant bg-surface p-5 shadow-2xl transition-transform duration-200',
          open ? 'translate-y-0' : 'translate-y-4',
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
          <ListChecks className="h-6 w-6" aria-hidden />
        </div>
        <h2
          id="confirmar-liberacao-v2-title"
          className="mb-2 text-headline-md font-semibold text-on-surface"
        >
          Confirmar conclusão?
        </h2>
        <p className="mb-5 text-body-sm text-on-surface-variant">
          A doca <span className="font-semibold text-on-surface">{dock}</span> será liberada e o
          recebimento encerrado.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isFinalizing}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-on-secondary touch-manipulation active:scale-[0.98]"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Salvando...
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
            className="flex h-12 flex-1 items-center justify-center rounded-xl touch-manipulation active:scale-[0.98]"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ResumoV2ViewProps {
  demandId: string;
}

export function ResumoV2View({ demandId }: ResumoV2ViewProps) {
  const {
    dock,
    divergencias,
    naoConferidos,
    divergenciasAtivas,
    avarias,
    elapsedMinutes,
    isFinalizing,
    showConfirmModal,
    setShowConfirmModal,
    finalizar,
    error,
    temperaturasCompletas,
    temperaturasPreenchidas,
    temperaturasTotal,
  } = useFinalizarV2(demandId);
  const { process } = useProcessV2(demandId);
  const { checklist, isLoading: isChecklistLoading } = useChecklistV2(demandId);
  const syncStatus = useSyncStatusV2(demandId);
  const { forcePull, isPulling, pullDisabled } = useForcePullV2(demandId);
  const { conflicts } = useConflictV2(demandId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [quantidadePaletes, setQuantidadePaletes] = useState('');

  const paletesValue = Number(quantidadePaletes);
  const paletesInvalid =
    quantidadePaletes.trim() === '' ||
    !Number.isInteger(paletesValue) ||
    paletesValue <= 0;

  const okCount = useMemo(
    () => divergencias.filter((item) => item.status === 'ok').length,
    [divergencias],
  );

  const hasReviewItems =
    naoConferidos.length > 0 || divergenciasAtivas.length > 0 || avarias.length > 0;
  const hasBlockingIssues = conflicts.length > 0 || !temperaturasCompletas;
  const isCompleted = process?.status === 'completed';

  const hero = useMemo(() => {
    if (isCompleted) {
      return {
        icon: CheckCircle2,
        iconClass: 'bg-secondary-container text-on-secondary-container',
        title: 'Processo concluído',
        subtitle: 'Este recebimento já foi finalizado e a doca liberada.',
      };
    }
    if (hasBlockingIssues && !temperaturasCompletas) {
      return {
        icon: AlertTriangle,
        iconClass: 'bg-warning/15 text-warning',
        title: 'Temperaturas pendentes',
        subtitle: TEMPERATURAS_BAU_INCOMPLETAS_MSG,
      };
    }
    if (hasBlockingIssues) {
      return {
        icon: AlertTriangle,
        iconClass: 'bg-destructive/15 text-destructive',
        title: 'Conflitos pendentes',
        subtitle: 'Resolva os conflitos de sincronização antes de liberar a doca.',
      };
    }
    if (hasReviewItems) {
      return {
        icon: ClipboardList,
        iconClass: 'bg-warning/15 text-warning',
        title: 'Revise antes de liberar',
        subtitle: 'Confira avarias, itens pendentes e divergências abaixo.',
      };
    }
    return {
      icon: PackageCheck,
      iconClass: 'bg-secondary-container text-on-secondary-container',
      title: 'Pronto para finalizar',
      subtitle: 'Tudo conferido. Confirme a liberação da doca para encerrar.',
    };
  }, [hasBlockingIssues, hasReviewItems, isCompleted, temperaturasCompletas]);

  const HeroIcon = hero.icon;

  async function handleSync() {
    hapticMedium();
    const hadPhotos = syncStatus.pendingPhotoCount > 0;
    setIsSyncing(true);
    syncStatus.setIsSyncing(true);
    try {
      const result = await syncNowV2(demandId, { manual: true });
      if (!result) {
        toast.info('Tudo já estava sincronizado');
        return;
      }
      showSyncResultToast(result, { hadPhotos });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      setIsSyncing(false);
      syncStatus.setIsSyncing(false);
    }
  }

  const placa = process?.placa?.trim();
  const dockLabel = useDockDisplayLabelV2(checklist?.dock ?? process?.dock);
  const headerSubtitle = process
    ? [
        process.supplier && process.supplier !== demandId ? process.supplier : null,
        dockLabel !== '—' ? `Doca ${dockLabel}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || placa || '—'
    : '—';

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-2 px-margin-mobile">
          <Link
            to="/recebimento-v2/$id/itens"
            params={{ id: demandId }}
            aria-label="Voltar para itens"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                'truncate text-headline-md font-semibold leading-tight text-on-surface',
                placa && 'font-mono uppercase tracking-wide',
              )}
            >
              {placa || 'Resumo da conferência'}
            </h1>
            <p className="truncate text-label-sm text-on-surface-variant">{headerSubtitle}</p>
          </div>
          {!isCompleted ? (
            <Link
              to="/recebimento-v2/$id/itens"
              params={{ id: demandId }}
              className="shrink-0 rounded-full bg-surface-container px-3 py-1.5 text-label-sm font-medium text-on-surface-variant touch-manipulation active:scale-95"
            >
              Itens
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 px-margin-mobile pb-[calc(140px+env(safe-area-inset-bottom,0px))] pt-5">
        <section className="flex flex-col items-center rounded-2xl border border-outline-variant bg-surface px-5 py-6 text-center shadow-sm">
          <div
            className={cn(
              'mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full shadow-md',
              hero.iconClass,
            )}
          >
            <HeroIcon className="h-9 w-9" aria-hidden />
          </div>
          <h2 className="mb-1 text-headline-md font-semibold text-on-surface">{hero.title}</h2>
          <p className="max-w-xs text-body-sm text-on-surface-variant">{hero.subtitle}</p>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              <StatPill label="Total" count={divergencias.length} tone="neutral" />
              <StatPill label="OK" count={okCount} tone="success" />
              <StatPill label="Pend." count={naoConferidos.length} tone="warning" />
              <StatPill label="Div." count={divergenciasAtivas.length} tone="danger" />
            </div>
            <p className="text-label-sm text-on-surface-variant">
              {okCount} de {divergencias.length} itens conferidos corretamente
              {avarias.length > 0 ? ` · ${avarias.length} avaria(s)` : ''}
            </p>
          </div>
        </section>

        <MetricCard
          icon={Timer}
          label="Tempo total"
          value={formatElapsed(elapsedMinutes)}
          sublabel={elapsedMinutes != null ? 'desde o início' : undefined}
        />

        <SyncStatusV2
          syncStatus={{ ...syncStatus, isSyncing: syncStatus.isSyncing || isSyncing }}
          onSync={() => void handleSync()}
          onPull={() => void forcePull()}
          isPulling={isPulling}
          pullDisabled={pullDisabled}
        />

        <ChecklistResumoV2Card
          checklist={checklist}
          isLoading={isChecklistLoading}
          defaultOpen={false}
        />

        {!isCompleted && !temperaturasCompletas ? (
          <section className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-warning">
                Temperaturas do baú ({temperaturasPreenchidas}/{temperaturasTotal})
              </p>
              <p className="text-label-sm text-warning/80">{TEMPERATURAS_BAU_INCOMPLETAS_MSG}</p>
            </div>
            <TemperaturaProdutoV2ModalButton demandId={demandId} />
          </section>
        ) : null}

        {conflicts.length > 0 ? (
          <Link
            to="/recebimento-v2/$id/conflito"
            params={{ id: demandId }}
            className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3.5 touch-manipulation active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-destructive">
                {conflicts.length} conflito{conflicts.length === 1 ? '' : 's'} pendente
                {conflicts.length === 1 ? '' : 's'}
              </p>
              <p className="text-label-sm text-destructive/70">Toque para resolver antes de finalizar</p>
            </div>
            <GitCompareArrows className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
          </Link>
        ) : null}

        <div className="space-y-3">
          <AccordionSection
            title="Avarias registradas"
            count={avarias.length}
            icon={AlertCircle}
            variant="destructive"
            defaultOpen={avarias.length > 0}
            emptyMessage="Nenhuma avaria registrada neste recebimento."
          >
            {avarias.map((avaria) => (
              <AvariaRow key={avaria.id} avaria={avaria} />
            ))}
          </AccordionSection>

          <AccordionSection
            title="Itens não conferidos"
            count={naoConferidos.length}
            icon={Clock}
            variant="warning"
            defaultOpen={naoConferidos.length > 0}
            emptyMessage="Todos os itens foram conferidos."
          >
            {naoConferidos.map((item) => (
              <DivergenciaRow key={item.sku} item={item} />
            ))}
          </AccordionSection>

          <AccordionSection
            title="Divergências de quantidade"
            count={divergenciasAtivas.length}
            icon={GitCompareArrows}
            variant="neutral"
            defaultOpen={divergenciasAtivas.length > 0}
            emptyMessage="Nenhuma divergência de quantidade encontrada."
          >
            {divergenciasAtivas.map((item) => (
              <DivergenciaRow key={item.sku} item={item} />
            ))}
          </AccordionSection>
        </div>

        {process ? (
          <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container/40 px-4 py-3 text-label-sm">
            <span className="text-muted-foreground">Revisão servidor</span>
            <span className="font-mono font-medium text-on-surface">{process.serverRevision}</span>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
            {error}
          </p>
        ) : null}
      </div>

      {!isCompleted ? (
        <TerminoBottomDock
          dock={dock}
          isFinalizing={isFinalizing}
          hasBlockingIssues={hasBlockingIssues || hasReviewItems}
          temperaturasCompletas={temperaturasCompletas}
          quantidadePaletes={quantidadePaletes}
          onQuantidadePaletesChange={setQuantidadePaletes}
          paletesInvalid={paletesInvalid}
          onRequestFinalize={() => setShowConfirmModal(true)}
        />
      ) : null}

      <ConfirmarLiberacaoModal
        open={showConfirmModal}
        dock={dock}
        isFinalizing={isFinalizing}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={() => void finalizar(paletesValue)}
      />
    </div>
  );
}
