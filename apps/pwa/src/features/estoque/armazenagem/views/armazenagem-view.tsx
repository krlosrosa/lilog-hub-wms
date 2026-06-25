import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Package,
  ScanLine,
  Verified,
  Warehouse,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import {
  ENDERECO_DIVERGENTE_MSG,
  enderecosConferem,
} from '../../lib/contagem-endereco-match';
import { ArmazenagemConclusaoScreen } from '../components/armazenagem-conclusao-screen';
import { ArmazenagemItemList } from '../components/armazenagem-item-list';
import { useArmazenagemConclusao } from '../hooks/use-armazenagem-conclusao';
import { useArmazenagemDetalhe } from '../hooks/use-armazenagem-detalhe';
import { useConfirmarItem } from '../hooks/use-confirmar-item';
import { useArmazenagem } from '../hooks/use-armazenagem';
import { resolveEnderecoPorLabel } from '../lib/armazenagem-api';
import { mapItemArmazenagemToView } from '../lib/map-item-armazenagem';
import {
  computeArmazenagemStatus,
  formatQuantidadeComparacao,
  formatQuantidadeResumo,
  isArmazenagemParcial,
} from '../lib/armazenagem-quantidade';
import type { ArmazenagemForm, ArmazenagemItem, ArmazenagemItemStatus } from '../types/armazenagem.schema';

interface ArmazenagemViewProps {
  demandaId: string;
}

type ScanTarget = 'codigoProduto' | 'enderecoPicking';

function findInitialItemIndex(itens: ArmazenagemItem[]) {
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
    { n: 1, label: 'Produto' },
    { n: 2, label: 'Endereço' },
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
    | UseFormRegisterReturn<'codigoProduto'>
    | UseFormRegisterReturn<'enderecoPicking'>;
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
    ReturnType<typeof useArmazenagem>['state']['form']['register']
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

function ArmazenagemToastPortal({
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

function ArmazenagemStep1Dock({
  canConfirm,
  onConfirmarProduto,
}: {
  canConfirm: boolean;
  onConfirmarProduto: () => void;
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
            onConfirmarProduto();
          }}
          disabled={!canConfirm}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation',
            canConfirm
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          <Package className="h-5 w-5" aria-hidden />
          Confirmar produto
        </Button>
      </div>
    </div>,
    document.body
  );
}

function ArmazenagemStep2Dock({
  canConfirm,
  onConfirmarEndereco,
  onReportarDivergencia,
}: {
  canConfirm: boolean;
  onConfirmarEndereco: () => void;
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
            onConfirmarEndereco();
          }}
          disabled={!canConfirm}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation active:scale-[0.98]',
            canConfirm
              ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
              : 'bg-surface-container-high text-on-surface-variant'
          )}
        >
          <MapPin className="h-5 w-5" aria-hidden />
          Confirmar endereço
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

