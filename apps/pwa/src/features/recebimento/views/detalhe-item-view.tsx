import { Button, cn } from '@lilog/ui';

import { Link } from '@tanstack/react-router';

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Barcode,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ClipboardList,
  Hash,
  Loader2,
  Minus,
  Package,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
} from 'lucide-react';
import type { ChangeEventHandler, KeyboardEvent, KeyboardEventHandler, ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import type { UseFormRegisterReturn } from 'react-hook-form';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { useAuth } from '@/features/auth/lib/auth-context';

import { QrScannerModal } from '@/components/qr-scanner';

import { AvariaQuickCaptureButton } from '../components/avaria-quick-capture-button';
import { ChecklistResumoCard } from '../components/checklist-resumo-card';
import { TemperaturaProdutoModalButton } from '../components/temperatura-produto-etapas-card';
import { PaleteSessionBanner } from '../components/palete-conferencia-cards';
import { setConferenciaNavigation } from '../lib/conferencia-conferidos-store';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import { resolveMaintainedLoteContext } from '../lib/conferencia-form';
import { setConferenciaEntryStep } from '../lib/conferencia-sku-session';
import {
  canParseFabricacaoFromLote,
  parseFabricacaoFromLote,
} from '@lilog/contracts';
import { useAvariasRegistradas } from '../hooks/use-avarias-registradas';
import { useChecklistResumo } from '../hooks/use-checklist-resumo';
import { useDetalheItem } from '../hooks/use-detalhe-item';
import type { ConferenciaStep } from '../hooks/use-detalhe-item';
import { useDemandById } from '../hooks/use-demand-by-id';
import {
  CollapsibleRecordCard,
  RecordListItem,
} from '../components/expandable-record-list';
import {
  formatConferenteLabel,
  resolveConferenteInfo,
} from '../lib/resolve-conferente-info';

const FIELD_LABEL = 'text-xs font-medium text-on-surface-variant';
const FIELD_TEXT = 'text-xs text-on-surface';
const FIELD_TEXT_MUTED = 'text-xs text-on-surface-variant';
const FIELD_MONO = 'text-xs font-mono text-on-surface';
const FIELD_HINT = 'text-xs text-destructive';
const FIELD_HINT_OK = 'text-xs text-secondary';

interface DetalheItemViewProps {
  demandId: string;
  initKey?: string;
}

function StepIndicator({
  activeStep,
  totalSteps,
}: {
  activeStep: number;
  totalSteps: number;
}) {
  return (
    <div
      className="flex items-center gap-2 px-margin-mobile pb-2.5"
      role="progressbar"
      aria-valuenow={activeStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Etapa ${activeStep} de ${totalSteps}`}
    >
      <div className="flex min-w-0 flex-1 gap-1">
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((n) => (
          <div
            key={n}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              n <= activeStep ? 'bg-secondary' : 'bg-surface-container',
              n < activeStep && 'opacity-50',
            )}
            aria-hidden
          />
        ))}
      </div>
      <span className={cn('shrink-0 font-mono tabular-nums', FIELD_TEXT_MUTED)}>
        {activeStep}/{totalSteps}
      </span>
    </div>
  );
}

function ScanField({
  id,
  label,
  icon: Icon,
  placeholder,
  registerProps,
  onScanClick,
  error,
  inputRef,
  autoFocus,
  onKeyDown,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof Barcode;
  placeholder: string;
  registerProps?: UseFormRegisterReturn;
  onScanClick?: () => void;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  const isControlled = value !== undefined && onChange !== undefined;

  return (
    <div className="space-y-1">
      <label className={FIELD_LABEL} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        <input
          id={id}
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          {...(isControlled
            ? { value, onChange }
            : registerProps)}
          className={cn(
            'h-11 w-full rounded-lg border border-outline-variant bg-surface-bright pl-10 pr-11 font-mono outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary',
            FIELD_TEXT,
          )}
        />
        {onScanClick ? (
          <button
            type="button"
            aria-label={`Escanear ${label}`}
            onClick={onScanClick}
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-transform active:scale-90 active:bg-surface-container-high touch-manipulation"
          >
            <ScanLine className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {error ? <p className={FIELD_HINT}>{error}</p> : null}
    </div>
  );
}

function NumericField({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  inputRef,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-1">
      <label className={FIELD_LABEL} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className={cn(
            'h-11 w-full rounded-lg border border-outline-variant bg-surface-bright pl-10 pr-4 font-mono outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary',
            FIELD_TEXT,
          )}
        />
      </div>
      {error ? <p className={FIELD_HINT}>{error}</p> : null}
    </div>
  );
}

function formatIsoDateForDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function FabricacaoField({
  id,
  value,
  displayValue,
  derivedFromLote,
  onChange,
  error,
  hint,
  hintError,
}: {
  id: string;
  value: string;
  displayValue: string;
  derivedFromLote: boolean;
  onChange: (next: string) => void;
  error?: string;
  hint?: string;
  hintError?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <label className={FIELD_LABEL} htmlFor={id}>
        Fabricação
      </label>
      <div className="relative min-w-0">
        <Calendar
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
          aria-hidden
        />
        {derivedFromLote ? (
          <div
            id={id}
            role="textbox"
            aria-readonly="true"
            className={cn(
              'flex h-11 w-full min-w-0 items-center rounded-lg border border-outline-variant bg-surface-container-low pl-10 pr-3 font-mono',
              FIELD_TEXT,
              !displayValue && 'text-on-surface-variant',
            )}
          >
            <span className="truncate">{displayValue || 'Informe o lote acima'}</span>
          </div>
        ) : (
          <input
            id={id}
            type="date"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              'date-input-mobile h-11 w-full min-w-0 max-w-full rounded-lg border border-outline-variant bg-surface-bright pl-10 pr-3 font-mono outline-none focus:border-secondary focus:ring-2 focus:ring-secondary',
              FIELD_TEXT,
            )}
          />
        )}
      </div>
      {error ? <p className={FIELD_HINT}>{error}</p> : null}
      {hint ? (
        <p className={cn('flex items-start gap-1', FIELD_HINT_OK)}>
          <CheckCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{hint}</span>
        </p>
      ) : null}
      {hintError ? (
        <p className={cn('min-w-0 break-words', FIELD_HINT)}>{hintError}</p>
      ) : null}
    </div>
  );
}

function NumericStepper({
  id,
  label,
  value,
  onChange,
  error,
  step = 1,
  min = 0,
  inputMode = 'numeric' as 'numeric' | 'decimal',
  onKeyDown,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  step?: number;
  min?: number;
  inputMode?: 'numeric' | 'decimal';
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}) {
  const adjust = (delta: number) => {
    hapticLight();
    const current = value === '' ? 0 : Number(value);
    if (Number.isNaN(current)) return;
    const next = Math.max(min, current + delta);
    onChange(String(next));
  };

  return (
    <div className="space-y-1">
      {label ? (
        <label className={FIELD_LABEL} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex h-10 w-10 items-center justify-center rounded-l-lg text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          pattern={inputMode === 'decimal' ? undefined : '[0-9]*'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            'numeric-input h-10 w-full min-w-0 flex-1 bg-transparent text-center font-mono font-semibold outline-none',
            FIELD_TEXT,
          )}
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex h-10 w-10 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {error ? <p className={FIELD_HINT}>{error}</p> : null}
    </div>
  );
}

function CompactStepSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof QrCode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-outline-variant/50 bg-surface-container-low/50 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
          <Icon className="h-4 w-4 text-secondary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className={cn('font-semibold leading-tight', FIELD_TEXT)}>{title}</h2>
          {subtitle ? (
            <p className={cn('truncate', FIELD_TEXT_MUTED)}>{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="p-3">{children}</div>
    </article>
  );
}

function ProductSummaryBar({
  sku,
  name,
  palete,
  showPalete,
}: {
  sku: string;
  name: string;
  palete?: string;
  showPalete?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface px-3 py-2 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container">
        <Package className="h-4 w-4 text-secondary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-bold text-primary', FIELD_MONO)}>{sku}</p>
        <p className={cn('truncate', FIELD_TEXT)}>{name}</p>
        {showPalete && palete ? (
          <p className={cn('truncate', FIELD_TEXT_MUTED)}>Palete {palete}</p>
        ) : null}
      </div>
    </div>
  );
}

function QuantidadeResumoGrid({
  showCaixa,
  showUnidade,
  showPeso,
  conferidoTotais,
  hasLotesConferidos,
  lotesCount,
  isPvar,
  gridClass,
}: {
  showCaixa: boolean;
  showUnidade: boolean;
  showPeso: boolean;
  conferidoTotais: { caixa: number; unidade: number; peso: number };
  hasLotesConferidos: boolean;
  lotesCount: number;
  isPvar: boolean;
  gridClass: string;
}) {
  const cells = [
    showCaixa
      ? { label: 'Cx', value: conferidoTotais.caixa > 0 ? String(conferidoTotais.caixa) : '—' }
      : null,
    showUnidade
      ? { label: 'Un', value: conferidoTotais.unidade > 0 ? String(conferidoTotais.unidade) : '—' }
      : null,
    showPeso
      ? {
          label: 'Kg',
          value: conferidoTotais.peso > 0 ? conferidoTotais.peso.toFixed(3) : '—',
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-1.5',
        hasLotesConferidos
          ? 'border-secondary/30 bg-secondary/5'
          : 'border-outline-variant/60 bg-surface-container-low',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('font-semibold uppercase tracking-wider', FIELD_TEXT_MUTED)}>
          Conferido
        </span>
        {hasLotesConferidos ? (
          <span className={cn('flex items-center gap-1 font-medium text-secondary', FIELD_TEXT)}>
            <CheckCircle className="h-3 w-3" aria-hidden />
            {lotesCount}{' '}
            {isPvar
              ? lotesCount === 1
                ? 'caixa'
                : 'caixas'
              : lotesCount === 1
                ? 'lote'
                : 'lotes'}
          </span>
        ) : null}
      </div>
      <div className={cn('grid gap-1', gridClass)}>
        {cells.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 rounded-md bg-surface px-2 py-1"
          >
            <span className={cn('uppercase', FIELD_TEXT_MUTED)}>{label}</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums',
                FIELD_TEXT,
                value === '—' && 'text-on-surface-variant',
              )}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardBottomDock({
  step,
  canAdvanceStep1,
  canAdvanceStep2,
  canSaveConferencia,
  canRemoverConferencia,
  isSavingConferencia,
  onNext,
  onPrev,
  onSave,
}: {
  step: ConferenciaStep;
  canAdvanceStep1: boolean;
  canAdvanceStep2: boolean;
  canSaveConferencia: boolean;
  canRemoverConferencia: boolean;
  isSavingConferencia: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const dockPadding = 'pb-[calc(16px+env(safe-area-inset-bottom,0px))]';

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface/90 backdrop-blur-md',
        dockPadding
      )}
    >
      <div className="pointer-events-auto flex gap-2 px-margin-mobile pt-2.5">
        {step === 1 ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canAdvanceStep1}
            className={cn(
              'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg font-semibold touch-manipulation active:scale-[0.98]',
              FIELD_TEXT,
              canAdvanceStep1
                ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}

        {step === 2 ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border-outline-variant text-secondary touch-manipulation active:scale-[0.98]"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={!canAdvanceStep2}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg font-semibold touch-manipulation active:scale-[0.98]',
                FIELD_TEXT,
                canAdvanceStep2
                  ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onPrev}
              className="flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border-outline-variant text-secondary touch-manipulation active:scale-[0.98]"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={() => {
                hapticMedium();
                void onSave();
              }}
              disabled={!canSaveConferencia || isSavingConferencia}
              className={cn(
                'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg font-semibold touch-manipulation active:scale-[0.98]',
                FIELD_TEXT,
                canSaveConferencia
                  ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              {isSavingConferencia ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando…
                </>
              ) : canRemoverConferencia ? (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Remover
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

export function DetalheItemView({ demandId, initKey }: DetalheItemViewProps) {
  const { user } = useAuth();
  const demand = useDemandById(demandId);
  const { state, actions } = useDetalheItem(demandId, initKey);
  const conferenteLabel = useMemo(
    () => formatConferenteLabel(resolveConferenteInfo(demandId, demand, user)),
    [demand, demandId, user],
  );
  const {
    step,
    item,
    lotesConferidos,
    lotesPorPalete,
    lotesListExpanded,
    isSubmitting,
    errors,
    form,
    conferidoTotais,
    hasLotesConferidos,
    canSaveConferencia,
    canRemoverConferencia,
    isSavingConferencia,
    saveError,
    canAdvanceStep1,
    canAdvanceStep2,
    scanOpen,
    scanTitle,
    skuValue,
    idPaleteValue,
    produtoConfig,
    parametrosConferencia,
    totalSteps,
    displayStep,
    minStep,
    controlaPalete,
    paleteSessionAtivo,
    paleteSessionCodigo,
    loteInputRef,
    gs1InputRef,
    gs1WedgeValue,
    ignoreMaintainedLote,
    loteDraftConfirmed,
  } = state;

  const activeSku = skuValue.trim() || item.sku;
  const activeProdutoId = useMemo(() => {
    if (!activeSku) return null;
    return (
      getConferenciaContextStore(demandId)?.itemMetaBySku[activeSku.toLowerCase()]
        ?.produtoId ?? null
    );
  }, [activeSku, demandId]);

  const avarias = useAvariasRegistradas(demandId, {
    sku: activeSku,
    produtoId: activeProdutoId,
  });
  const checklistResumo = useChecklistResumo(demandId);

  const etiquetaRegister = actions.register('etiqueta');
  const etiquetaRegisterProps = {
    ...etiquetaRegister,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      actions.handleFieldGs1Enter(event);
      etiquetaRegister.onKeyDown?.(event);
    },
  };

  const recebidaCaixa = form.watch('recebidaCaixa') ?? '';
  const recebidaUnidade = form.watch('recebidaUnidade') ?? '';
  const peso = form.watch('peso') ?? '';
  const loteValue = form.watch('lote') ?? '';
  const validadeValue = form.watch('validade') ?? '';

  const { quantidadeModo, loteModo } = parametrosConferencia;
  const isPvar = produtoConfig.pesoVariavel;

  const loteRegister = actions.register('lote');
  const loteRegisterProps = isPvar
    ? {
        ...loteRegister,
        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
          actions.handleLoteKeyDown(event);
          loteRegister.onKeyDown?.(event);
        },
      }
    : loteRegister;

  const showCaixa =
    !isPvar && (quantidadeModo === 'caixa' || quantidadeModo === 'ambos');
  const showUnidade =
    !isPvar && (quantidadeModo === 'unidade' || quantidadeModo === 'ambos');
  const quantidadeGridClass =
    showCaixa && showUnidade ? 'grid-cols-2' : 'grid-cols-1';
  const showLote = loteModo === 'lote' || loteModo === 'ambos';
  const showValidade = loteModo === 'fabricacao' || loteModo === 'ambos';
  const hasMaintainedLoteFromConferidos = lotesConferidos.some((entry) =>
    entry.lote?.trim(),
  );
  const maintainedLoteContext = useMemo(
    () =>
      resolveMaintainedLoteContext(
        isPvar && !loteDraftConfirmed && !hasMaintainedLoteFromConferidos
          ? { lote: '', validade: '' }
          : { lote: loteValue, validade: validadeValue },
        lotesConferidos,
        { ignoreExisting: ignoreMaintainedLote },
      ),
    [
      isPvar,
      loteDraftConfirmed,
      hasMaintainedLoteFromConferidos,
      loteValue,
      validadeValue,
      lotesConferidos,
      ignoreMaintainedLote,
    ],
  );
  const showMaintainedLote =
    showLote &&
    isPvar &&
    (hasMaintainedLoteFromConferidos || loteDraftConfirmed) &&
    !!maintainedLoteContext.lote;
  const showLoteInput = showLote && (!isPvar || !showMaintainedLote);
  const effectiveLote = maintainedLoteContext.lote || loteValue;
  const fabricacaoDerivedFromLote = showLote && showValidade;

  const fabricacaoFromLote = useMemo(() => {
    if (!showLote || !canParseFabricacaoFromLote(effectiveLote)) {
      return null;
    }
    return parseFabricacaoFromLote(effectiveLote);
  }, [effectiveLote, showLote]);

  const maintainedFabricacaoDisplay = maintainedLoteContext.validade
    ? formatIsoDateForDisplay(maintainedLoteContext.validade)
    : fabricacaoFromLote?.ok
      ? fabricacaoFromLote.display
      : '';

  const showValidadeInput =
    showValidade && (!isPvar || !maintainedFabricacaoDisplay);

  const fabricacaoDisplay = fabricacaoFromLote?.ok
    ? fabricacaoFromLote.display
    : validadeValue
      ? formatIsoDateForDisplay(validadeValue)
      : maintainedFabricacaoDisplay;

  const fabricacaoIsoDate =
    fabricacaoFromLote?.ok
      ? fabricacaoFromLote.isoDate
      : maintainedLoteContext.validade || null;

  useEffect(() => {
    if (fabricacaoIsoDate) {
      form.setValue('validade', fabricacaoIsoDate, { shouldValidate: true });
      return;
    }

    if (fabricacaoFromLote && !fabricacaoFromLote.ok && loteValue.trim()) {
      form.setValue('validade', '', { shouldValidate: true });
    }
  }, [fabricacaoFromLote, fabricacaoIsoDate, form, loteValue]);

  const dockHeight = step === 1 && controlaPalete ? '64px' : '72px';

  const headerSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (skuValue || item.sku) parts.push(skuValue || item.sku);
    if (conferenteLabel) parts.push(conferenteLabel);
    if (parts.length === 0) return `Etapa ${displayStep} de ${totalSteps}`;
    return parts.join(' · ');
  }, [skuValue, item.sku, conferenteLabel, displayStep, totalSteps]);

  return (
    <div className="page-enter flex min-w-0 flex-col overflow-x-hidden">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-12 items-center gap-2 px-margin-mobile">
          {step > minStep ? (
            <button
              type="button"
              onClick={() => actions.prevStep()}
              aria-label="Voltar para etapa anterior"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/recebimento/$id/checklist"
              params={{ id: demandId }}
              aria-label="Voltar para checklist"
              onClick={() => hapticLight()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className={cn('truncate font-semibold leading-tight', FIELD_TEXT)}>
                Conferência
              </h1>
              {'isNovo' in item && item.isNovo ? (
                <span className={cn('shrink-0 rounded-md bg-surface-container px-1.5 py-0.5 font-medium text-on-surface-variant', FIELD_TEXT)}>
                  Novo
                </span>
              ) : skuValue || item.sku ? (
                <span className={cn('shrink-0 rounded-full bg-secondary-container px-1.5 py-0.5 font-medium text-on-secondary-container', FIELD_TEXT)}>
                  Exp {item.expiry}
                </span>
              ) : null}
            </div>
            <p className={cn('truncate', FIELD_TEXT_MUTED)}>{headerSubtitle}</p>
          </div>
          <TemperaturaProdutoModalButton demandId={demandId} variant="surface" />
          <Link
            to="/recebimento/$id/itens"
            params={{ id: demandId }}
            aria-label="Lista de itens conferidos"
            onClick={() => hapticLight()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-secondary transition-transform active:scale-90 touch-manipulation"
          >
            <ClipboardList className="h-4 w-4" />
          </Link>
        </div>
        <StepIndicator activeStep={displayStep} totalSteps={totalSteps} />
      </div>

      <div
        className="min-w-0 overflow-x-hidden px-margin-mobile pt-3"
        style={{
          paddingBottom: `calc(${dockHeight} + env(safe-area-inset-bottom, 0px) + 12px)`,
        }}
      >
        <div className="mb-3">
          <ChecklistResumoCard {...checklistResumo} defaultOpen={false} />
        </div>

        {controlaPalete && paleteSessionAtivo && paleteSessionCodigo && step >= 2 ? (
          <PaleteSessionBanner codigo={paleteSessionCodigo} />
        ) : null}

        {step === 1 && controlaPalete ? (
          <CompactStepSection
            icon={QrCode}
            title="Iniciar palete"
            subtitle="Escaneie o ID do palete"
          >
            <ScanField
              id="id-palete"
              label="ID do palete"
              icon={QrCode}
              placeholder="P-0000-0000"
              registerProps={actions.register('idPalete')}
              onScanClick={() => actions.openScan('idPalete')}
              error={errors.idPalete?.message}
            />
            {idPaleteValue.trim() ? (
              <p className={cn('mt-2 flex items-center gap-1 font-medium', FIELD_HINT_OK)}>
                <CheckCircle className="h-3.5 w-3.5" aria-hidden />
                Palete identificado
              </p>
            ) : null}
          </CompactStepSection>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <CompactStepSection
              icon={Barcode}
              title="SKU do produto"
              subtitle="Escaneie ou digite o código"
            >
              <ScanField
                id="sku"
                label="SKU"
                icon={Barcode}
                placeholder="Escaneie ou digite o SKU"
                registerProps={actions.register('sku')}
                onScanClick={() => actions.openScan('sku')}
                error={errors.sku?.message}
              />
            </CompactStepSection>

            {skuValue.trim() ? (
              <ProductSummaryBar sku={item.sku} name={item.name} />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            {saveError ? (
              <div
                role="alert"
                className={cn(
                  'flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-2.5 py-2 text-on-error-container',
                  FIELD_TEXT,
                )}
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{saveError}</span>
              </div>
            ) : null}

            <ProductSummaryBar
              sku={item.sku}
              name={item.name}
              palete={idPaleteValue}
              showPalete={controlaPalete}
            />

            <QuantidadeResumoGrid
              showCaixa={showCaixa}
              showUnidade={showUnidade}
              showPeso={produtoConfig.pesoVariavel || produtoConfig.controlaPeso}
              conferidoTotais={conferidoTotais}
              hasLotesConferidos={hasLotesConferidos}
              lotesCount={lotesConferidos.length}
              isPvar={isPvar}
              gridClass={quantidadeGridClass}
            />

            <form
              className="min-w-0 space-y-3 rounded-lg border border-outline-variant bg-surface p-3 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              {showMaintainedLote ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-2">
                  <div className="min-w-0">
                    <span className={cn('block uppercase tracking-wide', FIELD_TEXT_MUTED)}>
                      Lote em uso
                    </span>
                    <span className={cn('font-semibold', FIELD_MONO)}>
                      {maintainedLoteContext.lote}
                    </span>
                    {maintainedFabricacaoDisplay ? (
                      <span className={cn('block', FIELD_TEXT_MUTED)}>
                        Fab. {maintainedFabricacaoDisplay}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn('h-8 shrink-0 px-2.5', FIELD_TEXT)}
                    onClick={() => actions.startLoteChange()}
                  >
                    Alterar
                  </Button>
                </div>
              ) : null}

              {showLoteInput ? (
                isPvar ? (
                  <ScanField
                    id="lote"
                    label="Lote da primeira caixa"
                    icon={Barcode}
                    placeholder="Bipe GS1 do lote ou digite o número"
                    registerProps={loteRegisterProps}
                    inputRef={loteInputRef}
                    error={errors.lote?.message}
                  />
                ) : (
                  <NumericField
                    id="lote"
                    label="Lote (batch)"
                    placeholder="Digite o número do lote"
                    value={loteValue}
                    inputRef={loteInputRef}
                    onChange={(value) =>
                      actions.setValue('lote', value, { shouldValidate: true })
                    }
                    error={errors.lote?.message}
                  />
                )
              ) : null}

              {showValidadeInput ? (
                <FabricacaoField
                  id="validade"
                  value={validadeValue}
                  displayValue={fabricacaoDisplay}
                  derivedFromLote={fabricacaoDerivedFromLote}
                  onChange={(value) =>
                    actions.setValue('validade', value, { shouldValidate: true })
                  }
                  error={errors.validade?.message}
                  hint={
                    fabricacaoDerivedFromLote && fabricacaoFromLote?.ok
                      ? `Calculada a partir do lote: ${fabricacaoFromLote.display}`
                      : undefined
                  }
                  hintError={
                    fabricacaoDerivedFromLote && fabricacaoFromLote && !fabricacaoFromLote.ok
                      ? fabricacaoFromLote.error
                      : undefined
                  }
                />
              ) : null}

              {showCaixa || showUnidade ? (
                <>
                  <p className={cn('font-semibold uppercase tracking-wider', FIELD_TEXT_MUTED)}>
                    Quantidades
                  </p>
                  <div className={cn('grid gap-2', quantidadeGridClass)}>
                    {showCaixa ? (
                      <NumericStepper
                        id="recebida-caixa"
                        label="Recebida caixa"
                        value={recebidaCaixa}
                        onChange={(v) =>
                          actions.setValue('recebidaCaixa', v, { shouldValidate: true })
                        }
                        error={errors.recebidaCaixa?.message}
                      />
                    ) : null}
                    {showUnidade ? (
                      <NumericStepper
                        id="recebida-unidade"
                        label="Recebida unidade"
                        value={recebidaUnidade}
                        onChange={(v) =>
                          actions.setValue('recebidaUnidade', v, { shouldValidate: true })
                        }
                        error={errors.recebidaUnidade?.message}
                      />
                    ) : null}
                  </div>
                </>
              ) : null}

                  {isPvar ? (
                    <div className={cn('rounded-lg border border-outline-variant/40 bg-surface-container-low px-2.5 py-1.5', FIELD_TEXT_MUTED)}>
                      Cada registro = <strong className={FIELD_TEXT}>1 caixa</strong> com peso individual.
                    </div>
                  ) : null}

              {produtoConfig.pesoVariavel || produtoConfig.controlaPeso ? (
                <>
                  {(produtoConfig.pesoVariavel ||
                    produtoConfig.exigirEtiquetaPesoVariavel) && (
                    <ScanField
                      id="etiqueta"
                      label={
                        produtoConfig.exigirEtiquetaPesoVariavel
                          ? 'Etiqueta da caixa'
                          : 'Etiqueta da caixa (opcional)'
                      }
                      icon={Barcode}
                      placeholder="Escaneie ou digite a etiqueta"
                      registerProps={etiquetaRegisterProps}
                      onScanClick={() => actions.openScan('etiqueta')}
                      error={errors.etiqueta?.message}
                    />
                  )}
                  {isPvar ? (
                    <div className="space-y-2">
                      <ScanField
                        id="gs1-wedge"
                        label="Código GS1 (coletor)"
                        icon={ScanLine}
                        placeholder="Bipe o código GS1 aqui"
                        value={gs1WedgeValue}
                        onChange={(event) => actions.setGs1WedgeValue(event.target.value)}
                        inputRef={gs1InputRef}
                        autoFocus
                        onKeyDown={actions.handleGs1WedgeKeyDown}
                      />
                      <NumericStepper
                        id="peso"
                        label="Peso da caixa (kg)"
                        inputMode="decimal"
                        step={0.001}
                        value={peso}
                        onChange={actions.handlePesoInputChange}
                        onKeyDown={(event) => actions.handlePesoKeyDown(event, peso)}
                        error={errors.peso?.message}
                      />
                      <p className={FIELD_TEXT_MUTED}>
                        Bipe o GS1 + Enter: valida peso, adiciona caixa e prepara próxima bipagem.
                      </p>
                    </div>
                  ) : (
                    <NumericStepper
                      id="peso"
                      label="Peso (kg)"
                      inputMode="decimal"
                      step={0.1}
                      value={peso}
                      onChange={(v) =>
                        actions.setValue('peso', v, { shouldValidate: true })
                      }
                      error={errors.peso?.message}
                    />
                  )}
                </>
              ) : null}

              <div className="flex flex-col gap-1.5 border-t border-outline-variant/50 pt-3">
                {saveError ? (
                  <div
                    role="alert"
                    className={cn(
                  'flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-2.5 py-2 text-on-error-container',
                  FIELD_TEXT,
                )}
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>{saveError}</span>
                  </div>
                ) : null}
                <Button
                  type="button"
                  onClick={() => {
                    hapticMedium();
                    void actions.handleAddLote();
                  }}
                  disabled={isSubmitting || isSavingConferencia}
                  className={cn(
                    'flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-secondary text-on-secondary font-semibold shadow-sm touch-manipulation hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-50',
                    FIELD_TEXT,
                  )}
                >
                  {isSubmitting || isSavingConferencia ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Salvando…' : isPvar ? 'Adicionar caixa' : 'Adicionar lote'}
                </Button>
                {controlaPalete ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      hapticMedium();
                      void actions.handleFecharPalete();
                    }}
                    disabled={isSubmitting || isSavingConferencia}
                    className={cn(
                      'flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border-secondary/40 text-secondary touch-manipulation hover:bg-secondary/5 active:scale-[0.98] disabled:opacity-50',
                      FIELD_TEXT,
                    )}
                  >
                    {isSubmitting || isSavingConferencia ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PackageCheck className="h-4 w-4" />
                    )}
                    {isSubmitting || isSavingConferencia ? 'Fechando…' : 'Fechar palete'}
                  </Button>
                ) : null}
                <div className="flex gap-1.5">
                  <AvariaQuickCaptureButton
                    demandId={demandId}
                    sku={skuValue || item?.sku}
                  />
                  <Button
                    asChild
                    variant="outline"
                    className={cn(
                      'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border-outline-variant text-destructive touch-manipulation active:scale-[0.98] hover:bg-destructive/10',
                      FIELD_TEXT,
                    )}
                  >
                    <Link
                      to="/recebimento/$id/avaria"
                      params={{ id: demandId }}
                      onClick={() => {
                        hapticLight();
                        const currentForm = form.getValues();
                        setConferenciaNavigation(demandId, {
                          step,
                          form: currentForm,
                          lotes: lotesConferidos,
                        });
                        setConferenciaEntryStep(demandId, step);
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Avaria
                    </Link>
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-2">
              <CollapsibleRecordCard
                title="Lotes conferidos"
                count={lotesConferidos.length}
                expanded={lotesListExpanded}
                onToggle={actions.toggleLotesListExpanded}
                emptyMessage="Nenhum lote conferido ainda. Preencha os dados acima e adicione o primeiro lote."
              >
                {controlaPalete
                  ? lotesPorPalete.map(([paleteKey, lotesGrupo]) => {
                      const paleteLabel =
                        paleteKey === '__sem_palete__' ? 'Sem palete' : paleteKey;

                      return (
                        <div key={paleteKey} className="space-y-1">
                          <div className="flex items-center justify-between gap-2 px-0.5 pt-0.5">
                            <p className={cn('truncate font-semibold', FIELD_TEXT_MUTED)}>
                              Palete {paleteLabel}
                            </p>
                            {paleteKey !== '__sem_palete__' ? (
                              <button
                                type="button"
                                onClick={() => void actions.removePalete(paleteKey)}
                                className={cn(
                                  'shrink-0 font-medium text-destructive touch-manipulation active:opacity-70',
                                  FIELD_TEXT,
                                )}
                              >
                                Excluir palete
                              </button>
                            ) : null}
                          </div>
                          {lotesGrupo.map((lote) => (
                            <RecordListItem
                              key={lote.id}
                              onRemove={() => void actions.removeLote(lote.id)}
                              removeLabel={`Excluir lote ${lote.lote || lote.validade || ''}`}
                            >
                              <p className={cn('truncate font-semibold', FIELD_MONO)}>
                                {lote.lote || lote.validade || '—'}
                              </p>
                              <p className={cn('leading-snug', FIELD_TEXT_MUTED)}>
                                {[
                                  showCaixa && lote.recebidaCaixa > 0
                                    ? `${lote.recebidaCaixa} cx`
                                    : null,
                                  showUnidade && lote.recebidaUnidade > 0
                                    ? `${lote.recebidaUnidade} un`
                                    : null,
                                  (produtoConfig.pesoVariavel ||
                                    produtoConfig.controlaPeso) &&
                                  lote.peso
                                    ? `${lote.peso} kg`
                                    : null,
                                  lote.etiquetaCodigo
                                    ? `Etq. ${lote.etiquetaCodigo}`
                                    : null,
                                  showValidade && lote.validade
                                    ? `Fab. ${formatIsoDateForDisplay(lote.validade)}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </RecordListItem>
                          ))}
                        </div>
                      );
                    })
                  : lotesConferidos.map((lote) => (
                      <RecordListItem
                        key={lote.id}
                        onRemove={() => void actions.removeLote(lote.id)}
                        removeLabel={`Excluir lote ${lote.lote || lote.validade || ''}`}
                      >
                        <p className={cn('truncate font-semibold', FIELD_MONO)}>
                          {lote.lote || lote.validade || '—'}
                        </p>
                        <p className={cn('leading-snug', FIELD_TEXT_MUTED)}>
                          {[
                            showCaixa && lote.recebidaCaixa > 0
                              ? `${lote.recebidaCaixa} cx`
                              : null,
                            showUnidade && lote.recebidaUnidade > 0
                              ? `${lote.recebidaUnidade} un`
                              : null,
                            (produtoConfig.pesoVariavel || produtoConfig.controlaPeso) &&
                            lote.peso
                              ? `${lote.peso} kg`
                              : null,
                            lote.etiquetaCodigo
                              ? `Etq. ${lote.etiquetaCodigo}`
                              : null,
                            showValidade && lote.validade
                              ? `Fab. ${formatIsoDateForDisplay(lote.validade)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </RecordListItem>
                    ))}
              </CollapsibleRecordCard>
              <CollapsibleRecordCard
                title="Avarias registradas"
                count={avarias.avariasRegistradas.length}
                expanded={avarias.avariasListExpanded}
                onToggle={avarias.toggleAvariasListExpanded}
                emptyMessage="Nenhuma avaria registrada. Use o botão acima para registrar uma exceção."
                accent="warning"
              >
                {avarias.avariasRegistradas.map((avaria) => {
                  const labels = avarias.getAvariaLabels(avaria);

                  return (
                    <RecordListItem
                      key={avaria.id}
                      accent="warning"
                      onRemove={() => avarias.removeAvaria(avaria.id)}
                      removeLabel="Excluir registro de avaria"
                    >
                      <p className={cn('truncate font-semibold', FIELD_TEXT)}>
                        {labels.tipo}
                      </p>
                      <p className={cn('leading-snug', FIELD_TEXT_MUTED)}>
                        {avaria.quantidadeCaixa} cx · {avaria.quantidadeUnidade} un
                      </p>
                      <p className={cn('truncate leading-snug', FIELD_TEXT_MUTED)}>
                        {labels.natureza} · {labels.causa}
                        {avaria.lote ? ` · Lote ${avaria.lote}` : ''}
                        {avaria.photoCount > 0
                          ? ` · ${avaria.photoCount} ${avaria.photoCount === 1 ? 'foto' : 'fotos'}`
                          : ''}
                        {avaria.replicado ? ' · replicado' : ''}
                      </p>
                    </RecordListItem>
                  );
                })}
              </CollapsibleRecordCard>
            </div>
          </div>
        ) : null}
      </div>

      <WizardBottomDock
        step={step}
        canAdvanceStep1={canAdvanceStep1}
        canAdvanceStep2={canAdvanceStep2}
        canSaveConferencia={canSaveConferencia}
        canRemoverConferencia={canRemoverConferencia}
        isSavingConferencia={isSavingConferencia || isSubmitting}
        onNext={actions.nextStep}
        onPrev={actions.prevStep}
        onSave={() => void actions.handleSaveConferencia()}
      />

      <QrScannerModal
        open={scanOpen}
        onOpenChange={actions.handleScanOpenChange}
        title={scanTitle}
        onScan={actions.handleScanResult}
      />
    </div>
  );
}
