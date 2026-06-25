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
  PackageX,
  ScanLine,
  Truck,
  Verified,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  ENDERECO_DIVERGENTE_MSG,
  enderecosConferem,
} from '../../estoque/lib/contagem-endereco-match';
import { SeparacaoItemList } from '../components/separacao-item-list';
import {
  SEED_SEPARACAO_ITENS,
  SEED_SEPARACAO_ORDERS,
} from '../data/separacao-seed';
import {
  computeSeparacaoStatus,
  formatQuantidadeComparacao,
  formatQuantidadeResumo,
  isSeparacaoParcial,
} from '../lib/separacao-quantidade';
import { useSeparacao } from '../hooks/use-separacao';
import type { SeparacaoForm, SeparacaoItem, SeparacaoItemStatus } from '../types/separacao.schema';

interface SeparacaoViewProps {
  ordemId: string;
}

type ScanTarget = 'enderecoColeta' | 'codigoProduto';

function findInitialItemIndex(itens: SeparacaoItem[]) {
  const emAndamento = itens.findIndex((i) => i.status === 'em_andamento');
  if (emAndamento >= 0) return emAndamento;
  const pendente = itens.findIndex((i) => i.status === 'pendente');
  return pendente >= 0 ? pendente : 0;
}

function produtosConferem(informado: string, esperado: string): boolean {
  const a = informado.trim().toUpperCase();
  const b = esperado.trim().toUpperCase();
  return a.length > 0 && b.length > 0 && a === b;
}

const PRODUTO_DIVERGENTE_MSG =
  'Produto não confere com o solicitado. Verifique e escaneie novamente.';

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Endereço' },
    { n: 2, label: 'Produto' },
    { n: 3, label: 'Qtd' },
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
    | UseFormRegisterReturn<'enderecoColeta'>
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
  placeholder,
  registerProps,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  registerProps: ReturnType<
    ReturnType<typeof useSeparacao>['state']['form']['register']
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
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 font-mono text-base font-semibold text-on-surface outline-none transition-all focus:border-secondary focus:ring-1 focus:ring-secondary/30 numeric-input"
        {...registerProps}
      />
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

