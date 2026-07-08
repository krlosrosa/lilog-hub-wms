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

import { QrScannerModal } from '@/components/qr-scanner';

import { AvariaQuickCaptureButton } from '../components/avaria-quick-capture-button';
import { ChecklistResumoCard } from '../components/checklist-resumo-card';
import { PaleteSessionBanner } from '../components/palete-conferencia-cards';
import { setConferenciaNavigation } from '../lib/conferencia-conferidos-store';
import { resolveMaintainedLoteContext } from '../lib/conferencia-form';
import { setConferenciaEntryStep } from '../lib/conferencia-sku-session';
import {
  canParseFabricacaoFromLote,
  parseFabricacaoFromLote,
} from '../lib/parse-fabricacao-from-lote';
import { useAvariasRegistradas } from '../hooks/use-avarias-registradas';
import { useChecklistResumo } from '../hooks/use-checklist-resumo';
import { useDetalheItem } from '../hooks/use-detalhe-item';
import type { ConferenciaStep } from '../hooks/use-detalhe-item';
import {
  CollapsibleRecordCard,
  RecordListItem,
} from '../components/expandable-record-list';

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
    <div className="flex items-center gap-2 border-b border-outline-variant/50 px-margin-mobile py-3">
      {Array.from({ length: totalSteps }, (_, index) => index + 1).map((n) => (
        <div
          key={n}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            n === activeStep
              ? 'w-8 bg-secondary'
              : n < activeStep
                ? 'w-4 bg-secondary/40'
                : 'w-4 bg-surface-container',
          )}
          aria-hidden
        />
      ))}
      <span className="ml-auto text-label-sm text-on-surface-variant">
        Etapa {activeStep} de {totalSteps}
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
    <div className="space-y-1.5">
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
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
          className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-12 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
        />
        {onScanClick ? (
          <button
            type="button"
            aria-label={`Escanear ${label}`}
            onClick={onScanClick}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-transform active:scale-90 active:bg-surface-container-high touch-manipulation"
          >
            <ScanLine className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
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
    <div className="space-y-1.5">
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
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
          className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-4 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
        />
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
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
    <div className="min-w-0 space-y-1.5">
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        Fabricação
      </label>
      <div className="relative min-w-0">
        <Calendar
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
          aria-hidden
        />
        {derivedFromLote ? (
          <div
            id={id}
            role="textbox"
            aria-readonly="true"
            className={cn(
              'flex h-12 w-full min-w-0 items-center rounded-lg border border-outline-variant bg-surface-container-low pl-12 pr-4 font-mono text-body-md',
              displayValue ? 'text-on-surface' : 'text-on-surface-variant',
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
            className="date-input-mobile h-12 w-full min-w-0 max-w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-3 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
          />
        )}
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
      {hint ? (
        <p className="flex items-start gap-1.5 text-label-sm text-secondary">
          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{hint}</span>
        </p>
      ) : null}
      {hintError ? (
        <p className="min-w-0 break-words text-label-sm text-destructive">{hintError}</p>
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
    <div className="space-y-1.5">
      {label ? (
        <label className="text-label-md text-on-surface-variant" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex h-11 w-11 items-center justify-center rounded-l-lg text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          pattern={inputMode === 'decimal' ? undefined : '[0-9]*'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="numeric-input h-11 w-full min-w-0 flex-1 bg-transparent text-center font-mono text-headline-md font-semibold text-on-surface outline-none"
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex h-11 w-11 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function StepHeroCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof QrCode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface p-5 shadow-sm">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container">
          <Icon className="h-8 w-8 text-secondary" />
        </div>
        <h2 className="text-headline-md font-semibold text-on-surface">{title}</h2>
        <p className="mt-1 text-body-sm text-on-surface-variant">{subtitle}</p>
      </div>
      {children}
    </article>
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
      <div className="pointer-events-auto flex gap-2 px-margin-mobile pt-3">
        {step === 1 ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canAdvanceStep1}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
              canAdvanceStep1
                ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            Próximo
            <ArrowRight className="h-5 w-5" />
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
              <ChevronLeft className="h-5 w-5" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={!canAdvanceStep2}
              className={cn(
                'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
                canAdvanceStep2
                  ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              Próximo
              <ArrowRight className="h-5 w-5" />
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
              <ChevronLeft className="h-5 w-5" />
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
                'flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
                canSaveConferencia
                  ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                  : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              {isSavingConferencia ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando…
                </>
              ) : canRemoverConferencia ? (
                <>
                  <PackageCheck className="h-5 w-5" />
                  Remover conferência
                </>
              ) : (
                <>
                  <PackageCheck className="h-5 w-5" />
                  Salvar conferência
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
  const { state, actions } = useDetalheItem(demandId, initKey);
  const avarias = useAvariasRegistradas(demandId);
  const checklistResumo = useChecklistResumo(demandId);

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
  } = state;

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
  const etiquetaValue = form.watch('etiqueta') ?? '';
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
  const maintainedLoteContext = useMemo(
    () =>
      resolveMaintainedLoteContext(
        { lote: loteValue, validade: validadeValue },
        lotesConferidos,
        { ignoreExisting: ignoreMaintainedLote },
      ),
    [loteValue, validadeValue, lotesConferidos, ignoreMaintainedLote],
  );
  const showLoteInput = showLote && (!isPvar || !maintainedLoteContext.lote);
  const showMaintainedLote = showLote && isPvar && !!maintainedLoteContext.lote;
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

  const dockHeight = step === 1 && controlaPalete ? '72px' : '80px';

  return (
    <div className="page-enter flex min-w-0 flex-col overflow-x-hidden">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          {step > minStep ? (
            <button
              type="button"
              onClick={() => actions.prevStep()}
              aria-label="Voltar para etapa anterior"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/recebimento/$id/checklist"
              params={{ id: demandId }}
              aria-label="Voltar para checklist"
              onClick={() => hapticLight()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold text-on-surface leading-tight">
              Conferência cega
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {skuValue || item.sku || `Etapa ${displayStep} de ${totalSteps}`}
            </p>
          </div>
          <Link
            to="/recebimento/$id/itens"
            params={{ id: demandId }}
            aria-label="Lista de itens conferidos"
            onClick={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-secondary transition-transform active:scale-90 touch-manipulation"
          >
            <ClipboardList className="h-5 w-5" />
          </Link>
          {'isNovo' in item && item.isNovo ? (
            <span className="shrink-0 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
              Item novo
            </span>
          ) : skuValue || item.sku ? (
            <span className="shrink-0 rounded-full bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-container">
              Exp {item.expiry}
            </span>
          ) : null}
        </div>
        <StepIndicator activeStep={displayStep} totalSteps={totalSteps} />
      </div>

      <div
        className="min-w-0 overflow-x-hidden px-margin-mobile pt-4"
        style={{
          paddingBottom: `calc(${dockHeight} + env(safe-area-inset-bottom, 0px) + 16px)`,
        }}
      >
        <div className="mb-4">
          <ChecklistResumoCard {...checklistResumo} defaultOpen={false} />
        </div>

        {controlaPalete && paleteSessionAtivo && paleteSessionCodigo && step >= 2 ? (
          <PaleteSessionBanner codigo={paleteSessionCodigo} />
        ) : null}

        {step === 1 && controlaPalete ? (
          <StepHeroCard
            icon={QrCode}
            title="Iniciar palete"
            subtitle="Escaneie o ID do palete. Depois de conferir os lotes, use &quot;Fechar palete&quot; para salvar e informar o próximo."
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
              <p className="mt-4 flex items-center justify-center gap-1.5 text-label-sm font-medium text-secondary">
                <CheckCircle className="h-4 w-4" aria-hidden />
                Palete identificado
              </p>
            ) : null}
          </StepHeroCard>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <StepHeroCard
              icon={Barcode}
              title="SKU do Produto"
              subtitle="Confirme ou escaneie o código do produto"
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
            </StepHeroCard>

            {skuValue.trim() ? (
              <article className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                    <Package className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-label-md font-bold text-primary">{item.sku}</p>
                    <p className="line-clamp-2 text-body-sm text-on-surface">{item.name}</p>
                    <p className="mt-0.5 truncate text-label-sm text-on-surface-variant">
                      {item.supplier}
                    </p>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            {saveError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2.5 text-body-sm text-on-error-container"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{saveError}</span>
              </div>
            ) : null}

            <article className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                  <Package className="h-6 w-6 text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-label-md font-bold text-primary">{item.sku}</p>
                  <p className="line-clamp-2 text-body-sm font-semibold text-on-surface">{item.name}</p>
                  {controlaPalete ? (
                    <p className="mt-1 truncate font-mono text-label-sm text-on-surface-variant">
                      Palete {idPaleteValue || '—'}
                    </p>
                  ) : null}
                </div>
              </div>
              <div
                className={cn(
                  'mt-3 rounded-lg border p-3',
                  hasLotesConferidos
                    ? 'border-secondary/30 bg-secondary/5'
                    : 'border-outline-variant/80 bg-surface-container-low'
                )}
              >
                <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Quantidades informadas
                </p>
                <div className={cn('grid gap-2', quantidadeGridClass)}>
                  {showCaixa ? (
                    <div className="rounded-lg bg-surface px-3 py-2.5 text-center">
                      <span className="block text-label-sm text-on-surface-variant">Caixa</span>
                      <span
                        className={cn(
                          'font-mono text-headline-md font-semibold',
                          conferidoTotais.caixa > 0 ? 'text-on-surface' : 'text-on-surface-variant',
                        )}
                      >
                        {conferidoTotais.caixa > 0 ? conferidoTotais.caixa : '—'}
                      </span>
                    </div>
                  ) : null}
                  {showUnidade ? (
                    <div className="rounded-lg bg-surface px-3 py-2.5 text-center">
                      <span className="block text-label-sm text-on-surface-variant">Unidade</span>
                      <span
                        className={cn(
                          'font-mono text-headline-md font-semibold',
                          conferidoTotais.unidade > 0 ? 'text-on-surface' : 'text-on-surface-variant',
                        )}
                      >
                        {conferidoTotais.unidade > 0 ? conferidoTotais.unidade : '—'}
                      </span>
                    </div>
                  ) : null}
                  {produtoConfig.pesoVariavel || produtoConfig.controlaPeso ? (
                    <div className="rounded-lg bg-surface px-3 py-2.5 text-center">
                      <span className="block text-label-sm text-on-surface-variant">Peso total (kg)</span>
                      <span
                        className={cn(
                          'font-mono text-headline-md font-semibold',
                          conferidoTotais.peso > 0 ? 'text-on-surface' : 'text-on-surface-variant',
                        )}
                      >
                        {conferidoTotais.peso > 0
                          ? conferidoTotais.peso.toFixed(3)
                          : '—'}
                      </span>
                    </div>
                  ) : null}
                </div>
                {hasLotesConferidos ? (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-label-sm font-medium text-secondary">
                    <CheckCircle className="h-4 w-4" aria-hidden />
                    {lotesConferidos.length}{' '}
                    {isPvar
                      ? lotesConferidos.length === 1
                        ? 'caixa conferida'
                        : 'caixas conferidas'
                      : lotesConferidos.length === 1
                        ? 'lote conferido'
                        : 'lotes conferidos'}
                  </p>
                ) : null}
              </div>
            </article>

            <form
              className="min-w-0 space-y-4 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              {showMaintainedLote ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2.5">
                  <div>
                    <span className="block text-label-sm text-on-surface-variant">
                      Lote em uso
                    </span>
                    <span className="font-mono text-body-md font-semibold text-on-surface">
                      {maintainedLoteContext.lote}
                    </span>
                    {maintainedFabricacaoDisplay ? (
                      <span className="mt-1 block text-label-sm text-on-surface-variant">
                        Fabricação: {maintainedFabricacaoDisplay}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                  <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                    Quantidades
                  </h3>
                  <div className={cn('grid gap-3', quantidadeGridClass)}>
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
                    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
                      Cada registro representa <strong>1 caixa</strong> com seu peso individual.
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
                    <div className="space-y-3">
                      <ScanField
                        id="gs1-wedge"
                        label="Código GS1 (coletor/leitor)"
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
                      <p className="text-label-sm text-on-surface-variant">
                        Bipe o código GS1 e pressione Enter: o peso é validado, a caixa entra na
                        lista e o campo fica pronto para a próxima bipagem.
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

              <div className="flex flex-col gap-2 border-t border-outline-variant/50 pt-4">
                {saveError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2.5 text-body-sm text-on-error-container"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
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
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-on-secondary text-headline-md shadow-md touch-manipulation hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting || isSavingConferencia ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  {isSubmitting ? 'Salvando lote...' : isPvar ? 'Adicionar caixa conferida' : 'Adicionar lote conferido'}
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
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-secondary/40 text-secondary touch-manipulation hover:bg-secondary/5 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting || isSavingConferencia ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <PackageCheck className="h-5 w-5" />
                    )}
                    {isSubmitting || isSavingConferencia ? 'Fechando palete...' : 'Fechar palete'}
                  </Button>
                ) : null}
                <div className="flex gap-2">
                  <AvariaQuickCaptureButton
                    demandId={demandId}
                    sku={skuValue || item?.sku}
                  />
                  <Button
                    asChild
                    variant="outline"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border-outline-variant text-destructive touch-manipulation active:scale-[0.98] hover:bg-destructive/10"
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
                      <AlertTriangle className="h-5 w-5" />
                      Registrar avaria
                    </Link>
                  </Button>
                </div>
              </div>
            </form>

            <div className="space-y-3">
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
                        <div key={paleteKey} className="space-y-2">
                          <div className="flex items-center justify-between gap-2 px-1">
                            <p className="truncate font-mono text-label-sm font-semibold text-on-surface-variant">
                              Palete {paleteLabel}
                            </p>
                            {paleteKey !== '__sem_palete__' ? (
                              <button
                                type="button"
                                onClick={() => void actions.removePalete(paleteKey)}
                                className="shrink-0 text-label-sm font-medium text-destructive touch-manipulation active:opacity-70"
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
                              <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                                {lote.lote || lote.validade || '—'}
                              </p>
                              <p className="text-label-sm text-on-surface-variant">
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
                        <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                          {lote.lote || lote.validade || '—'}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
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
                      <p className="truncate text-label-md font-semibold text-on-surface">
                        {labels.tipo}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {avaria.quantidadeCaixa} cx · {avaria.quantidadeUnidade} un
                      </p>
                      <p className="truncate text-label-sm text-on-surface-variant">
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
