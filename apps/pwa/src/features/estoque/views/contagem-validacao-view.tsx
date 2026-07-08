import { Button, cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Flag,
  Info,
  Loader2,
  MapPin,
  Minus,
  Package,
  PackageOpen,
  Plus,
  ScanLine,
  Verified,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  ContagemAvariaEnderecoBadge,
  ContagemAvariaEnderecoCard,
} from '../components/contagem-avaria-endereco-card';
import { ContagemEnderecoList } from '../components/contagem-endereco-list';
import { useContagemEnderecosComAvaria } from '../hooks/use-contagem-avarias-endereco';
import { useContagemEnderecos } from '../hooks/use-contagem-enderecos';
import { SEED_INVENTORY_DEMANDS } from '../data/contagem-seed';
import {
  quantidadeContadaDivergeDoEsperado,
} from '../lib/calcular-quantidade-contagem';
import {
  ENDERECO_DIVERGENTE_MSG,
  enderecosConferem,
} from '../lib/contagem-endereco-match';
import {
  useContagemValidacao,
} from '../hooks/use-contagem-validacao';
import type { ContagemValidacaoToast } from '../hooks/use-contagem-validacao';
import type { ContagemValidacaoForm } from '../types/estoque.schema';

interface ContagemValidacaoViewProps {
  demandaId: string;
}

function calcularProgressoValidacao(enderecos: { status: string }[]) {
  const total = enderecos.length;
  const validated = enderecos.filter((item) => item.status === 'conferido').length;
  const percent = total > 0 ? Math.round((validated / total) * 100) : 0;
  const pending = Math.max(0, total - validated);

  return { total, validated, percent, pending };
}