function SeparacaoToastPortal({
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

function SeparacaoStep1Dock({
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

function SeparacaoStep2Dock({
  isSubmitting,
  canAdvance,
  itemEsgotado,
  onProximo,
  onReportarDivergencia,
}: {
  isSubmitting: boolean;
  canAdvance: boolean;
  itemEsgotado: boolean;
  onProximo: () => void;
  onReportarDivergencia: () => void;
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
              {itemEsgotado ? 'Registrar item esgotado' : 'Próximo'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            hapticLight();
            onReportarDivergencia();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-destructive/30 bg-transparent text-destructive touch-manipulation active:scale-[0.98] active:bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Reportar divergência
        </Button>
      </div>
    </div>,
    document.body
  );
}

function SeparacaoStep3Dock({
  isSubmitting,
  canConfirm,
  isParcial,
  onConfirmar,
  onReportarDivergencia,
}: {
  isSubmitting: boolean;
  canConfirm: boolean;
  isParcial: boolean;
  onConfirmar: () => void;
  onReportarDivergencia: () => void;
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
              {isParcial ? 'Confirmar separação parcial' : 'Confirmar separação'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            hapticLight();
            onReportarDivergencia();
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-destructive/30 bg-transparent text-destructive touch-manipulation active:scale-[0.98] active:bg-destructive/5"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Reportar divergência
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ProgressCard({
  separados,
  parciais,
  total,
  percent,
  pending,
}: {
  separados: number;
  parciais: number;
  total: number;
  percent: number;
  pending: number;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4">
      <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
        <span>Progresso da ordem</span>
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
          aria-label="Progresso da separação"
        />
      </div>
      <p className="mt-2 text-label-sm text-on-surface-variant">
        {separados} separados de {total} itens · {pending} pendentes
        {parciais > 0 && (
          <span className="text-warning">
            {' '}
            · {parciais} parcial{parciais === 1 ? '' : 'is'}
          </span>
        )}
      </p>
    </div>
  );
}

export function SeparacaoView({ ordemId }: SeparacaoViewProps) {
  const navigate = useNavigate();

  const [itens, setItens] = useState<SeparacaoItem[]>(
    () => SEED_SEPARACAO_ITENS[ordemId] ?? []
  );

  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);
  const [itemIndex, setItemIndex] = useState(() => findInitialItemIndex(itens));
  const [itemEsgotado, setItemEsgotado] = useState(false);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [showItemList, setShowItemList] = useState(false);

  const activeItem = itens[itemIndex];
  const activeEndereco = activeItem?.endereco ?? '';

  const advanceAfterItem = useCallback(
    (payload: { data?: SeparacaoForm; esgotado?: boolean }) => {
      setItens((prev) => {
        const updated = prev.map((item, i) => {
          if (i !== itemIndex) return item;

          if (payload.esgotado) {
            return {
              ...item,
              status: 'esgotado' as SeparacaoItemStatus,
              quantidadeSeparadaCaixas: 0,
              quantidadeSeparadaUnidades: 0,
            };
          }

          const data = payload.data!;
          const caixas = Number(data.quantidadeCaixas) || 0;
          const unidades = Number(data.quantidadeUnidades) || 0;
          const solicitado = {
            caixas: item.quantidadeSolicitadaCaixas,
            unidades: item.quantidadeSolicitadaUnidades,
          };
          const separado = { caixas, unidades };
          const status = computeSeparacaoStatus(solicitado, separado, false);

          return {
            ...item,
            status,
            quantidadeSeparadaCaixas: caixas,
            quantidadeSeparadaUnidades: unidades,
          };
        });

        const nextIndex = updated.findIndex(
          (item, i) =>
            i > itemIndex &&
            (item.status === 'pendente' || item.status === 'em_andamento')
        );

        if (nextIndex >= 0) {
          const withNext = updated.map((item, i) =>
            i === nextIndex && item.status === 'pendente'
              ? { ...item, status: 'em_andamento' as SeparacaoItemStatus }
              : item
          );
          setItemIndex(nextIndex);
          setFlowStep(1);
          setItemEsgotado(false);
          return withNext;
        }

        void navigate({ to: '/expedicao/separacao' });
        return updated;
      });
    },
    [itemIndex, navigate]
  );

  const getSolicitado = useCallback(
    () => ({
      caixas: activeItem?.quantidadeSolicitadaCaixas ?? 0,
      unidades: activeItem?.quantidadeSolicitadaUnidades ?? 0,
    }),
    [activeItem]
  );

  const { state, actions } = useSeparacao({
    getSolicitado,
    onComplete: (data) => advanceAfterItem({ data }),
    onCompleteEsgotado: () => advanceAfterItem({ esgotado: true }),
  });
  const { form, isSubmitting, toast } = state;
  const { register, formState, setValue, watch, reset, setFocus } = form;

  function resetFormForNewItem() {
    reset({
      enderecoColeta: '',
      codigoProduto: '',
      quantidadeCaixas: activeItem?.quantidadeSolicitadaCaixas ?? 0,
      quantidadeUnidades: activeItem?.quantidadeSolicitadaUnidades ?? 0,
    });
    setItemEsgotado(false);
  }

  useEffect(() => {
    if (showItemList) return;

    const fieldName =
      flowStep === 1
        ? 'enderecoColeta'
        : flowStep === 2 && !itemEsgotado
          ? 'codigoProduto'
          : null;

    if (!fieldName) return;

    const timer = window.setTimeout(() => {
      setFocus(fieldName);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [flowStep, showItemList, itemEsgotado, setFocus]);

  const endereco = watch('enderecoColeta');
  const codigo = watch('codigoProduto');
  const quantidadeCaixas = watch('quantidadeCaixas');
  const quantidadeUnidades = watch('quantidadeUnidades');

  const enderecoInformado = endereco?.trim() ?? '';
  const enderecoConfere = enderecosConferem(enderecoInformado, activeEndereco);
  const enderecoDivergente = Boolean(enderecoInformado) && !enderecoConfere;
  const isEnderecoValid = enderecoConfere;

  const codigoEsperado = activeItem?.codigoProduto ?? '';
  const codigoInformado = codigo?.trim() ?? '';
  const codigoConfere = produtosConferem(codigoInformado, codigoEsperado);
  const codigoDivergente = Boolean(codigoInformado) && !codigoConfere;
  const isCodigoValid = codigoConfere;

  const hasQuantidade =
    (Number(quantidadeCaixas) || 0) > 0 || (Number(quantidadeUnidades) || 0) > 0;
  const contagemComplete = hasQuantidade;

  const solicitadoAtual = useMemo(
    () => ({
      caixas: activeItem?.quantidadeSolicitadaCaixas ?? 0,
      unidades: activeItem?.quantidadeSolicitadaUnidades ?? 0,
    }),
    [activeItem]
  );

  const separadoAtual = useMemo(
    () => ({
      caixas: Number(quantidadeCaixas) || 0,
      unidades: Number(quantidadeUnidades) || 0,
    }),
    [quantidadeCaixas, quantidadeUnidades]
  );

  const isParcialAtual = useMemo(
    () => hasQuantidade && isSeparacaoParcial(solicitadoAtual, separadoAtual),
    [hasQuantidade, solicitadoAtual, separadoAtual]
  );

  const order = useMemo(
    () => SEED_SEPARACAO_ORDERS.find((o) => o.routeId === ordemId),
    [ordemId]
  );

  const progress = useMemo(() => {
    const total = itens.length;
    const processados = itens.filter(
      (i) => i.status === 'separado' || i.status === 'parcial' || i.status === 'esgotado'
    ).length;
    const parciais = itens.filter((i) => i.status === 'parcial').length;
    const percent = total > 0 ? Math.round((processados / total) * 100) : 0;
    const pending = Math.max(0, total - processados);
    return { separados: processados, parciais, total, percent, pending };
  }, [itens]);

  const canConfirmStep1 = enderecoConfere;
  const enderecoStepError = enderecoDivergente
    ? ENDERECO_DIVERGENTE_MSG
    : formState.errors.enderecoColeta?.message;
  const codigoStepError = codigoDivergente
    ? PRODUTO_DIVERGENTE_MSG
    : formState.errors.codigoProduto?.message;
  const canAdvanceStep2 = itemEsgotado || isCodigoValid;
  const canConfirmStep3 = contagemComplete && !isSubmitting;

  const enderecoAtivo =
    flowStep >= 2 && enderecoConfere ? enderecoInformado : activeEndereco;

  function handleScan(value: string) {
    if (!scanTarget) return;
    setValue(scanTarget, value, { shouldValidate: true, shouldDirty: true });
    setScanTarget(null);
  }

  function handleSelectItem(enderecoSelecionado: string) {
    const index = itens.findIndex((i) => i.endereco === enderecoSelecionado);
    if (index >= 0) {
      setItemIndex(index);
      setFlowStep(1);
      resetFormForNewItem();
    }
    setShowItemList(false);
  }

  function handleConfirmarEnderecoStep() {
    if (!enderecosConferem(enderecoInformado, activeEndereco)) {
      hapticMedium();
      return;
    }
    setFlowStep(2);
  }

  async function handleProximoStep2() {
    if (itemEsgotado) {
      await actions.onConfirmarItemEsgotado(enderecoAtivo, codigoEsperado);
      return;
    }
    if (!codigoConfere) {
      hapticMedium();
      return;
    }
    setValue('quantidadeCaixas', activeItem?.quantidadeSolicitadaCaixas ?? 0);
    setValue('quantidadeUnidades', activeItem?.quantidadeSolicitadaUnidades ?? 0);
    setFlowStep(3);
  }

  function toggleItemList() {
    hapticLight();
    setShowItemList((prev) => !prev);
  }

  function handleReportarDivergencia() {
    hapticLight();
    hapticMedium();
  }

  if (!activeItem) {
    return (
      <div className="page-enter flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <Package className="h-10 w-10 text-outline" aria-hidden />
        <p className="text-headline-md font-semibold text-on-surface">
          Ordem não encontrada
        </p>
        <Link
          to="/expedicao/separacao"
          className="text-body-sm text-secondary"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/expedicao/separacao"
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              {showItemList ? 'Itens da ordem' : 'Separação'}
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              #{ordemId}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleItemList}
            aria-label={
              showItemList ? 'Voltar para separação' : 'Ver lista de itens'
            }
            aria-pressed={showItemList}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full touch-manipulation',
              showItemList
                ? 'bg-secondary text-on-secondary'
                : 'bg-secondary-container text-on-secondary-container'
            )}
          >
            {showItemList ? (
              <ScanLine className="h-4 w-4" aria-hidden />
            ) : (
              <ClipboardList className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {!showItemList && <StepIndicator currentStep={flowStep} />}
      </div>

      <div
        className={cn(
          'mx-auto w-full max-w-lg space-y-3 px-margin-mobile pt-3',
          showItemList
            ? 'pb-[calc(24px+env(safe-area-inset-bottom,0px))]'
            : 'pb-[calc(152px+env(safe-area-inset-bottom,0px))]'
        )}
      >
        {order && (
          <div className="flex items-center gap-3 rounded-lg border border-secondary/25 bg-secondary/5 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <Truck className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-on-surface-variant">Destino</p>
              <p className="truncate text-body-md font-semibold text-on-surface">
                {order.destino}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">{order.zona}</p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
              {progress.separados}/{progress.total}
            </span>
          </div>
        )}

        {showItemList ? (
          <SeparacaoItemList
            itens={itens}
            activeEndereco={enderecoAtivo}
            onSelectItem={handleSelectItem}
          />
        ) : flowStep === 1 ? (
          <>
            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="enderecoColeta"
                label="Endereço de coleta"
                placeholder="Escaneie ou digite o endereço..."
                registerProps={register('enderecoColeta')}
                isValid={isEnderecoValid}
                hasMismatch={enderecoDivergente}
                onScanClick={() => setScanTarget('enderecoColeta')}
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
                  {activeItem.nomeProduto}
                </p>
              </div>
            </article>

            <ProgressCard {...progress} />
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
                <p className="font-mono text-headline-md font-bold text-primary">
                  {enderecoAtivo}
                </p>
              </div>
            </article>

            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <Package className="h-5 w-5 text-secondary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm text-on-surface-variant">Produto esperado</p>
                <p className="truncate font-mono text-body-md font-semibold text-on-surface">
                  {codigoEsperado}
                </p>
                <p className="truncate text-body-sm text-on-surface-variant">
                  {activeItem.nomeProduto}
                </p>
              </div>
            </article>

            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="codigoProduto"
                label="Código do produto / barcode"
                placeholder="Aguardando scanner..."
                registerProps={register('codigoProduto')}
                isValid={isCodigoValid}
                hasMismatch={codigoDivergente}
                onScanClick={() => setScanTarget('codigoProduto')}
                error={codigoStepError}
              />
            </article>

            <button
              type="button"
              role="switch"
              aria-checked={itemEsgotado}
              onClick={() => {
                hapticLight();
                const next = !itemEsgotado;
                setItemEsgotado(next);
                if (next) {
                  setValue('codigoProduto', '', { shouldDirty: true });
                }
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
                itemEsgotado
                  ? 'border-secondary/50 bg-secondary/5'
                  : 'border-outline-variant bg-surface shadow-sm'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  itemEsgotado
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                )}
              >
                <PackageX className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-semibold text-on-surface">
                  Item esgotado no endereço
                </p>
                <p className="text-label-sm text-on-surface-variant">
                  Sem estoque disponível — registra e avança
                </p>
              </div>
              <div
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  itemEsgotado ? 'bg-secondary' : 'bg-outline-variant/60'
                )}
                aria-hidden
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform',
                    itemEsgotado ? 'translate-x-[22px]' : 'translate-x-0.5'
                  )}
                />
              </div>
            </button>

            {itemEsgotado && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-6 py-8 text-center">
                <PackageX className="h-10 w-10 text-outline" aria-hidden />
                <p className="text-body-sm text-on-surface-variant">
                  Confirme abaixo que o item {codigoEsperado} está esgotado em{' '}
                  {enderecoAtivo}.
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
                  {codigoInformado}
                </p>
                <p className="truncate text-body-sm text-on-surface-variant">
                  {activeItem.nomeProduto}
                </p>
              </div>
              <p className="shrink-0 font-mono text-label-sm text-on-surface-variant">
                {enderecoAtivo}
              </p>
            </article>

            <article
              className={cn(
                'rounded-lg border bg-surface p-4 shadow-sm',
                isParcialAtual
                  ? 'border-warning ring-1 ring-warning/25'
                  : 'border-secondary ring-1 ring-secondary/20'
              )}
            >
              <p className="mb-4 text-label-md text-on-surface-variant">
                Quantidade separada
              </p>
              <div className="grid grid-cols-2 gap-3">
                <QuantityField
                  id="qty-caixas"
                  label="Caixas"
                  placeholder="0"
                  registerProps={register('quantidadeCaixas', { valueAsNumber: true })}
                  error={formState.errors.quantidadeCaixas?.message}
                />
                <QuantityField
                  id="qty-unidades"
                  label="Unidades"
                  placeholder="0"
                  registerProps={register('quantidadeUnidades', { valueAsNumber: true })}
                  error={formState.errors.quantidadeUnidades?.message}
                />
              </div>
              <p className="mt-3 text-label-sm text-on-surface-variant">
                Solicitado:{' '}
                {formatQuantidadeResumo(
                  activeItem.quantidadeSolicitadaCaixas,
                  activeItem.quantidadeSolicitadaUnidades
                )}
              </p>
              {hasQuantidade && (
                <p
                  className={cn(
                    'mt-1 font-mono text-label-sm font-semibold',
                    isParcialAtual ? 'text-warning' : 'text-secondary'
                  )}
                >
                  Separando: {formatQuantidadeComparacao(solicitadoAtual, separadoAtual)}
                </p>
              )}
              {isParcialAtual && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-container/30 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <p className="text-label-sm text-on-warning-container">
                    Quantidade abaixo do solicitado. A separação será registrada como{' '}
                    <span className="font-semibold">parcial</span>.
                  </p>
                </div>
              )}
            </article>

            <ProgressCard {...progress} />
          </>
        )}
      </div>

      {!showItemList && flowStep === 1 && (
        <SeparacaoStep1Dock
          canConfirm={canConfirmStep1}
          onConfirmarEndereco={handleConfirmarEnderecoStep}
        />
      )}

      {!showItemList && flowStep === 2 && (
        <SeparacaoStep2Dock
          isSubmitting={isSubmitting}
          canAdvance={canAdvanceStep2}
          itemEsgotado={itemEsgotado}
          onProximo={handleProximoStep2}
          onReportarDivergencia={handleReportarDivergencia}
        />
      )}

      {!showItemList && flowStep === 3 && (
        <SeparacaoStep3Dock
          isSubmitting={isSubmitting}
          canConfirm={canConfirmStep3}
          isParcial={isParcialAtual}
          onConfirmar={actions.onConfirmar}
          onReportarDivergencia={handleReportarDivergencia}
        />
      )}

      <SeparacaoToastPortal toast={toast} />

      <QrScannerModal
        open={scanTarget !== null}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title={
          scanTarget === 'enderecoColeta'
            ? 'Escanear endereço de coleta'
            : 'Escanear código do produto'
        }
        onScan={handleScan}
      />
    </div>
  );
}