function ArmazenagemStep3Dock({
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
              {isParcial ? 'Confirmar armazenagem parcial' : 'Confirmar armazenagem'}
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
  guardados,
  parciais,
  total,
  percent,
  pending,
}: {
  guardados: number;
  parciais: number;
  total: number;
  percent: number;
  pending: number;
}) {
  return (
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
          aria-label="Progresso da armazenagem"
        />
      </div>
      <p className="mt-2 text-label-sm text-on-surface-variant">
        {guardados} guardados de {total} itens · {pending} pendentes
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

export function ArmazenagemView({ demandaId }: ArmazenagemViewProps) {
  const { demanda, isLoading, iniciar, concluir, refresh } =
    useArmazenagemDetalhe(demandaId);
  const { confirmar, isPending: isConfirmando } = useConfirmarItem(demandaId);

  const [itens, setItens] = useState<ArmazenagemItem[]>([]);
  const [flowStep, setFlowStep] = useState<1 | 2 | 3>(1);
  const [itemIndex, setItemIndex] = useState(0);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);
  const [showItemList, setShowItemList] = useState(false);
  const [motivoDivergencia, setMotivoDivergencia] = useState('');
  const [showMotivoSheet, setShowMotivoSheet] = useState(false);
  const [pendingEnderecoLabel, setPendingEnderecoLabel] = useState('');
  const [enderecoConfirmadoId, setEnderecoConfirmadoId] = useState<string | null>(
    null,
  );
  const [conclusaoAtiva, setConclusaoAtiva] = useState(false);

  const {
    proximaDemanda,
    autoRedirectSeconds,
    irParaDestino,
    irParaLista,
  } = useArmazenagemConclusao(demandaId, conclusaoAtiva);

  const politica = demanda?.politica;

  const iniciarDemandaRef = useRef(false);

  useEffect(() => {
    setConclusaoAtiva(false);
    iniciarDemandaRef.current = false;
  }, [demandaId]);

  useEffect(() => {
    if (!demanda) return;
    const mapped = demanda.itens.map((item, index) =>
      mapItemArmazenagemToView(item, index + 1),
    );
    setItens(mapped);
    setItemIndex(findInitialItemIndex(mapped));
    if (demanda.status === 'aguardando_inicio' && !iniciarDemandaRef.current) {
      iniciarDemandaRef.current = true;
      void iniciar().catch(() => {
        iniciarDemandaRef.current = false;
      });
    }
  }, [demanda, iniciar]);

  const activeItem = itens[itemIndex];
  const activeCodigo = activeItem?.codigoProduto ?? '';
  const activeEnderecoPicking = activeItem?.enderecoPickingDesignado ?? '';

  const advanceAfterItem = useCallback(
    async (data: ArmazenagemForm, enderecoConfirmadoId: string) => {
      if (!activeItem || !demanda) {
        throw new Error('Demanda ou item indisponível');
      }

      const apiItem = demanda.itens.find((item) => item.id === activeItem.id);
      const payload: {
        enderecoConfirmadoId: string;
        motivoDivergencia?: string;
        unitizadorCodigo?: string;
      } = {
        enderecoConfirmadoId,
        motivoDivergencia: motivoDivergencia || undefined,
      };

      if (
        demanda.modoUnitizacao === 'gerar_etiqueta_na_armazenagem' &&
        !apiItem?.unitizadorId
      ) {
        payload.unitizadorCodigo = `PAL-${activeItem.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;
      }

      await confirmar(activeItem.id, payload);
      setMotivoDivergencia('');

      const caixas = Number(data.quantidadeCaixas) || 0;
      const unidades = Number(data.quantidadeUnidades) || 0;
      const solicitado = {
        caixas: activeItem.quantidadeSolicitadaCaixas,
        unidades: activeItem.quantidadeSolicitadaUnidades,
      };
      const guardado = { caixas, unidades };
      const status = computeArmazenagemStatus(solicitado, guardado);

      const updated = itens.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              status,
              quantidadeGuardadaCaixas: caixas,
              quantidadeGuardadaUnidades: unidades,
            }
          : item,
      );

      const nextIndex = updated.findIndex(
        (item, i) =>
          i > itemIndex &&
          (item.status === 'pendente' || item.status === 'em_andamento'),
      );

      if (nextIndex >= 0) {
        const withNext = updated.map((item, i) =>
          i === nextIndex && item.status === 'pendente'
            ? { ...item, status: 'em_andamento' as ArmazenagemItemStatus }
            : item,
        );
        setItens(withNext);
        setItemIndex(nextIndex);
        setFlowStep(1);
        resetFormForNewItem(withNext[nextIndex]);
        setEnderecoConfirmadoId(null);
        await refresh();
        return;
      }

      await concluir();
      setConclusaoAtiva(true);
    },
    [
      activeItem,
      confirmar,
      demanda,
      itemIndex,
      itens,
      motivoDivergencia,
      concluir,
      refresh,
    ],
  );

  const getSolicitado = useCallback(
    () => ({
      caixas: activeItem?.quantidadeSolicitadaCaixas ?? 0,
      unidades: activeItem?.quantidadeSolicitadaUnidades ?? 0,
    }),
    [activeItem]
  );

  const { state, actions } = useArmazenagem({
    getSolicitado,
    onComplete: async (data) => {
      if (!enderecoConfirmadoId) {
        throw new Error('Endereço não resolvido');
      }
      await advanceAfterItem(data, enderecoConfirmadoId);
    },
  });
  const { form, isSubmitting, toast } = state;
  const { register, formState, setValue, watch, reset, setFocus } = form;

  function resetFormForNewItem(item?: ArmazenagemItem) {
    const target = item ?? activeItem;
    reset({
      codigoProduto: '',
      enderecoPicking: '',
      quantidadeCaixas: target?.quantidadeSolicitadaCaixas ?? 0,
      quantidadeUnidades: target?.quantidadeSolicitadaUnidades ?? 0,
    });
  }

  useEffect(() => {
    if (showItemList) return;

    const fieldName =
      flowStep === 1
        ? 'codigoProduto'
        : flowStep === 2
          ? 'enderecoPicking'
          : null;

    if (!fieldName) return;

    const timer = window.setTimeout(() => {
      setFocus(fieldName);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [flowStep, showItemList, setFocus]);

  const codigo = watch('codigoProduto');
  const endereco = watch('enderecoPicking');
  const quantidadeCaixas = watch('quantidadeCaixas');
  const quantidadeUnidades = watch('quantidadeUnidades');

  const codigoInformado = codigo?.trim() ?? '';
  const codigoConfere = produtosConferem(codigoInformado, activeCodigo);
  const codigoDivergente = Boolean(codigoInformado) && !codigoConfere;
  const isCodigoValid = codigoConfere;

  const enderecoInformado = endereco?.trim() ?? '';
  const enderecoConfere = enderecosConferem(enderecoInformado, activeEnderecoPicking);
  const enderecoDivergente = Boolean(enderecoInformado) && !enderecoConfere;
  const isEnderecoValid = enderecoConfere;

  const hasQuantidade =
    (Number(quantidadeCaixas) || 0) > 0 || (Number(quantidadeUnidades) || 0) > 0;

  const solicitadoAtual = useMemo(
    () => ({
      caixas: activeItem?.quantidadeSolicitadaCaixas ?? 0,
      unidades: activeItem?.quantidadeSolicitadaUnidades ?? 0,
    }),
    [activeItem]
  );

  const guardadoAtual = useMemo(
    () => ({
      caixas: Number(quantidadeCaixas) || 0,
      unidades: Number(quantidadeUnidades) || 0,
    }),
    [quantidadeCaixas, quantidadeUnidades]
  );

  const isParcialAtual = useMemo(
    () => hasQuantidade && isArmazenagemParcial(solicitadoAtual, guardadoAtual),
    [hasQuantidade, solicitadoAtual, guardadoAtual]
  );

  const demandaResumo = useMemo(() => {
    if (!demanda) return null;
    return {
      origem: `Recebimento ${demanda.recebimentoId.slice(0, 8)}`,
      zona: demanda.modoUnitizacao,
    };
  }, [demanda]);

  const progress = useMemo(() => {
    const total = itens.length;
    const processados = itens.filter(
      (i) => i.status === 'guardado' || i.status === 'parcial'
    ).length;
    const parciais = itens.filter((i) => i.status === 'parcial').length;
    const percent = total > 0 ? Math.round((processados / total) * 100) : 0;
    const pending = Math.max(0, total - processados);
    return { guardados: processados, parciais, total, percent, pending };
  }, [itens]);

  const canConfirmStep1 = codigoConfere;
  const codigoStepError = codigoDivergente
    ? PRODUTO_DIVERGENTE_MSG
    : formState.errors.codigoProduto?.message;
  const permiteEnderecoDivergente =
    politica?.enderecoDivergente !== 'bloquear' && Boolean(enderecoInformado);
  const canConfirmStep2 = enderecoConfere || (enderecoDivergente && permiteEnderecoDivergente);
  const enderecoStepError =
    enderecoDivergente && politica?.enderecoDivergente === 'bloquear'
      ? ENDERECO_DIVERGENTE_MSG
      : formState.errors.enderecoPicking?.message;
  const canConfirmStep3 = hasQuantidade && !isSubmitting && !isConfirmando;

  const codigoAtivo =
    flowStep >= 2 && codigoConfere ? codigoInformado : activeCodigo;

  function handleScan(value: string) {
    if (!scanTarget) return;
    setValue(scanTarget, value, { shouldValidate: true, shouldDirty: true });
    setScanTarget(null);
  }

  function handleSelectItem(codigoSelecionado: string) {
    const index = itens.findIndex((i) => i.codigoProduto === codigoSelecionado);
    if (index >= 0) {
      setItemIndex(index);
      setFlowStep(1);
      resetFormForNewItem();
    }
    setShowItemList(false);
  }

  function handleConfirmarProdutoStep() {
    if (!produtosConferem(codigoInformado, activeCodigo)) {
      hapticMedium();
      return;
    }
    setFlowStep(2);
  }

  async function handleConfirmarEnderecoStep() {
    if (!activeItem) return;

    if (enderecoDivergente && politica?.enderecoDivergente !== 'bloquear') {
      setPendingEnderecoLabel(enderecoInformado);
      setShowMotivoSheet(true);
      return;
    }

    if (!enderecoConfere) {
      hapticMedium();
      return;
    }

    const label = enderecoInformado || activeEnderecoPicking;
    let resolvedId = activeItem.enderecoSugeridoId;

    if (!resolvedId) {
      resolvedId = await resolveEnderecoPorLabel(demandaId, activeItem.id, label);
    }

    if (!resolvedId) {
      hapticMedium();
      return;
    }

    setEnderecoConfirmadoId(resolvedId);
    setMotivoDivergencia('');
    setValue('quantidadeCaixas', activeItem.quantidadeSolicitadaCaixas);
    setValue('quantidadeUnidades', activeItem.quantidadeSolicitadaUnidades);
    setFlowStep(3);
  }

  async function handleConfirmarMotivoDivergencia() {
    if (!activeItem || !motivoDivergencia.trim()) {
      hapticMedium();
      return;
    }

    const resolvedId = await resolveEnderecoPorLabel(
      demandaId,
      activeItem.id,
      pendingEnderecoLabel,
    );

    if (!resolvedId) {
      hapticMedium();
      return;
    }

    setEnderecoConfirmadoId(resolvedId);
    setShowMotivoSheet(false);
    setValue('quantidadeCaixas', activeItem.quantidadeSolicitadaCaixas);
    setValue('quantidadeUnidades', activeItem.quantidadeSolicitadaUnidades);
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

  if (isLoading) {
    return (
      <div className="page-enter flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" aria-hidden />
        <p className="text-body-md text-on-surface-variant">Carregando demanda...</p>
      </div>
    );
  }

  if (conclusaoAtiva) {
    return (
      <ArmazenagemConclusaoScreen
        demandaLabel={`#${demandaId.slice(0, 8).toUpperCase()}`}
        itensGuardados={itens.length}
        proximaDemanda={proximaDemanda}
        autoRedirectSeconds={autoRedirectSeconds}
        onProximaDemanda={irParaDestino}
        onVoltarLista={irParaLista}
      />
    );
  }

  if (!activeItem) {
    return (
      <div className="page-enter flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <Package className="h-10 w-10 text-outline" aria-hidden />
        <p className="text-headline-md font-semibold text-on-surface">
          Demanda não encontrada
        </p>
        <Link
          to="/estoque/armazenagem"
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
            to="/estoque/armazenagem"
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              {showItemList ? 'Itens da demanda' : 'Armazenagem'}
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              #{demandaId}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleItemList}
            aria-label={
              showItemList ? 'Voltar para armazenagem' : 'Ver lista de itens'
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
        {demandaResumo && (
          <div className="flex items-center gap-3 rounded-lg border border-secondary/25 bg-secondary/5 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
              <Warehouse className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm text-on-surface-variant">Origem</p>
              <p className="truncate text-body-md font-semibold text-on-surface">
                {demandaResumo.origem}
              </p>
              <p className="truncate text-body-sm text-on-surface-variant">
                {demandaResumo.zona}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 font-mono text-label-sm tabular-nums text-on-surface-variant">
              {progress.guardados}/{progress.total}
            </span>
          </div>
        )}

        {showItemList ? (
          <ArmazenagemItemList
            itens={itens}
            activeCodigoProduto={codigoAtivo}
            onSelectItem={handleSelectItem}
          />
        ) : flowStep === 1 ? (
          <>
            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="codigoProduto"
                label="Código do produto / barcode"
                placeholder="Escaneie ou digite o código..."
                registerProps={register('codigoProduto')}
                isValid={isCodigoValid}
                hasMismatch={codigoDivergente}
                onScanClick={() => setScanTarget('codigoProduto')}
                canSubmitOnEnter={canConfirmStep1}
                onEnter={handleConfirmarProdutoStep}
                enterKeyHint="go"
                error={codigoStepError}
              />
            </article>

            <article className="flex items-center gap-3.5 rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Package className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Produto designado
                </p>
                <p className="truncate font-mono text-headline-md font-bold text-primary">
                  {activeCodigo}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {activeItem.nomeProduto}
                </p>
              </div>
            </article>

            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <MapPin className="h-5 w-5 text-secondary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm text-on-surface-variant">Destino picking</p>
                <p className="truncate font-mono text-body-md font-semibold text-on-surface">
                  {activeEnderecoPicking}
                </p>
              </div>
            </article>

            <ProgressCard {...progress} />
          </>
        ) : flowStep === 2 ? (
          <>
            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Produto confirmado
                </p>
                <p className="font-mono text-headline-md font-bold text-primary">
                  {codigoAtivo}
                </p>
                <p className="truncate text-body-sm text-on-surface-variant">
                  {activeItem.nomeProduto}
                </p>
              </div>
            </article>

            <article className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <MapPin className="h-5 w-5 text-secondary" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm text-on-surface-variant">Endereço de picking designado</p>
                <p className="truncate font-mono text-body-md font-semibold text-on-surface">
                  {activeEnderecoPicking}
                </p>
              </div>
            </article>

            <article className="rounded-lg border border-secondary/40 bg-surface p-4 shadow-sm ring-1 ring-secondary/15">
              <ScanField
                id="enderecoPicking"
                label="Endereço de picking"
                placeholder="Escaneie ou digite o endereço..."
                registerProps={register('enderecoPicking')}
                isValid={isEnderecoValid}
                hasMismatch={enderecoDivergente}
                onScanClick={() => setScanTarget('enderecoPicking')}
                canSubmitOnEnter={canConfirmStep2}
                onEnter={handleConfirmarEnderecoStep}
                enterKeyHint="go"
                error={enderecoStepError}
              />
            </article>
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
                  {codigoAtivo}
                </p>
                <p className="truncate text-body-sm text-on-surface-variant">
                  {activeItem.nomeProduto}
                </p>
              </div>
              <p className="shrink-0 font-mono text-label-sm text-on-surface-variant">
                {enderecoInformado || activeEnderecoPicking}
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
                Quantidade a guardar
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
                  Guardando: {formatQuantidadeComparacao(solicitadoAtual, guardadoAtual)}
                </p>
              )}
              {isParcialAtual && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-container/30 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                  <p className="text-label-sm text-on-warning-container">
                    Quantidade abaixo do solicitado. A armazenagem será registrada como{' '}
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
        <ArmazenagemStep1Dock
          canConfirm={canConfirmStep1}
          onConfirmarProduto={handleConfirmarProdutoStep}
        />
      )}

      {!showItemList && flowStep === 2 && (
        <ArmazenagemStep2Dock
          canConfirm={canConfirmStep2}
          onConfirmarEndereco={handleConfirmarEnderecoStep}
          onReportarDivergencia={handleReportarDivergencia}
        />
      )}

      {showMotivoSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-safe">
          <div className="w-full max-w-lg rounded-t-2xl border border-outline-variant bg-surface p-4 shadow-xl">
            <p className="mb-2 text-headline-md font-semibold text-on-surface">
              Divergência de endereço
            </p>
            <p className="mb-3 text-body-sm text-on-surface-variant">
              Informe o motivo para armazenar em {pendingEnderecoLabel || 'outro endereço'}.
            </p>
            <textarea
              value={motivoDivergencia}
              onChange={(e) => setMotivoDivergencia(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-lg border border-outline-variant bg-surface-bright p-3 text-body-sm text-on-surface outline-none focus:border-secondary"
              placeholder="Descreva o motivo..."
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowMotivoSheet(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void handleConfirmarMotivoDivergencia()}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showItemList && flowStep === 3 && (
        <ArmazenagemStep3Dock
          isSubmitting={isSubmitting || isConfirmando}
          canConfirm={canConfirmStep3}
          isParcial={isParcialAtual}
          onConfirmar={actions.onConfirmar}
          onReportarDivergencia={handleReportarDivergencia}
        />
      )}

      <ArmazenagemToastPortal toast={toast} />

      <QrScannerModal
        open={scanTarget !== null}
        onOpenChange={(open) => {
          if (!open) setScanTarget(null);
        }}
        title={
          scanTarget === 'codigoProduto'
            ? 'Escanear código do produto'
            : 'Escanear endereço de picking'
        }
        onScan={handleScan}
      />
    </div>
  );
}