function StepIndicator({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Endereço' },
    { n: 2, label: 'Validação' },
  ] as const;

  return (
    <div className="flex items-center gap-1 px-margin-mobile pb-3" aria-label="Progresso do fluxo">
      {steps.map((step, index) => {
        const done = step.n < currentStep;
        const active = step.n === currentStep;
        return (
          <div key={step.n} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm font-bold transition-colors',
                  done && 'bg-secondary text-on-secondary',
                  active && !done && 'bg-secondary-container text-on-secondary-container ring-2 ring-secondary/30',
                  !done && !active && 'bg-surface-container text-on-surface-variant'
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : step.n}
              </span>
              <span
                className={cn(
                  'truncate text-[10px] font-medium uppercase tracking-wide',
                  active ? 'text-secondary' : 'text-on-surface-variant'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mb-4 h-0.5 min-w-[8px] flex-1 rounded-full',
                  step.n < currentStep ? 'bg-secondary' : 'bg-outline-variant/60'
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContagemValidacaoToastPortal({
  toast,
  dockVisible,
}: {
  toast: ContagemValidacaoToast | null;
  dockVisible: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-6 py-3 shadow-xl transition-opacity duration-300',
        dockVisible
          ? 'bottom-[calc(148px+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(24px+env(safe-area-inset-bottom,0px))]',
        toast ? 'opacity-100' : 'opacity-0',
        toast?.variant === 'error'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary-container text-inverse-primary'
      )}
    >
      {toast?.variant === 'success' ? (
        <Verified className="h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
      )}
      <span className="truncate text-label-md font-semibold">
        {toast?.message ?? ''}
      </span>
    </div>,
    document.body
  );
}

function EnderecoScanField({
  id,
  label,
  placeholder,
  registerProps,
  isValid,
  hasMismatch = false,
  onScanClick,
  onEnter,
  canSubmitOnEnter = false,
  enterKeyHint = 'go',
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  registerProps: UseFormRegisterReturn<'enderecoConfirmado'>;
  isValid: boolean;
  hasMismatch?: boolean;
  onScanClick: () => void;
  onEnter?: () => void;
  canSubmitOnEnter?: boolean;
  enterKeyHint?: 'done' | 'go' | 'next' | 'search';
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-md text-on-surface-variant">
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-lg border bg-surface-bright transition-colors',
          isValid
            ? 'border-secondary/50 ring-1 ring-secondary/20'
            : hasMismatch
              ? 'border-destructive/60 ring-1 ring-destructive/25'
              : 'border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary'
        )}
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint={enterKeyHint}
          aria-invalid={hasMismatch || Boolean(error)}
          className="h-12 flex-1 bg-transparent pl-4 pr-[4.5rem] font-mono text-base text-on-surface outline-none"
          {...registerProps}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canSubmitOnEnter && onEnter) {
              e.preventDefault();
              hapticMedium();
              onEnter();
            }
          }}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {hasMismatch && (
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
          )}
          {isValid && !hasMismatch && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onScanClick();
            }}
            aria-label={`Escanear ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary touch-manipulation"
          >
            <ScanLine className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function SsccScanField({
  id,
  placeholder,
  registerProps,
  isValid,
  onScanClick,
  error,
}: {
  id: string;
  placeholder: string;
  registerProps: UseFormRegisterReturn<'sscc'>;
  isValid: boolean;
  onScanClick: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-md text-on-surface-variant">
        SSCC do palete
      </label>
      <div
        className={cn(
          'relative flex items-center rounded-lg border bg-surface-bright transition-colors',
          isValid
            ? 'border-secondary/50 ring-1 ring-secondary/20'
            : 'border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary'
        )}
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          inputMode="numeric"
          className="h-12 flex-1 bg-transparent pl-4 pr-[4.5rem] font-mono text-base text-on-surface outline-none"
          {...registerProps}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isValid && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
          )}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              onScanClick();
            }}
            aria-label="Escanear SSCC do palete"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary transition-transform active:scale-90 touch-manipulation"
          >
            <ScanLine className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function NumericStepper({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
  error?: string;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;

  function adjust(delta: number) {
    hapticLight();
    onChange(Math.max(0, safeValue + delta));
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-md text-on-surface-variant">
        {label}
      </label>
      <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={safeValue <= 0}
          aria-label={`Diminuir ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-l-lg text-on-surface-variant transition-colors active:bg-surface-container-high disabled:opacity-40 touch-manipulation"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeValue}
          onChange={(e) => {
            const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10);
            onChange(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
          }}
          className="numeric-input h-11 min-w-0 flex-1 bg-transparent text-center font-mono text-headline-md font-semibold text-on-surface outline-none"
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          aria-label={`Aumentar ${label}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors active:bg-surface-container-high touch-manipulation"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function DivergenceTextField({
  id,
  label,
  type = 'text',
  step,
  placeholder,
  registerProps,
  error,
}: {
  id: string;
  label: string;
  type?: 'text' | 'number';
  step?: string;
  placeholder: string;
  registerProps: UseFormRegisterReturn<keyof ContagemValidacaoForm>;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-md text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        type={type}
        step={step}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 font-mono text-data-mono font-semibold text-on-surface outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/30"
        {...registerProps}
      />
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function ContagemValidacaoStep1Dock({
  canConfirm,
  onConfirmarEndereco,
}: {
  canConfirm: boolean;
  onConfirmarEndereco: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-margin-mobile pb-safe">
      <div className="pointer-events-auto mx-auto w-full max-w-lg rounded-t-2xl border border-b-0 border-outline-variant bg-surface/95 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            onConfirmarEndereco();
          }}
          disabled={!canConfirm}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation',
            canConfirm
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          <MapPin className="h-5 w-5" aria-hidden />
          Confirmar endereço
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ContagemValidacaoBottomDock({
  enderecoVazio,
  anomaliaEncontrada,
  isSubmitting,
  matchConfirmed,
  canValidate,
  canConfirmEmpty,
  canConfirmAnomalia,
  hasDivergenceInput,
  onEnderecoVazio,
  onAnomalia,
  onCorresponde,
  onCorrigir,
  onRegistrarAvaria,
}: {
  enderecoVazio: boolean;
  anomaliaEncontrada: boolean;
  isSubmitting: boolean;
  matchConfirmed: boolean;
  canValidate: boolean;
  canConfirmEmpty: boolean;
  canConfirmAnomalia: boolean;
  hasDivergenceInput: boolean;
  onEnderecoVazio: () => void;
  onAnomalia: () => void;
  onCorresponde: () => void;
  onCorrigir: () => void;
  onRegistrarAvaria: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-margin-mobile pb-safe">
      <div className="pointer-events-auto mx-auto w-full max-w-lg space-y-2 rounded-t-2xl border border-b-0 border-outline-variant bg-surface/95 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        {enderecoVazio ? (
          <Button
            type="button"
            onClick={() => {
              hapticMedium();
              void onEnderecoVazio();
            }}
            disabled={!canConfirmEmpty || isSubmitting}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
              canConfirmEmpty
                ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Registrando...
              </>
            ) : (
              <>
                <PackageOpen className="h-5 w-5" aria-hidden />
                Confirmar endereço vazio
              </>
            )}
          </Button>
        ) : anomaliaEncontrada ? (
          <Button
            type="button"
            onClick={() => {
              hapticMedium();
              void onAnomalia();
            }}
            disabled={!canConfirmAnomalia || isSubmitting}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
              canConfirmAnomalia
                ? 'bg-warning text-on-warning hover:bg-warning/90'
                : 'bg-surface-container-high text-on-surface-variant'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Registrando...
              </>
            ) : (
              <>
                <Flag className="h-5 w-5" aria-hidden />
                Confirmar anomalia para revisão
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={() => {
                hapticMedium();
                void onCorresponde();
              }}
              disabled={!canValidate || isSubmitting || matchConfirmed}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
                matchConfirmed
                  ? 'bg-secondary-container text-on-secondary-container'
                  : canValidate
                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                    : 'bg-surface-container-high text-on-surface-variant'
              )}
            >
              {matchConfirmed ? (
                <>
                  <Verified className="h-5 w-5" aria-hidden />
                  Validado
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                  Corresponde ao esperado
                </>
              )}
            </Button>
            {hasDivergenceInput && (
              <Button
                type="button"
                onClick={() => {
                  hapticMedium();
                  void onCorrigir();
                }}
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-label-md font-semibold touch-manipulation active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Salvando...
                  </>
                ) : (
                  'Registrar divergência'
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                hapticLight();
                onRegistrarAvaria();
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-destructive/30 bg-transparent text-destructive touch-manipulation active:scale-[0.98] active:bg-destructive/5"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Registrar avaria no endereço
            </Button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function findInitialEnderecoIndex(enderecos: { status: string }[]) {
  const emAndamento = enderecos.findIndex((e) => e.status === 'em_andamento');
  if (emAndamento >= 0) return emAndamento;
  const pendente = enderecos.findIndex((e) => e.status === 'pendente');
  return pendente >= 0 ? pendente : 0;
}

export function ContagemValidacaoView({ demandaId }: ContagemValidacaoViewProps) {
  const navigate = useNavigate();

  const { enderecos, refresh: refreshEnderecos } = useContagemEnderecos(demandaId);

  const [flowStep, setFlowStep] = useState<1 | 2>(1);
  const [enderecoIndex, setEnderecoIndex] = useState(0);
  const [divergenceExpanded, setDivergenceExpanded] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [scanEnderecoOpen, setScanEnderecoOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  const activeEndereco =
    enderecos[enderecoIndex]?.endereco ?? '';
  const activeEnderecoItemId = enderecos[enderecoIndex]?.id ?? '';
  const activeSaldoEsperado = enderecos[enderecoIndex]?.saldoEsperado ?? [];

  useEffect(() => {
    if (enderecos.length === 0) return;
    setEnderecoIndex(findInitialEnderecoIndex(enderecos));
  }, [enderecos]);

  const advanceToNextEndereco = useCallback(() => {
    void refreshEnderecos();
    const nextIndex = enderecos.findIndex(
      (e, i) =>
        i > enderecoIndex &&
        (e.status === 'pendente' || e.status === 'em_andamento')
    );
    if (nextIndex >= 0) {
      setEnderecoIndex(nextIndex);
      setFlowStep(1);
      setDivergenceExpanded(false);
      return;
    }
    void navigate({ to: '/estoque/contagem' });
  }, [enderecos, enderecoIndex, navigate, refreshEnderecos]);

  const { state, actions } = useContagemValidacao({
    onComplete: advanceToNextEndereco,
    demandaId,
    demandaEnderecoId: activeEnderecoItemId,
    endereco: activeEndereco,
    saldoEsperado: activeSaldoEsperado,
  });
  const { produto, form, isSubmitting, matchConfirmed, toast, temSaldoEsperado } =
    state;
  const { register, watch, setValue, formState, setFocus } = form;

  useEffect(() => {
    if (showAddressList || flowStep !== 1) return;

    const timer = window.setTimeout(() => {
      setFocus('enderecoConfirmado');
    }, 80);

    return () => window.clearTimeout(timer);
  }, [flowStep, showAddressList, enderecoIndex, setFocus]);

  const enderecoConfirmado = watch('enderecoConfirmado');
  const sscc = watch('sscc');
  const enderecoVazio = watch('enderecoVazio');
  const anomaliaEncontrada = watch('anomaliaEncontrada');
  const quantidadeCaixas = watch('quantidadeCaixas');
  const quantidadeUnidades = watch('quantidadeUnidades');

  const demand = useMemo(
    () => SEED_INVENTORY_DEMANDS.find((d) => d.routeId === demandaId),
    [demandaId]
  );

  const progress = calcularProgressoValidacao(enderecos);
  const percent = progress.percent;
  const pending = progress.pending;

  const isSsccValid = Boolean(sscc?.trim());

  const unidadesPorCaixa = activeSaldoEsperado[0]?.unidadesPorCaixa ?? null;

  const hasDivergenceDraft =
    isSsccValid ||
    (Number(quantidadeCaixas) || 0) > 0 ||
    (Number(quantidadeUnidades) || 0) > 0 ||
    Boolean(watch('lote')?.trim()) ||
    Number(watch('peso')) > 0;

  const qtyDivergeDoEsperado = quantidadeContadaDivergeDoEsperado(
    Number(quantidadeCaixas) || 0,
    Number(quantidadeUnidades) || 0,
    produto.quantidadeEsperada,
    unidadesPorCaixa,
  );

  const hasDivergenceInput =
    qtyDivergeDoEsperado ||
    (isSsccValid &&
      ((Number(quantidadeCaixas) || 0) > 0 ||
        (Number(quantidadeUnidades) || 0) > 0 ||
        Boolean(watch('lote')?.trim()) ||
        Number(watch('peso')) > 0));

  const enderecoInformado = enderecoConfirmado?.trim() ?? '';
  const enderecoConfere = enderecosConferem(enderecoInformado, activeEndereco);
  const enderecoDivergente =
    Boolean(enderecoInformado) && !enderecoConfere;
  const canConfirmStep1 = enderecoConfere;
  const enderecoStepError = enderecoDivergente
    ? ENDERECO_DIVERGENTE_MSG
    : formState.errors.enderecoConfirmado?.message;
  const enderecoAtivo =
    flowStep >= 2 && enderecoConfere
      ? enderecoInformado
      : activeEndereco;

  const canValidate =
    !enderecoVazio &&
    !anomaliaEncontrada &&
    temSaldoEsperado &&
    !qtyDivergeDoEsperado;
  const canConfirmEmpty = enderecoVazio;
  const canConfirmAnomalia = anomaliaEncontrada;
  const showDock = !showAddressList;

  const enderecosComAvaria = useContagemEnderecosComAvaria(demandaId);

  function toggleAddressList() {
    hapticLight();
    setShowAddressList((prev) => !prev);
  }

  function handleSelectEndereco(endereco: string) {
    const index = enderecos.findIndex((e) => e.endereco === endereco);
    if (index >= 0) {
      setEnderecoIndex(index);
      setFlowStep(1);
      setDivergenceExpanded(false);
      form.reset();
    }
    setShowAddressList(false);
  }

  function handleConfirmarEnderecoStep() {
    if (!enderecosConferem(enderecoInformado, activeEndereco)) {
      hapticMedium();
      return;
    }
    setFlowStep(2);
  }

  function clearDivergenceFields() {
    setValue('sscc', '', { shouldDirty: true });
    setValue('quantidadeCaixas', 0, { shouldDirty: true });
    setValue('quantidadeUnidades', 0, { shouldDirty: true });
    setValue('lote', '', { shouldDirty: true });
    setValue('peso', undefined, { shouldDirty: true });
    setDivergenceExpanded(false);
  }

  function handleToggleEnderecoVazio() {
    hapticLight();
    const next = !enderecoVazio;
    setValue('enderecoVazio', next, { shouldDirty: true });
    if (next) {
      setValue('anomaliaEncontrada', false, { shouldDirty: true });
      clearDivergenceFields();
    }
  }

  function handleToggleAnomalia() {
    hapticLight();
    const next = !anomaliaEncontrada;
    setValue('anomaliaEncontrada', next, { shouldDirty: true });
    if (next) {
      setValue('enderecoVazio', false, { shouldDirty: true });
      clearDivergenceFields();
    }
  }

  function handleScanEndereco(value: string) {
    setValue('enderecoConfirmado', value, { shouldValidate: true, shouldDirty: true });
    setScanEnderecoOpen(false);
  }

  function handleScanSscc(value: string) {
    setValue('sscc', value, { shouldValidate: true, shouldDirty: true });
    setScanOpen(false);
  }

  function handleRegistrarAvaria() {
    hapticLight();
    void navigate({
      to: '/estoque/contagem/$id/validacao/avaria',
      params: { id: demandaId },
      search: {
        endereco: enderecoAtivo,
        itemId: activeEnderecoItemId || undefined,
      },
    });
  }

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/estoque/contagem"
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              {showAddressList ? 'Endereços da demanda' : 'Validação de estoque'}
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              #{demandaId}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAddressList}
            aria-label={
              showAddressList
                ? 'Voltar para validação'
                : 'Ver lista de endereços'
            }
            aria-pressed={showAddressList}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform touch-manipulation active:scale-90',
              showAddressList
                ? 'bg-secondary text-on-secondary'
                : 'bg-secondary-container text-on-secondary-container'
            )}
          >
            {showAddressList ? (
              <CheckSquare className="h-4 w-4" aria-hidden />
            ) : (
              <ClipboardList className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {!showAddressList && <StepIndicator currentStep={flowStep} />}
      </div>

      <div
        className={cn(
          'mx-auto w-full max-w-lg space-y-3 px-margin-mobile pt-3',
          showAddressList
            ? 'pb-[calc(24px+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(152px+env(safe-area-inset-bottom,0px))]'
        )}
      >
        {demand && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3',
              demand.isPriority
                ? 'border-destructive/25 bg-destructive/[0.04]'
                : 'border-secondary/25 bg-secondary/5'
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-on-surface-variant">Área da demanda</p>
              <p className="truncate text-body-sm font-semibold text-on-surface">
                {demand.zone} · {demand.aisle}
              </p>
            </div>
            {demand.isPriority && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-label-sm text-destructive">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                Prioridade
              </span>
            )}
          </div>
        )}

        {showAddressList ? (
          <ContagemEnderecoList
            enderecos={enderecos}
            activeEndereco={enderecoAtivo}
            onSelectEndereco={handleSelectEndereco}
            statusLabels={{ conferido: 'Validado' }}
            doneSummaryLabel="validados"
            enderecosComAvaria={enderecosComAvaria}
          />
        ) : flowStep === 1 ? (
          <>
            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <EnderecoScanField
                id="enderecoConfirmado"
                label="Endereço de armazenagem"
                placeholder="Escaneie ou digite o endereço..."
                registerProps={register('enderecoConfirmado')}
                isValid={enderecoConfere}
                hasMismatch={enderecoDivergente}
                onScanClick={() => setScanEnderecoOpen(true)}
                canSubmitOnEnter={canConfirmStep1}
                onEnter={handleConfirmarEnderecoStep}
                enterKeyHint="go"
                error={enderecoStepError}
              />
            </article>

            <article className="flex items-center gap-3.5 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Endereço designado
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-mono text-headline-md font-bold text-primary">
                    {activeEndereco}
                  </p>
                  <ContagemAvariaEnderecoBadge
                    demandaId={demandaId}
                    endereco={activeEndereco}
                  />
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  Escaneie o endereço acima para confirmar antes de validar o estoque.
                </p>
              </div>
            </article>

            <ContagemAvariaEnderecoCard demandaId={demandaId} endereco={activeEndereco} />

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
                <span>Progresso da demanda</span>
                <span className="font-semibold tabular-nums text-on-surface">{percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progresso da validação"
                />
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                {progress.validated} validados de {progress.total} endereços · {pending}{' '}
                pendentes
              </p>
            </div>
          </>
        ) : (
          <>
            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Localização
                  </p>
                  <ContagemAvariaEnderecoBadge demandaId={demandaId} endereco={enderecoAtivo} />
                </div>
                <p className="font-mono text-headline-md font-bold text-primary">
                  {enderecoAtivo}
                </p>
              </div>
            </article>

            <ContagemAvariaEnderecoCard demandaId={demandaId} endereco={enderecoAtivo} />

            <div className="space-y-2">
            <button
              type="button"
              role="switch"
              aria-checked={enderecoVazio}
              onClick={handleToggleEnderecoVazio}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
                enderecoVazio
                  ? 'border-secondary/50 bg-secondary/5'
                  : 'border-outline-variant bg-surface shadow-sm'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  enderecoVazio
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                <PackageOpen className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-semibold text-on-surface">Endereço vazio</p>
                <p className="text-label-sm text-on-surface-variant">
                  Sem mercadoria no endereço — nenhum dado adicional necessário
                </p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  enderecoVazio ? 'bg-secondary' : 'bg-outline-variant/60'
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
                    enderecoVazio ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )}
                />
              </div>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={anomaliaEncontrada}
              onClick={handleToggleAnomalia}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
                anomaliaEncontrada
                  ? 'border-warning/50 bg-warning/5'
                  : 'border-outline-variant bg-surface shadow-sm'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  anomaliaEncontrada
                    ? 'bg-warning text-on-warning'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                <Flag className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-semibold text-on-surface">Anomalia encontrada</p>
                <p className="text-label-sm text-on-surface-variant">
                  Situação irregular — será revisada posteriormente
                </p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  anomaliaEncontrada ? 'bg-warning' : 'bg-outline-variant/60'
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
                    anomaliaEncontrada ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )}
                />
              </div>
            </button>
            </div>

            {enderecoVazio ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container">
                  <PackageOpen className="h-7 w-7 text-outline" aria-hidden />
                </div>
                <p className="text-body-md font-semibold text-on-surface">
                  Endereço sem mercadoria
                </p>
                <p className="max-w-xs text-body-sm text-on-surface-variant">
                  Confirme abaixo que o endereço {enderecoAtivo} está vazio.
                </p>
              </div>
            ) : anomaliaEncontrada ? (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-warning/40 bg-warning-container/10 px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-container/30">
                  <Flag className="h-7 w-7 text-warning" aria-hidden />
                </div>
                <p className="text-body-md font-semibold text-on-surface">
                  Anomalia no endereço
                </p>
                <p className="max-w-xs text-body-sm text-on-surface-variant">
                  O endereço {enderecoAtivo} será marcado para revisão pela equipe responsável.
                </p>
              </div>
            ) : (
              <>
                <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                      <Package className="h-5 w-5 text-secondary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-body-md font-semibold text-on-surface">
                        {produto.nome}
                      </h2>
                      <p className="mt-0.5 font-mono text-label-md font-bold text-primary">
                        {produto.sku}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-lg bg-secondary-container px-3 py-2 text-center text-on-secondary-container">
                      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                        Esperado
                      </p>
                      <p className="font-mono text-headline-md font-extrabold tabular-nums leading-none">
                        {produto.quantidadeEsperada}
                      </p>
                      <p className="text-[10px] font-medium">
                        {produto.unidadeMedida}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-outline-variant pt-3">
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Lote</p>
                      <p className="font-mono text-body-sm font-semibold text-on-surface">
                        {produto.lote}
                      </p>
                    </div>
                    <div>
                      <p className="text-label-sm text-on-surface-variant">Peso</p>
                      <p className="font-mono text-body-sm font-semibold text-on-surface">
                        {produto.pesoTotal}
                      </p>
                    </div>
                  </div>
                </article>

                <div className="flex gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                  <p className="text-body-sm text-on-surface-variant">{produto.instrucao}</p>
                </div>

                <article className="overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setDivergenceExpanded((prev) => !prev);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 touch-manipulation active:bg-surface-container-low"
                    aria-expanded={divergenceExpanded}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-0.5 text-label-sm font-semibold',
                          hasDivergenceDraft
                            ? 'bg-warning-container text-on-warning-container'
                            : 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        Divergência
                      </span>
                      <span className="truncate text-body-sm text-on-surface-variant">
                        Quantidade real diferente do esperado
                      </span>
                    </div>
                    {divergenceExpanded ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
                    )}
                  </button>

                  {divergenceExpanded && (
                    <div className="space-y-4 border-t border-outline-variant px-4 pb-4 pt-3">
                      <p className="text-label-md text-on-surface-variant">
                        Quantidade real encontrada
                      </p>
                      <SsccScanField
                        id="sscc-palete"
                        placeholder={`Escaneie ${produto.ssccEsperado}`}
                        registerProps={register('sscc')}
                        isValid={isSsccValid}
                        onScanClick={() => setScanOpen(true)}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <NumericStepper
                          id="qty-boxes"
                          label="Caixas"
                          value={Number(quantidadeCaixas) || 0}
                          onChange={(v) =>
                            setValue('quantidadeCaixas', v, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          error={formState.errors.quantidadeCaixas?.message}
                        />
                        <NumericStepper
                          id="qty-units"
                          label="Unidades"
                          value={Number(quantidadeUnidades) || 0}
                          onChange={(v) =>
                            setValue('quantidadeUnidades', v, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          error={formState.errors.quantidadeUnidades?.message}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <DivergenceTextField
                          id="divergence-lot"
                          label="Lote"
                          placeholder="Ex: L2024"
                          registerProps={register('lote')}
                          error={formState.errors.lote?.message}
                        />
                        <DivergenceTextField
                          id="divergence-weight"
                          label="Peso (kg)"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          registerProps={register('peso', { valueAsNumber: true })}
                          error={formState.errors.peso?.message}
                        />
                      </div>
                    </div>
                  )}
                </article>
              </>
            )}

            <div className="rounded-lg border border-outline-variant bg-surface p-4">
              <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
                <span>Progresso da demanda</span>
                <span className="font-semibold tabular-nums text-on-surface">{percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-500"
                  style={{ width: `${percent}%` }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progresso da validação"
                />
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                {progress.validated} validados de {progress.total} endereços · {pending} pendentes
              </p>
            </div>
          </>
        )}
      </div>

      {showDock && flowStep === 1 && (
        <ContagemValidacaoStep1Dock
          canConfirm={canConfirmStep1}
          onConfirmarEndereco={handleConfirmarEnderecoStep}
        />
      )}

      {showDock && flowStep === 2 && (
        <ContagemValidacaoBottomDock
          enderecoVazio={enderecoVazio}
          anomaliaEncontrada={anomaliaEncontrada}
          isSubmitting={isSubmitting}
          matchConfirmed={matchConfirmed}
          canValidate={canValidate}
          canConfirmEmpty={canConfirmEmpty}
          canConfirmAnomalia={canConfirmAnomalia}
          hasDivergenceInput={hasDivergenceInput}
          onEnderecoVazio={actions.onEnderecoVazio}
          onAnomalia={actions.onAnomalia}
          onCorresponde={actions.onCorresponde}
          onCorrigir={actions.onCorrigir}
          onRegistrarAvaria={handleRegistrarAvaria}
        />
      )}

      <ContagemValidacaoToastPortal toast={toast} dockVisible={showDock} />

      <QrScannerModal
        open={scanEnderecoOpen}
        onOpenChange={setScanEnderecoOpen}
        onScan={handleScanEndereco}
        title="Escanear endereço de armazenagem"
      />

      <QrScannerModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScan={handleScanSscc}
        title="Escanear SSCC"
      />
    </div>
  );
}
