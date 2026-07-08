import { Button, cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Package,
  PackageOpen,
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
import { SEED_INVENTORY_DEMANDS } from '../data/contagem-seed';
import { useContagemEnderecos } from '../hooks/use-contagem-enderecos';
import { useContagemCega } from '../hooks/use-contagem-cega';
import { useValidarSkuContagem } from '../hooks/use-validar-sku-contagem';
import { useContagemEnderecosComAvaria } from '../hooks/use-contagem-avarias-endereco';
import {
  ENDERECO_DIVERGENTE_MSG,
  enderecosConferem,
} from '../lib/contagem-endereco-match';

interface ContagemCegaViewProps {
  demandaId: string;
}

type ScanTarget = 'enderecoArmazenagem' | 'codigoProduto';

function findInitialEnderecoIndex(enderecos: { status: string }[]) {
  const emAndamento = enderecos.findIndex((e) => e.status === 'em_andamento');
  if (emAndamento >= 0) return emAndamento;
  const pendente = enderecos.findIndex((e) => e.status === 'pendente');
  return pendente >= 0 ? pendente : 0;
}

const MOCK_DEMAND_PROGRESS: Record<string, { counted: number; total: number }> = {
  '550e8400-e29b-41d4-a716-446655440001': { counted: 12, total: 48 },
  '550e8400-e29b-41d4-a716-446655440005': { counted: 3, total: 22 },
};

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Endereço' },
    { n: 2, label: 'Produto' },
    { n: 3, label: 'Contagem' },
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

function ScanField({
  id,
  label,
  placeholder,
  registerProps,
  isValid,
  hasMismatch = false,
  onScanClick,
  onEnter,
  canSubmitOnEnter = false,
  enterKeyHint = 'done',
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  registerProps:
    | UseFormRegisterReturn<'enderecoArmazenagem'>
    | UseFormRegisterReturn<'codigoProduto'>;
  isValid: boolean;
  hasMismatch?: boolean;
  onScanClick: () => void;
  onEnter?: () => void;
  canSubmitOnEnter?: boolean;
  enterKeyHint?: 'done' | 'go' | 'next' | 'search';
  error?: string;
}) {
  const { onKeyDown: registerOnKeyDown, ...restRegister } = registerProps;

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
          {...restRegister}
          onKeyDown={(e) => {
            registerOnKeyDown?.(e);
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

function QuantityField({
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
  registerProps: ReturnType<
    ReturnType<typeof useContagemCega>['state']['form']['register']
  >;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-label-sm text-on-surface-variant">
        {label}
      </label>
      <input
        id={id}
        type={type}
        step={step}
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 font-mono text-base font-semibold text-on-surface outline-none transition-all focus:border-secondary focus:ring-1 focus:ring-secondary/30"
        {...registerProps}
      />
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function ContagemCegaToastPortal({
  toast,
}: {
  toast: { message: string; variant: 'success' | 'error' } | null;
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
        'bottom-[calc(148px+env(safe-area-inset-bottom,0px))]',
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

function ContagemCegaStep1Dock({
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

function ContagemCegaStep2Dock({
  isSubmitting,
  canAdvance,
  enderecoVazio,
  onProximo,
  onRegistrarAvaria,
}: {
  isSubmitting: boolean;
  canAdvance: boolean;
  enderecoVazio: boolean;
  onProximo: () => void;
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
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onProximo();
          }}
          disabled={!canAdvance || isSubmitting}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
            canAdvance && !isSubmitting
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
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              {enderecoVazio ? 'Finalizar endereço vazio' : 'Próximo'}
            </>
          )}
        </Button>
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
          Registrar avaria
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ContagemCegaBottomDock({
  isSubmitting,
  canConfirm,
  onConfirmar,
  onRegistrarAvaria,
}: {
  isSubmitting: boolean;
  canConfirm: boolean;
  onConfirmar: () => void;
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
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onConfirmar();
          }}
          disabled={!canConfirm || isSubmitting}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
            canConfirm
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Confirmar contagem
            </>
          )}
        </Button>
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
          Adicionar avaria
        </Button>
      </div>
    </div>,
    document.body
  );
}

export function ContagemCegaView({ demandaId }: ContagemCegaViewProps) {
  const navigate = useNavigate();

  const { enderecos, refresh: refreshEnderecos } = useContagemEnderecos(demandaId);

  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);
  const [enderecoIndex, setEnderecoIndex] = useState(0);
  const [enderecoVazio, setEnderecoVazio] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [showAddressList, setShowAddressList] = useState(false);

  const activeEndereco = enderecos[enderecoIndex]?.endereco ?? '';
  const activeEnderecoItemId = enderecos[enderecoIndex]?.id ?? '';

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
      setEnderecoVazio(false);
      return;
    }
    void navigate({ to: '/estoque/contagem' });
  }, [enderecos, enderecoIndex, navigate, refreshEnderecos]);

  const { state, actions } = useContagemCega({
    onComplete: advanceToNextEndereco,
    demandaId,
    demandaEnderecoId: activeEnderecoItemId,
  });
  const { form, isSubmitting, toast } = state;
  const { register, formState, setValue, watch, reset, setFocus } = form;

  function resetFormForNewEndereco() {
    reset({
      enderecoArmazenagem: '',
      codigoProduto: '',
      quantidadeCaixas: 0,
      quantidadeUnidades: 0,
      lote: '',
      peso: 0,
    });
    setEnderecoVazio(false);
    resetValidation();
  }

  useEffect(() => {
    if (showAddressList) return;

    const fieldName =
      flowStep === 1
        ? 'enderecoArmazenagem'
        : flowStep === 2 && !enderecoVazio
          ? 'codigoProduto'
          : null;

    if (!fieldName) return;

    const timer = window.setTimeout(() => {
      setFocus(fieldName);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [flowStep, showAddressList, enderecoVazio, setFocus]);

  const endereco = watch('enderecoArmazenagem');
  const codigo = watch('codigoProduto');
  const quantidadeCaixas = watch('quantidadeCaixas');
  const quantidadeUnidades = watch('quantidadeUnidades');
  const lote = watch('lote');
  const peso = watch('peso');

  const {
    validation: skuValidation,
    isSkuValid,
    isSkuValidating,
    codigoInvalido,
    skuStepError,
    resetValidation,
    validateNow,
  } = useValidarSkuContagem(enderecoVazio ? '' : (codigo ?? ''));

  const enderecoInformado = endereco?.trim() ?? '';
  const enderecoConfere = enderecosConferem(enderecoInformado, activeEndereco);
  const enderecoDivergente =
    Boolean(enderecoInformado) && !enderecoConfere;
  const isEnderecoValid = enderecoConfere;
  const codigoInformado = codigo?.trim() ?? '';
  const isCodigoValid = isSkuValid;

  const hasQuantidade =
    (Number(quantidadeCaixas) || 0) > 0 || (Number(quantidadeUnidades) || 0) > 0;
  const hasLote = Boolean(lote?.trim());
  const hasPeso = Number(peso) > 0;
  const contagemComplete = hasQuantidade && hasLote && hasPeso;

  const demand = useMemo(
    () => SEED_INVENTORY_DEMANDS.find((d) => d.routeId === demandaId),
    [demandaId]
  );

  const progress = {
    counted: enderecos.filter((e) => e.status === 'conferido').length,
    total: enderecos.length,
  };
  const percent =
    progress.total > 0 ? Math.round((progress.counted / progress.total) * 100) : 0;
  const pending = Math.max(0, progress.total - progress.counted);

  const canConfirmStep1 = enderecoConfere;
  const enderecoStepError = enderecoDivergente
    ? ENDERECO_DIVERGENTE_MSG
    : formState.errors.enderecoArmazenagem?.message;
  const canAdvanceStep2 =
    enderecoVazio || (isSkuValid && !isSkuValidating);
  const codigoStepError =
    skuStepError ?? formState.errors.codigoProduto?.message;
  const canConfirmStep3 = contagemComplete && !isSubmitting;
  const enderecosComAvaria = useContagemEnderecosComAvaria(demandaId);
  const enderecoAtivo =
    flowStep >= 2 && enderecoConfere
      ? enderecoInformado
      : activeEndereco;

  function handleScan(value: string) {
    if (!scanTarget) return;
    setValue(scanTarget, value, { shouldValidate: true, shouldDirty: true });
    setScanTarget(null);

    if (scanTarget === 'codigoProduto') {
      void validateNow(value).then((produto) => {
        if (produto) {
          setValue('codigoProduto', produto.sku, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
    }
  }

  function handleSelectEndereco(enderecoSelecionado: string) {
    const index = enderecos.findIndex((e) => e.endereco === enderecoSelecionado);
    if (index >= 0) {
      setEnderecoIndex(index);
      setFlowStep(1);
      resetFormForNewEndereco();
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

  async function handleProximoStep2() {
    if (enderecoVazio) {
      await actions.onConfirmarEnderecoVazio(enderecoAtivo);
      return;
    }

    const produto = await validateNow(codigoInformado);
    if (!produto) {
      hapticMedium();
      return;
    }

    setValue('codigoProduto', produto.sku, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setFlowStep(3);
  }

  function toggleAddressList() {
    hapticLight();
    setShowAddressList((prev) => !prev);
  }

  function handleRegistrarAvaria() {
    hapticLight();
    void navigate({
      to: '/estoque/contagem/$id/cega/avaria',
      params: { id: demandaId },
      search: {
        endereco: endereco?.trim() || undefined,
        codigo: codigo?.trim() || undefined,
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              {showAddressList ? 'Endereços da demanda' : 'Contagem cega'}
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
                ? 'Voltar para contagem'
                : 'Ver lista de endereços'
            }
            aria-pressed={showAddressList}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full touch-manipulation',
              showAddressList
                ? 'bg-secondary text-on-secondary'
                : 'bg-secondary-container text-on-secondary-container'
            )}
          >
            {showAddressList ? (
              <ScanLine className="h-4 w-4" aria-hidden />
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
          <div className="flex items-center gap-3 rounded-lg border border-secondary/25 bg-secondary/5 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <MapPin className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-on-surface-variant">Área da demanda</p>
              <p className="truncate text-body-md font-semibold text-on-surface">
                {demand.zone}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">{demand.aisle}</p>
            </div>
          </div>
        )}

        {showAddressList ? (
          <ContagemEnderecoList
            enderecos={enderecos}
            activeEndereco={endereco}
            onSelectEndereco={handleSelectEndereco}
            enderecosComAvaria={enderecosComAvaria}
          />
        ) : flowStep === 1 ? (
          <>
            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="enderecoArmazenagem"
                label="Endereço de armazenagem"
                placeholder="Escaneie ou digite o endereço..."
                registerProps={register('enderecoArmazenagem')}
                isValid={isEnderecoValid}
                hasMismatch={enderecoDivergente}
                onScanClick={() => setScanTarget('enderecoArmazenagem')}
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
                <p className="truncate font-mono text-headline-md font-bold text-primary">
                  {activeEndereco}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Escaneie o endereço acima para confirmar antes de validar o produto.
                </p>
              </div>
            </article>

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
                  aria-label="Progresso da contagem"
                />
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                {progress.counted} conferidos de {progress.total} endereços · {pending} pendentes
              </p>
            </div>
          </>
        ) : flowStep === 2 ? (
          <>
            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Endereço confirmado
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-headline-md font-bold text-primary">
                    {enderecoAtivo}
                  </p>
                  <ContagemAvariaEnderecoBadge
                    demandaId={demandaId}
                    endereco={enderecoAtivo}
                  />
                </div>
              </div>
            </article>

            <ContagemAvariaEnderecoCard demandaId={demandaId} endereco={enderecoAtivo} />

            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="codigoProduto"
                label="Código do produto / barcode"
                placeholder="Aguardando scanner..."
                registerProps={register('codigoProduto')}
                isValid={isCodigoValid}
                hasMismatch={codigoInvalido}
                onScanClick={() => setScanTarget('codigoProduto')}
                canSubmitOnEnter={canAdvanceStep2}
                onEnter={() => void handleProximoStep2()}
                enterKeyHint="go"
                error={codigoStepError}
              />
              {skuValidation.status === 'validating' && (
                <p className="mt-2 flex items-center gap-2 text-label-sm text-on-surface-variant">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Validando SKU...
                </p>
              )}
              {skuValidation.status === 'valid' && (
                <p className="mt-2 truncate text-label-sm text-secondary">
                  {skuValidation.produto.descricao}
                </p>
              )}
            </article>

            <button
              type="button"
              role="switch"
              aria-checked={enderecoVazio}
              onClick={() => {
                hapticLight();
                const next = !enderecoVazio;
                setEnderecoVazio(next);
                if (next) {
                  setValue('codigoProduto', '', { shouldDirty: true });
                  resetValidation();
                }
              }}
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
                  Sem mercadoria no endereço — finaliza sem contagem
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

            {enderecoVazio && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-8 text-center">
                <PackageOpen className="h-10 w-10 text-outline" aria-hidden />
                <p className="text-body-sm text-on-surface-variant">
                  Confirme abaixo que o endereço {enderecoAtivo} está vazio.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <Package className="h-5 w-5 text-secondary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm text-on-surface-variant">Produto</p>
                <p className="truncate font-mono text-body-md font-semibold text-on-surface">
                  {skuValidation.status === 'valid'
                    ? skuValidation.produto.sku
                    : codigoInformado}
                </p>
                {skuValidation.status === 'valid' && (
                  <p className="truncate text-label-sm text-on-surface-variant">
                    {skuValidation.produto.descricao}
                  </p>
                )}
              </div>
              <p className="shrink-0 font-mono text-label-sm text-on-surface-variant">
                {enderecoAtivo}
              </p>
            </article>

            <article className="rounded-lg border border-secondary ring-1 ring-secondary/20 bg-surface p-4 shadow-sm">
              <p className="mb-4 text-label-md text-on-surface-variant">
                Quantidade contada
              </p>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <QuantityField
                    id="qty-caixas"
                    label="Caixas"
                    type="number"
                    placeholder="0"
                    registerProps={register('quantidadeCaixas', { valueAsNumber: true })}
                    error={formState.errors.quantidadeCaixas?.message}
                  />
                  <QuantityField
                    id="qty-unidades"
                    label="Unidades"
                    type="number"
                    placeholder="0"
                    registerProps={register('quantidadeUnidades', { valueAsNumber: true })}
                    error={formState.errors.quantidadeUnidades?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <QuantityField
                    id="lote"
                    label="Lote"
                    placeholder="Ex: L2024"
                    registerProps={register('lote')}
                    error={formState.errors.lote?.message}
                  />
                  <QuantityField
                    id="peso"
                    label="Peso (kg)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    registerProps={register('peso', { valueAsNumber: true })}
                    error={formState.errors.peso?.message}
                  />
                </div>
              </div>
            </article>

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
                  aria-label="Progresso da contagem"
                />
              </div>
              <p className="mt-2 text-label-sm text-on-surface-variant">
                {progress.counted} conferidos de {progress.total} endereços · {pending} pendentes
              </p>
            </div>
          </>
        )}
      </div>

      {!showAddressList && flowStep === 1 && (
        <ContagemCegaStep1Dock
          canConfirm={canConfirmStep1}
          onConfirmarEndereco={handleConfirmarEnderecoStep}
        />
      )}

      {!showAddressList && flowStep === 2 && (
        <ContagemCegaStep2Dock
          isSubmitting={isSubmitting}
          canAdvance={canAdvanceStep2}
          enderecoVazio={enderecoVazio}
          onProximo={handleProximoStep2}
          onRegistrarAvaria={handleRegistrarAvaria}
        />
      )}

      {!showAddressList && flowStep === 3 && (
        <ContagemCegaBottomDock
          isSubmitting={isSubmitting}
          canConfirm={canConfirmStep3}
          onConfirmar={actions.onConfirmar}
          onRegistrarAvaria={handleRegistrarAvaria}
        />
      )}

      <ContagemCegaToastPortal toast={toast} />

      <QrScannerModal
        open={scanTarget !== null}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title={
          scanTarget === 'enderecoArmazenagem'
            ? 'Escanear endereço de armazenagem'
            : 'Escanear código do produto'
        }
        onScan={handleScan}
      />
    </div>
  );
}
