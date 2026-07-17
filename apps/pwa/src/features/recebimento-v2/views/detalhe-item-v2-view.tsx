import { zodResolver } from '@hookform/resolvers/zod';
import {
  canParseFabricacaoFromLote,
  parseFabricacaoFromLote,
} from '@lilog/contracts';
import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  AlertTriangle,
  Barcode,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Hash,
  Loader2,
  Minus,
  Package,
  Plus,
  ScanLine,
  Search,
  Trash2,
} from 'lucide-react';
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type FormEvent,
  type KeyboardEvent,
  type KeyboardEventHandler,
  type RefObject,
} from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { toast } from 'sonner';

import {
  CollapsibleRecordCard,
  RecordListItem,
} from '@/features/recebimento/components/expandable-record-list';
import { EMPTY_DETALHE_ITEM_FORM, buildFormForLoteEntry, resolveFirstFormError, resolveMaintainedLoteContext, syncMaintainedLoteFieldsForSubmit, validatePvarBoxDraft } from '@/features/recebimento/lib/conferencia-form';
import { applyGs1BarcodeInput, applyGs1NonPvarScanInput, isScannerSubmitKey, looksLikeGs1TraceabilityBarcode, looksLikeGs1WeightBarcode, normalizeGs1ScannerInput, resolveLoteFieldInput } from '@/features/recebimento/lib/parse-gs1-barcode';
import { resolveNonPvarLoteOnSubmit, applyNonPvarLoteResolution } from '@/features/recebimento-v2/lib/resolve-non-pvar-lote-on-submit';
import {
  buildDetalheItemSchema,
  type DetalheItemForm,
  type QuantidadeModo,
} from '@/features/recebimento/types/recebimento.schema';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { useVisualViewportInset } from '@/lib/use-visual-viewport-inset';

import { PaleteV2Toolbar, type PaleteSheetIntent } from '../components/palete-v2-toolbar';
import {
  getActivePaleteCodigo,
  PALETE_OBRIGATORIO_MSG,
  setActivePaleteV2,
} from '../services/palete-session-v2.service';
import { TemperaturaProdutoV2ModalButton } from '../components/temperatura-produto-v2-card';
import { useConferenciaV2 } from '../hooks/use-conferencia-v2';
import { useParametrosConferenciaV2 } from '../hooks/use-parametros-conferencia-v2';
import { useProcessV2 } from '../hooks/use-process-v2';
import { useProductSearchQuery } from '../hooks/use-product-search-v2';
import {
  formatConferenceQuantityLabel,
  resolveConferenceQuantidadePar,
  resolveConferidoTotaisForSkuV2,
} from '../lib/conferencia-quantidade';
import {
  CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG,
  isResolvableCatalogProduct,
  normalizeSkuParam,
  resolveProdutoConferenciaV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import { resolveProductForConferenciaV2 } from '../services/enrich-product-catalog.service';
import type { ConferenceRecord, ProductRecord } from '../local-db/schema';

interface DetalheItemV2ViewProps {
  demandId: string;
  sku?: string;
}

type PvarFocusAfterSubmit = 'gs1-lote' | 'gs1-peso' | 'peso';

function formatIsoDateForDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
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
  inputRef,
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
  inputRef?: RefObject<HTMLInputElement | null>;
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
      <label className="text-label-sm font-medium text-on-surface" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface touch-manipulation transition-transform active:scale-90"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={cn(
            'flex-1 rounded-lg border bg-surface px-3 py-2.5 text-center text-body-lg font-semibold text-on-surface outline-none',
            'focus:border-secondary focus:ring-2 focus:ring-secondary/20',
            error ? 'border-destructive' : 'border-input',
          )}
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface touch-manipulation transition-transform active:scale-90"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ScanField({
  id,
  label,
  icon: Icon,
  placeholder,
  registerProps,
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
      <label className="text-label-sm font-medium text-on-surface" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          ref={(node) => {
            if (inputRef) {
              inputRef.current = node;
            }
          }}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          {...(isControlled ? { value, onChange } : registerProps)}
          className={cn(
            'h-12 w-full rounded-lg border bg-surface py-2.5 pl-9 pr-3 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
            error ? 'border-destructive' : 'border-input',
          )}
        />
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function ConferenciaRecordItem({
  record,
  quantidadeModo,
  unidadesPorCaixa,
  onDelete,
}: {
  record: ConferenceRecord;
  quantidadeModo: QuantidadeModo;
  unidadesPorCaixa: number;
  onDelete: (id: string) => void;
}) {
  const quantityLabel = formatConferenceQuantityLabel(
    record,
    quantidadeModo,
    unidadesPorCaixa,
  );

  return (
    <div className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface p-3">
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-on-surface">
          {quantityLabel}
          {record.peso != null ? ` · ${record.peso} kg` : ''}
        </p>
        {record.lote && (
          <p className="text-label-sm text-muted-foreground">Lote: {record.lote}</p>
        )}
        {record.unitizadorCodigo ? (
          <p className="text-label-sm text-muted-foreground">
            Palete: {record.unitizadorCodigo}
          </p>
        ) : null}
        {(record.fabricacao || record.validade) && (
          <p className="text-label-sm text-muted-foreground">
            Fab: {formatIsoDateForDisplay(record.fabricacao ?? record.validade ?? '')}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70">
          {new Date(record.conferidoAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          onDelete(record.id);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-destructive touch-manipulation transition-transform active:scale-90"
        aria-label="Deletar conferência"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function DetalheItemV2View({ demandId, sku: rawSku }: DetalheItemV2ViewProps) {
  const initialSku = normalizeSkuParam(rawSku);
  const [searchQuery, setSearchQuery] = useState(initialSku);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);
  const [ignoreMaintainedLote, setIgnoreMaintainedLote] = useState(false);
  const [loteDraftConfirmed, setLoteDraftConfirmed] = useState(false);
  const [gs1LoteWedgeValue, setGs1LoteWedgeValue] = useState('');
  const [gs1PesoWedgeValue, setGs1PesoWedgeValue] = useState('');
  const [gs1NonPvarScanValue, setGs1NonPvarScanValue] = useState('');
  const [nonPvarGs1FocusKey, setNonPvarGs1FocusKey] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [paleteSheetOpen, setPaleteSheetOpen] = useState(false);
  const [paleteSheetIntent, setPaleteSheetIntent] = useState<PaleteSheetIntent>('default');
  const pendingConferenceRef = useRef<DetalheItemForm | null>(null);
  const pendingFocusRef = useRef<PvarFocusAfterSubmit>('gs1-peso');
  const gs1LoteInputRef = useRef<HTMLInputElement>(null);
  const gs1PesoInputRef = useRef<HTMLInputElement>(null);
  const gs1NonPvarScanRef = useRef<HTMLInputElement>(null);
  const pesoInputRef = useRef<HTMLInputElement>(null);
  const previousEffectiveLoteRef = useRef('');
  const { process } = useProcessV2(demandId);
  const parametrosConferencia = useParametrosConferenciaV2(process?.unidadeId);
  const { results: searchResults, isSearching } = useProductSearchQuery(searchQuery);
  const { conferirItem, deletarConferencia, getConferenciasBySku } = useConferenciaV2(demandId);

  const logDetalheItemDebug = (
    stage: string,
    extra: Record<string, unknown> = {},
  ) => {
    // eslint-disable-next-line no-console
    console.log('DETALHE_ITEM_DEBUG', {
      stage,
      demandId,
      skuParam: rawSku,
      hasSelectedProduct: Boolean(selectedProduct),
      parametrosConferencia,
      paleteSheetOpen,
      paleteSheetIntent,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  };

  const produtoConfig = useMemo(
    () =>
      selectedProduct
        ? resolveProdutoConferenciaV2(selectedProduct, parametrosConferencia)
        : null,
    [selectedProduct, parametrosConferencia],
  );

  const schema = useMemo(
    () =>
      buildDetalheItemSchema({
        pesoVariavel: produtoConfig?.pesoVariavel ?? false,
        exigirEtiquetaPesoVariavel: produtoConfig?.exigirEtiquetaPesoVariavel ?? false,
        quantidadeModo: parametrosConferencia.quantidadeModo,
        loteModo: parametrosConferencia.loteModo,
        // v2: palete via PaleteV2Toolbar (sessão), não campo idPalete no formulário
        controlaPalete: false,
      }),
    [produtoConfig, parametrosConferencia],
  );

  const schemaConfigKey = useMemo(
    () =>
      [
        produtoConfig?.pesoVariavel ?? false,
        produtoConfig?.exigirEtiquetaPesoVariavel ?? false,
        parametrosConferencia.quantidadeModo,
        parametrosConferencia.loteModo,
      ].join('|'),
    [produtoConfig, parametrosConferencia],
  );

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<DetalheItemForm>({
    resolver: async (values, context, options) =>
      zodResolver(schemaRef.current)(values, context, options),
    defaultValues: {
      ...EMPTY_DETALHE_ITEM_FORM,
      sku: initialSku ?? '',
    },
  });

  useEffect(() => {
    clearErrors();
  }, [schemaConfigKey]);

  const watchedSku = watch('sku');
  const loteValue = watch('lote');
  const validadeValue = watch('validade');
  const recebidaCaixa = watch('recebidaCaixa') ?? '';
  const recebidaUnidade = watch('recebidaUnidade') ?? '';
  const pesoValue = watch('peso') ?? '';
  const etiquetaValue = watch('etiqueta') ?? '';
  const conferences = useMemo(
    () => getConferenciasBySku(selectedProduct?.sku ?? watchedSku),
    [getConferenciasBySku, selectedProduct?.sku, watchedSku],
  );
  const conferenceLoteEntries = useMemo(
    () =>
      conferences.map((record) => ({
        lote: record.lote,
        validade: record.validade ?? record.fabricacao,
      })),
    [conferences],
  );
  const activeSku = selectedProduct?.sku ?? watchedSku;
  const unidadesPorCaixa = selectedProduct
    ? resolveUnidadesPorCaixa(selectedProduct.unidadesPorCaixa)
    : 1;

  const { quantidadeModo, loteModo } = parametrosConferencia;
  const isPvar = produtoConfig?.pesoVariavel ?? false;

  const showCaixa =
    !isPvar && (quantidadeModo === 'caixa' || quantidadeModo === 'ambos');
  const showUnidade =
    !isPvar && (quantidadeModo === 'unidade' || quantidadeModo === 'ambos');
  const quantidadeGridClass =
    showCaixa && showUnidade ? 'grid-cols-2' : 'grid-cols-1';

  const showLote = loteModo === 'lote' || loteModo === 'ambos';
  const showValidade = loteModo === 'fabricacao' || loteModo === 'ambos';

  const hasMaintainedLoteFromConferidos = conferences.some((entry) => entry.lote?.trim());
  const maintainedLoteContext = useMemo(
    () =>
      resolveMaintainedLoteContext(
        isPvar && !loteDraftConfirmed && !hasMaintainedLoteFromConferidos
          ? { lote: '', validade: '' }
          : { lote: loteValue, validade: validadeValue },
        conferenceLoteEntries,
        { ignoreExisting: ignoreMaintainedLote },
      ),
    [
      conferenceLoteEntries,
      hasMaintainedLoteFromConferidos,
      ignoreMaintainedLote,
      isPvar,
      loteDraftConfirmed,
      loteValue,
      validadeValue,
    ],
  );
  const showMaintainedLote =
    showLote &&
    isPvar &&
    (hasMaintainedLoteFromConferidos || loteDraftConfirmed) &&
    !!maintainedLoteContext.lote;
  const showLoteInput = showLote && (!isPvar || !showMaintainedLote);
  const showPvarGs1LoteScan = isPvar && !showMaintainedLote;
  const showPvarGs1PesoScan = isPvar && showMaintainedLote;
  const showConferenciaActionBar = Boolean(
    selectedProduct && (isPvar ? showPvarGs1PesoScan : true),
  );
  const keyboardInset = useVisualViewportInset();
  const keyboardOpen = keyboardInset > 0;
  const showFixedActionBar = showConferenciaActionBar && !keyboardOpen;
  const contentBottomPaddingClass = showFixedActionBar
    ? saveError
      ? 'pb-safe-offset-36'
      : 'pb-safe-offset-32'
    : undefined;
  const effectiveLote = maintainedLoteContext.lote || loteValue;

  const fabricacaoFromLote = useMemo(() => {
    if (!showLote || isPvar || !canParseFabricacaoFromLote(effectiveLote)) {
      return null;
    }
    if (
      looksLikeGs1TraceabilityBarcode(effectiveLote) ||
      looksLikeGs1WeightBarcode(effectiveLote)
    ) {
      return null;
    }
    return parseFabricacaoFromLote(effectiveLote);
  }, [effectiveLote, isPvar, showLote]);

  const showValidadeInput = showValidade;

  const conferidoTotaisPvar = useMemo(
    () =>
      conferences.reduce(
        (acc, record) => ({
          caixa: acc.caixa + (record.recebidaCaixa ?? 1),
          peso: acc.peso + (record.peso ?? 0),
        }),
        { caixa: 0, peso: 0 },
      ),
    [conferences],
  );

  const conferencesByPalete = useMemo(() => {
    if (!isPvar) return null;
    const groups = new Map<string, ConferenceRecord[]>();
    for (const record of conferences) {
      const key = record.unitizadorCodigo ?? '(sem palete)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }
    return Array.from(groups.entries()).map(([paleteCodigo, records]) => ({
      paleteCodigo,
      records,
      caixa: records.reduce((sum, record) => sum + (record.recebidaCaixa ?? 1), 0),
      peso: records.reduce((sum, record) => sum + (record.peso ?? 0), 0),
    }));
  }, [isPvar, conferences]);

  const conferidoTotaisNonPvar = useMemo(
    () =>
      resolveConferidoTotaisForSkuV2(
        conferences,
        activeSku,
        quantidadeModo,
        unidadesPorCaixa,
      ),
    [activeSku, conferences, quantidadeModo, unidadesPorCaixa],
  );

  useEffect(() => {
    const loteChanged = previousEffectiveLoteRef.current !== effectiveLote;
    previousEffectiveLoteRef.current = effectiveLote;

    if (!loteChanged) {
      return;
    }

    if (fabricacaoFromLote?.ok && !validadeValue?.trim()) {
      setValue('validade', fabricacaoFromLote.isoDate, { shouldValidate: true });
      return;
    }

    if (fabricacaoFromLote && !fabricacaoFromLote.ok && effectiveLote.trim() && !validadeValue?.trim()) {
      setValue('validade', '', { shouldValidate: true });
    }
  }, [fabricacaoFromLote, effectiveLote, setValue, validadeValue]);

  const focusGs1LoteInput = useCallback(() => {
    window.setTimeout(() => {
      gs1LoteInputRef.current?.focus();
    }, 100);
  }, []);

  const focusGs1PesoInput = useCallback(() => {
    window.setTimeout(() => {
      gs1PesoInputRef.current?.focus();
    }, 100);
  }, []);

  const focusGs1NonPvarScanInput = useCallback(() => {
    setNonPvarGs1FocusKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (nonPvarGs1FocusKey === 0 || isPvar || !selectedProduct) {
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const tryFocus = () => {
      if (cancelled) return;

      const input = gs1NonPvarScanRef.current;
      if (input) {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== input) {
          document.activeElement.blur();
        }
        input.focus({ preventScroll: true });
        if (document.activeElement === input) {
          return;
        }
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryFocus, 50);
      }
    };

    const frameId = window.requestAnimationFrame(tryFocus);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [isPvar, nonPvarGs1FocusKey, selectedProduct]);

  const focusPesoInput = useCallback(() => {
    window.setTimeout(() => {
      pesoInputRef.current?.focus();
    }, 100);
  }, []);

  const focusPvarAfterSubmit = useCallback(
    (target: PvarFocusAfterSubmit) => {
      if (target === 'peso') {
        focusPesoInput();
        return;
      }
      if (target === 'gs1-peso') {
        focusGs1PesoInput();
        return;
      }
      focusGs1LoteInput();
    },
    [focusGs1LoteInput, focusGs1PesoInput, focusPesoInput],
  );

  useEffect(() => {
    if (!isPvar || !selectedProduct) return;
    if (showMaintainedLote) {
      focusGs1PesoInput();
      return;
    }
    focusGs1LoteInput();
  }, [focusGs1LoteInput, focusGs1PesoInput, isPvar, selectedProduct?.sku, showMaintainedLote]);

  useEffect(() => {
    if (!initialSku) return;

    let cancelled = false;

    void (async () => {
      const product = await resolveProductForConferenciaV2(
        demandId,
        initialSku,
        process?.unidadeId,
      );
      if (cancelled) return;

      if (isResolvableCatalogProduct(product)) {
        setSelectedProduct(product);
        setValue('sku', product.sku);
        setSearchQuery('');
        setSaveError(null);
        return;
      }

      setSelectedProduct(null);
      setSaveError(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);
      setValue('sku', initialSku);
      setSearchQuery('');
    })();

    return () => {
      cancelled = true;
    };
  }, [demandId, initialSku, process?.unidadeId, setValue]);

  async function selectProduct(product: ProductRecord) {
    hapticLight();
    const resolved = await resolveProductForConferenciaV2(
      demandId,
      product.sku,
      process?.unidadeId,
    );

    if (!isResolvableCatalogProduct(resolved)) {
      setSaveError(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);
      return;
    }

    setSelectedProduct(resolved);
    setValue('sku', resolved.sku);
    setSearchQuery('');
    setIgnoreMaintainedLote(false);
    setLoteDraftConfirmed(false);
    setSaveError(null);
  }

  const resetFormAfterBox = useCallback(
    (sku: string, maintained?: { lote?: string; validade?: string }) => {
      reset(
        buildFormForLoteEntry(sku, '', {
          lote: maintained?.lote,
          validade: maintained?.validade,
        }),
      );
      setGs1LoteWedgeValue('');
      setGs1PesoWedgeValue('');
      setIgnoreMaintainedLote(false);
      setLoteDraftConfirmed(Boolean(maintained?.lote));
    },
    [reset],
  );

  const executeConferencia = useCallback(
    async (form: DetalheItemForm, focusAfter: PvarFocusAfterSubmit = 'gs1-peso') => {
      if (!selectedProduct || !produtoConfig) return;

      setSaveError(null);
      const fabricacao = form.validade || undefined;
      const maintained = resolveMaintainedLoteContext(form, conferenceLoteEntries, {
        ignoreExisting: ignoreMaintainedLote,
      });
      const resolvedProduct = await resolveProductForConferenciaV2(
        demandId,
        form.sku,
        process?.unidadeId,
      );

      if (!isResolvableCatalogProduct(resolvedProduct)) {
        throw new Error(CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG);
      }

      await conferirItem({
        demandId,
        sku: resolvedProduct.sku,
        product: resolvedProduct,
        parametros: parametrosConferencia,
        lote: isPvar ? maintained.lote || form.lote || undefined : form.lote || undefined,
        validade: isPvar ? maintained.validade || fabricacao : fabricacao,
        fabricacao: isPvar ? maintained.validade || fabricacao : fabricacao,
        recebidaCaixa: isPvar ? 0 : Number(form.recebidaCaixa) || 0,
        recebidaUnidade: isPvar ? 0 : Number(form.recebidaUnidade) || 0,
        peso: form.peso ? Number(form.peso) : undefined,
        etiquetaCodigo: form.etiqueta?.trim() || undefined,
      });

      if (isPvar) {
        resetFormAfterBox(form.sku, {
          lote: maintained.lote,
          validade: maintained.validade,
        });
      } else {
        reset({
          ...EMPTY_DETALHE_ITEM_FORM,
          sku: form.sku,
        });
        setGs1NonPvarScanValue('');
        focusGs1NonPvarScanInput();
      }
      toast.success(isPvar ? 'Caixa conferida' : 'Conferência registrada');
      if (isPvar) {
        focusPvarAfterSubmit(focusAfter);
      }
    },
    [
      conferenceLoteEntries,
      conferirItem,
      demandId,
      focusGs1NonPvarScanInput,
      focusPvarAfterSubmit,
      ignoreMaintainedLote,
      isPvar,
      parametrosConferencia,
      process?.unidadeId,
      produtoConfig,
      resetFormAfterBox,
      reset,
      selectedProduct,
    ],
  );

  const submitConference = useCallback(
    async (form: DetalheItemForm, focusAfter: PvarFocusAfterSubmit = 'gs1-peso') => {
      if (!selectedProduct || !produtoConfig) {
        logDetalheItemDebug('submitConference_missingProductOrConfig', {
          hasSelectedProduct: Boolean(selectedProduct),
          hasProdutoConfig: Boolean(produtoConfig),
          form,
        });
        return;
      }

      let formToSubmit = form;

      if (!isPvar && form.lote?.trim()) {
        const { form: resolved, error } = resolveNonPvarLoteOnSubmit(form);
        if (error) {
          throw new Error(error);
        }
        formToSubmit = resolved;
      }

      if (isPvar) {
        const validationError = validatePvarBoxDraft(formToSubmit, {
          existingLotes: conferenceLoteEntries,
          ignoreMaintainedLote,
          controlaLote: produtoConfig.controlaLote,
          controlaValidade: produtoConfig.controlaValidade,
          loteModo: parametrosConferencia.loteModo,
        });
        if (validationError) {
          throw new Error(validationError);
        }
      }

      logDetalheItemDebug('submitConference_beforePaleteCheck', {
        isPvar,
        form: formToSubmit,
      });

      if (isPvar || parametrosConferencia.controlaPalete) {
        const activePalete = await getActivePaleteCodigo(demandId);
        if (!activePalete) {
          logDetalheItemDebug('submitConference_missingPalete', {
            form: formToSubmit,
          });
          pendingConferenceRef.current = formToSubmit;
          pendingFocusRef.current = focusAfter;
          setPaleteSheetIntent('conferencia-pendente');
          setPaleteSheetOpen(true);
          setSaveError(null);
          return;
        }
      }

      logDetalheItemDebug('submitConference_beforeExecute', {
        form: formToSubmit,
      });
      await executeConferencia(formToSubmit, focusAfter);
    },
    [
      conferenceLoteEntries,
      demandId,
      executeConferencia,
      ignoreMaintainedLote,
      isPvar,
      parametrosConferencia,
      produtoConfig,
      selectedProduct,
    ],
  );

  const handleConferenciaError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Erro ao conferir item';
    if (message === PALETE_OBRIGATORIO_MSG) {
      logDetalheItemDebug('handleConferenciaError_paleteObrigatorio', {
        errorMessage: message,
      });
      setPaleteSheetIntent('conferencia-pendente');
      setPaleteSheetOpen(true);
      setSaveError(null);
      return;
    }
    logDetalheItemDebug('handleConferenciaError_generic', {
      errorMessage: message,
      error:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : String(err),
    });
    setSaveError(message);
    toast.error(message);
  }, [logDetalheItemDebug]);

  const handlePaleteConfirm = useCallback(
    async (codigo: string) => {
      const previous = await getActivePaleteCodigo(demandId);
      await setActivePaleteV2(demandId, codigo);
      hapticMedium();

      const pendingForm = pendingConferenceRef.current;
      const shouldSavePending =
        paleteSheetIntent === 'conferencia-pendente' && pendingForm != null;

      if (shouldSavePending) {
        try {
          await executeConferencia(pendingForm, pendingFocusRef.current);
          pendingConferenceRef.current = null;
          setPaleteSheetIntent('default');
        } catch (err) {
          pendingConferenceRef.current = pendingForm;
          handleConferenciaError(err);
          throw err;
        }
        return;
      }

      if (previous === codigo) {
        toast.message('Palete mantido');
        return;
      }

      toast.success(previous ? `Palete alterado para ${codigo}` : `Palete ${codigo} definido`);
    },
    [demandId, executeConferencia, handleConferenciaError, paleteSheetIntent],
  );

  const handlePaleteSheetOpenChange = useCallback((open: boolean) => {
    setPaleteSheetOpen(open);
    if (open && pendingConferenceRef.current == null) {
      setPaleteSheetIntent('default');
    }
    if (!open) {
      pendingConferenceRef.current = null;
      setPaleteSheetIntent('default');
    }
  }, []);

  const onInvalidSubmit = useCallback((fieldErrors: Record<string, { message?: string } | undefined>) => {
    const message = resolveFirstFormError(fieldErrors);
    if (message) {
      logDetalheItemDebug('onInvalidSubmit', {
        fieldErrors,
        firstMessage: message,
      });
      setSaveError(message);
      toast.error(message);
    }
  }, [logDetalheItemDebug]);

  const syncNonPvarLoteResolution = useCallback((): string | null => {
    if (isPvar) {
      return null;
    }

    const { form: resolved, changed, error } = applyNonPvarLoteResolution(getValues());
    if (error) {
      logDetalheItemDebug('syncNonPvarLoteResolution_error', {
        error,
        rawForm: getValues(),
      });
      return error;
    }

    if (changed) {
      logDetalheItemDebug('syncNonPvarLoteResolution_changed', {
        before: getValues(),
        resolved,
      });
      setValue('lote', resolved.lote ?? '', { shouldDirty: true, shouldValidate: false });
      setValue('validade', resolved.validade ?? '', { shouldDirty: true, shouldValidate: false });
      clearErrors(['lote', 'validade']);
    }

    return null;
  }, [clearErrors, getValues, isPvar, logDetalheItemDebug, setValue]);

  const triggerConferenciaSubmit = useCallback(() => {
    const resolutionError = syncNonPvarLoteResolution();
    if (resolutionError) {
      logDetalheItemDebug('triggerConferenciaSubmit_resolutionError', {
        resolutionError,
      });
      setSaveError(resolutionError);
      toast.error(resolutionError);
      return;
    }

    logDetalheItemDebug('triggerConferenciaSubmit_beforeHandleSubmit', {
      form: getValues(),
    });
    setSaveError(null);
    void handleSubmit(onSubmit, onInvalidSubmit)();
  }, [getValues, handleSubmit, logDetalheItemDebug, onInvalidSubmit, syncNonPvarLoteResolution]);

  const handleFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isPvar) {
        void handleSubmit(onSubmit, onInvalidSubmit)(event);
        return;
      }
      triggerConferenciaSubmit();
    },
    [handleSubmit, isPvar, onInvalidSubmit, triggerConferenciaSubmit],
  );

  const handleNonPvarLoteKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter' || isPvar) return;
      event.preventDefault();

      const resolutionError = syncNonPvarLoteResolution();
      if (resolutionError) {
        setSaveError(resolutionError);
        return;
      }

      setSaveError(null);
      hapticMedium();
    },
    [isPvar, syncNonPvarLoteResolution],
  );

  const handleGs1NonPvarScanKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isScannerSubmitKey(event.key) || isPvar) return;
      event.preventDefault();

      const text = normalizeGs1ScannerInput(gs1NonPvarScanValue);
      if (!text) return;

      const result = applyGs1NonPvarScanInput(text);
      if (!result.applied) {
        toast.error('Código GS1 inválido ou sem dados de lote/quantidade');
        return;
      }

      if (result.lote) {
        setValue('lote', result.lote, { shouldDirty: true });
      }
      if (result.fabricacao) {
        setValue('validade', result.fabricacao, { shouldDirty: true });
      }
      if (result.quantidadeCaixas != null) {
        setValue('recebidaCaixa', String(result.quantidadeCaixas), { shouldValidate: true });
      }

      setGs1NonPvarScanValue('');
      hapticLight();
      clearErrors(['lote', 'validade', 'recebidaCaixa']);
    },
    [clearErrors, gs1NonPvarScanValue, isPvar, setValue],
  );

  async function onSubmit(form: DetalheItemForm) {
    if (!selectedProduct) {
      logDetalheItemDebug('onSubmit_noSelectedProduct', {
        form,
      });
      return;
    }

    try {
      logDetalheItemDebug('onSubmit_start', {
        form,
        selectedProduct: {
          produtoId: selectedProduct.produtoId,
          sku: selectedProduct.sku,
        },
        isPvar,
      });
      hapticMedium();
      if (isPvar) {
        syncMaintainedLoteFieldsForSubmit(
          { getValues, setValue },
          conferenceLoteEntries,
          ignoreMaintainedLote,
        );
        await submitConference(getValues());
        return;
      }

      await submitConference(form);
    } catch (err) {
      handleConferenciaError(err);
    }
  }

  const handleAddCaixa = useCallback(() => {
    hapticMedium();
    syncMaintainedLoteFieldsForSubmit(
      { getValues, setValue },
      conferenceLoteEntries,
      ignoreMaintainedLote,
    );

    void handleSubmit(
      async (form) => {
        try {
          await submitConference(form, 'peso');
        } catch (err) {
          handleConferenciaError(err);
        }
      },
      onInvalidSubmit,
    )();
  }, [
    conferenceLoteEntries,
    getValues,
    handleConferenciaError,
    handleSubmit,
    ignoreMaintainedLote,
    onInvalidSubmit,
    setValue,
    submitConference,
  ]);

  const handlePesoKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isScannerSubmitKey(event.key) || !isPvar) return;
      event.preventDefault();
      handleAddCaixa();
    },
    [handleAddCaixa, isPvar],
  );

  const submitGs1LoteWedge = useCallback(
    async (raw?: string) => {
      const text = normalizeGs1ScannerInput(raw ?? gs1LoteWedgeValue);
      if (!text) return;

      if (looksLikeGs1WeightBarcode(text)) {
        setSaveError('Use o campo GS1 de peso para bipar o peso');
        return;
      }

      const resolved = resolveLoteFieldInput(text);
      if (!resolved.lote) {
        setSaveError('Lote inválido ou incompleto');
        return;
      }

      setSaveError(null);
      setValue('lote', resolved.lote, { shouldDirty: true, shouldValidate: true });
      if (resolved.validade) {
        setValue('validade', resolved.validade, { shouldDirty: true, shouldValidate: true });
      }
      setIgnoreMaintainedLote(false);
      setLoteDraftConfirmed(true);
      setGs1LoteWedgeValue('');
      hapticMedium();
      focusGs1PesoInput();
    },
    [focusGs1PesoInput, gs1LoteWedgeValue, setValue],
  );

  const submitGs1PesoWedge = useCallback(
    async (raw?: string) => {
      const text = normalizeGs1ScannerInput(raw ?? gs1PesoWedgeValue);
      if (!text) return;

      const result = applyGs1BarcodeInput(text);
      if (!result.applied || !result.pesoKg) {
        setSaveError('Código GS1 de peso inválido ou incompleto');
        return;
      }

      setSaveError(null);
      setValue('peso', result.pesoKg, { shouldDirty: true, shouldValidate: true });
      setGs1PesoWedgeValue('');
      hapticMedium();

      syncMaintainedLoteFieldsForSubmit(
        { getValues, setValue },
        conferenceLoteEntries,
        ignoreMaintainedLote,
      );

      void handleSubmit(
        async (form) => {
          try {
            await submitConference(form, 'gs1-peso');
          } catch (err) {
            handleConferenciaError(err);
            focusGs1PesoInput();
          }
        },
        (fieldErrors) => {
          onInvalidSubmit(fieldErrors);
          focusGs1PesoInput();
        },
      )();
    },
    [
      conferenceLoteEntries,
      focusGs1PesoInput,
      getValues,
      gs1PesoWedgeValue,
      handleConferenciaError,
      handleSubmit,
      ignoreMaintainedLote,
      onInvalidSubmit,
      setValue,
      submitConference,
    ],
  );

  const handleGs1LoteKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isScannerSubmitKey(event.key)) return;
      event.preventDefault();
      void submitGs1LoteWedge(event.currentTarget.value);
    },
    [submitGs1LoteWedge],
  );

  const handleGs1PesoKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isScannerSubmitKey(event.key)) return;
      event.preventDefault();
      void submitGs1PesoWedge(event.currentTarget.value);
    },
    [submitGs1PesoWedge],
  );

  const startLoteChange = useCallback(() => {
    hapticLight();
    setIgnoreMaintainedLote(true);
    setLoteDraftConfirmed(false);
    setSaveError(null);
    setValue('lote', '', { shouldValidate: false });
    setValue('validade', '', { shouldValidate: false });
    setValue('peso', '', { shouldValidate: false });
    setGs1PesoWedgeValue('');
    setGs1LoteWedgeValue('');
    focusGs1LoteInput();
  }, [focusGs1LoteInput, setValue]);

  const handlePesoInputChange = useCallback(
    (raw: string) => {
      setValue('peso', raw.replace(',', '.'), { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  async function handleDelete(conferenceId: string) {
    try {
      await deletarConferencia(conferenceId);
      toast.success('Conferência removida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  }

  const product = selectedProduct;

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="px-margin-mobile pb-3 pt-3">
          <div className="flex items-start gap-3">
            <Link
              to="/recebimento-v2/$id/itens"
              params={{ id: demandId }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="line-clamp-2 text-headline-sm font-bold leading-snug text-on-surface">
                {product ? product.description : 'Conferir item'}
              </h1>
              {product ? (
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-label-sm text-muted-foreground">{product.sku}</p>
                  {isPvar ? (
                    <span className="inline-flex items-center rounded-full border border-secondary/30 bg-secondary-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-secondary-container">
                      Peso variável
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {activeSku ? (
              <Link
                to="/recebimento-v2/$id/avarias"
                params={{ id: demandId }}
                search={{ sku: activeSku }}
                onClick={() => hapticLight()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-destructive touch-manipulation transition-transform active:scale-90"
                aria-label="Registrar avaria"
              >
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden />
              </Link>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
            <PaleteV2Toolbar
              demandId={demandId}
              controlaPalete={isPvar || parametrosConferencia.controlaPalete}
              variant="header"
              open={paleteSheetOpen}
              onOpenChange={handlePaleteSheetOpenChange}
              sheetIntent={paleteSheetIntent}
              onConfirmPalete={handlePaleteConfirm}
              allowAutoGenerate={isPvar}
            />
            <TemperaturaProdutoV2ModalButton demandId={demandId} />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mt-4 space-y-5 px-margin-mobile',
          contentBottomPaddingClass,
        )}
        style={
          keyboardOpen
            ? { paddingBottom: `${keyboardInset + 24}px` }
            : undefined
        }
      >
        {!product && (
          <div className="space-y-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por SKU ou descrição (offline)"
                className="w-full rounded-lg border border-input bg-surface py-2.5 pl-9 pr-3 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                aria-label="Buscar produto"
              />
              {isSearching && (
                <Loader2
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="divide-y divide-outline-variant/50 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-sm">
                {searchResults.map((p) => (
                  <button
                    key={p.sku}
                    type="button"
                    onClick={() => selectProduct(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left touch-manipulation active:bg-surface-container"
                  >
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-medium text-on-surface">
                        {p.description}
                      </p>
                      <p className="text-label-sm text-muted-foreground">SKU: {p.sku}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-muted-foreground">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                <p className="text-body-sm">Nenhum produto encontrado no catálogo offline</p>
              </div>
            )}
          </div>
        )}

        {product && isPvar && conferences.length > 0 && (
          <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container px-3 py-2.5 text-center">
                <span className="block text-label-sm text-on-surface-variant">Caixas</span>
                <span className="font-mono text-headline-md font-semibold text-on-surface">
                  {conferidoTotaisPvar.caixa}
                </span>
              </div>
              <div className="rounded-lg bg-surface-container px-3 py-2.5 text-center">
                <span className="block text-label-sm text-on-surface-variant">Peso total (kg)</span>
                <span className="font-mono text-headline-md font-semibold text-on-surface">
                  {conferidoTotaisPvar.peso > 0 ? conferidoTotaisPvar.peso.toFixed(3) : '—'}
                </span>
              </div>
            </div>
          </article>
        )}

        {product && !isPvar && conferidoTotaisNonPvar.hasConferencia && (
          <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
            <div
              className={cn(
                'grid gap-3',
                showCaixa && showUnidade ? 'grid-cols-2' : 'grid-cols-1',
              )}
            >
              {showCaixa ? (
                <div className="rounded-lg bg-surface-container px-3 py-2.5 text-center">
                  <span className="block text-label-sm text-on-surface-variant">Caixas conferidas</span>
                  <span className="font-mono text-headline-md font-semibold text-on-surface">
                    {conferidoTotaisNonPvar.caixa}
                  </span>
                </div>
              ) : null}
              {showUnidade ? (
                <div className="rounded-lg bg-surface-container px-3 py-2.5 text-center">
                  <span className="block text-label-sm text-on-surface-variant">Unidades conferidas</span>
                  <span className="font-mono text-headline-md font-semibold text-on-surface">
                    {conferidoTotaisNonPvar.unidade}
                  </span>
                </div>
              ) : null}
            </div>
          </article>
        )}

        {product && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <input type="hidden" {...register('sku')} />
            {isPvar ? (
              <>
                <input type="hidden" {...register('lote')} />
                <input type="hidden" {...register('validade')} />
              </>
            ) : null}

            {(showCaixa || showUnidade || !isPvar) ? (
              <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
                {!isPvar ? (
                  <div className="mb-4">
                    <ScanField
                      id="gs1-non-pvar-scan"
                      label="GS1 — Lote / Quantidade"
                      icon={ScanLine}
                      placeholder="Bipe o código GS1 aqui"
                      value={gs1NonPvarScanValue}
                      onChange={(event) => setGs1NonPvarScanValue(event.target.value)}
                      inputRef={gs1NonPvarScanRef}
                      onKeyDown={handleGs1NonPvarScanKeyDown}
                    />
                  </div>
                ) : null}
                {showCaixa || showUnidade ? (
                  <>
                    <p className="mb-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                      Quantidade
                    </p>
                    <div className={cn('grid gap-3', quantidadeGridClass)}>
                  {showCaixa ? (
                    <NumericStepper
                      id="recebida-caixa"
                      label="Recebida caixa"
                      value={recebidaCaixa}
                      onChange={(value) =>
                        setValue('recebidaCaixa', value, { shouldValidate: true })
                      }
                      error={errors.recebidaCaixa?.message}
                    />
                  ) : null}
                  {showUnidade ? (
                    <NumericStepper
                      id="recebida-unidade"
                      label="Recebida unidade"
                      value={recebidaUnidade}
                      onChange={(value) =>
                        setValue('recebidaUnidade', value, { shouldValidate: true })
                      }
                      error={errors.recebidaUnidade?.message}
                    />
                  ) : null}
                </div>
                  </>
                ) : null}
              </article>
            ) : null}

            {showMaintainedLote ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2.5">
                <div>
                  <span className="block text-label-sm text-on-surface-variant">Lote em uso</span>
                  <span className="font-mono text-body-md font-semibold text-on-surface">
                    {maintainedLoteContext.lote}
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={startLoteChange}>
                  Alterar
                </Button>
              </div>
            ) : null}

            {(showLoteInput ||
              showValidadeInput ||
              isPvar ||
              produtoConfig?.controlaPeso) && (
            <article className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
              <p className="mb-3 text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                {isPvar ? 'Conferência caixa a caixa' : 'Lote'}
              </p>
              <div className="space-y-3">
                {isPvar ? (
                  <>
                    {showPvarGs1LoteScan ? (
                      <ScanField
                        id="gs1-lote"
                        label="GS1 — Lote"
                        icon={ScanLine}
                        placeholder="Bipe o código GS1 de lote aqui"
                        value={gs1LoteWedgeValue}
                        onChange={(event) => setGs1LoteWedgeValue(event.target.value)}
                        inputRef={gs1LoteInputRef}
                        onKeyDown={handleGs1LoteKeyDown}
                      />
                    ) : null}

                    {showPvarGs1PesoScan ? (
                      <ScanField
                        id="gs1-peso"
                        label="GS1 — Peso"
                        icon={ScanLine}
                        placeholder="Bipe o código GS1 de peso aqui"
                        value={gs1PesoWedgeValue}
                        onChange={(event) => setGs1PesoWedgeValue(event.target.value)}
                        inputRef={gs1PesoInputRef}
                        onKeyDown={handleGs1PesoKeyDown}
                      />
                    ) : null}

                    {showValidadeInput && showMaintainedLote ? (
                      <div className="space-y-1.5">
                        <label
                          className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface"
                          htmlFor="validade"
                        >
                          <Calendar className="h-3.5 w-3.5" aria-hidden />
                          Fabricação
                        </label>
                        <input
                          id="validade"
                          type="date"
                          value={validadeValue}
                          onChange={(event) =>
                            setValue('validade', event.target.value, { shouldValidate: true })
                          }
                          className={cn(
                            'date-input-mobile h-12 w-full rounded-lg border bg-surface px-3 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                            errors.validade ? 'border-destructive' : 'border-input',
                          )}
                        />
                        {errors.validade?.message ? (
                          <p className="text-label-sm text-destructive">{errors.validade.message}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {showPvarGs1PesoScan ? (
                      <>
                        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
                          Cada registro representa <strong>1 caixa</strong> com seu peso individual.
                        </div>

                        {produtoConfig?.exigirEtiquetaPesoVariavel ? (
                          <ScanField
                            id="etiqueta"
                            label="Etiqueta da caixa"
                            icon={Barcode}
                            placeholder="Escaneie ou digite a etiqueta"
                            registerProps={register('etiqueta')}
                            error={errors.etiqueta?.message}
                          />
                        ) : null}

                        <NumericStepper
                          id="peso"
                          label="Peso da caixa (kg)"
                          inputMode="decimal"
                          step={0.001}
                          value={pesoValue}
                          onChange={handlePesoInputChange}
                          onKeyDown={handlePesoKeyDown}
                          inputRef={pesoInputRef}
                          error={errors.peso?.message}
                        />
                        <p className="text-label-sm text-on-surface-variant">
                          Bipe o GS1 de peso e pressione Enter ou Tab para registrar a caixa
                          automaticamente. Ou informe o peso manualmente e use o botão abaixo.
                        </p>
                      </>
                    ) : (
                      <p className="text-label-sm text-on-surface-variant">
                        Bipe o GS1 de lote e pressione Enter ou Tab para iniciar a conferência
                        deste lote.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {showLoteInput ? (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface" htmlFor="lote">
                          <Hash className="h-3.5 w-3.5" aria-hidden />
                          Lote
                        </label>
                        <input
                          id="lote"
                          {...register('lote')}
                          placeholder="Digite o lote"
                          onKeyDown={handleNonPvarLoteKeyDown}
                          className={cn(
                            'w-full rounded-lg border bg-surface px-3 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                            errors.lote ? 'border-destructive' : 'border-input',
                          )}
                        />
                        {errors.lote?.message ? (
                          <p className="text-label-sm text-destructive">{errors.lote.message}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {showValidadeInput ? (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface" htmlFor="validade">
                          <Calendar className="h-3.5 w-3.5" aria-hidden />
                          Fabricação
                        </label>
                        <input
                          id="validade"
                          type="date"
                          value={validadeValue}
                          onChange={(event) =>
                            setValue('validade', event.target.value, { shouldValidate: true })
                          }
                          className={cn(
                            'date-input-mobile h-12 w-full rounded-lg border bg-surface px-3 py-2.5 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                            errors.validade ? 'border-destructive' : 'border-input',
                          )}
                        />
                        {errors.validade?.message ? (
                          <p className="text-label-sm text-destructive">{errors.validade.message}</p>
                        ) : null}
                        {fabricacaoFromLote?.ok && !validadeValue?.trim() ? (
                          <p className="flex items-start gap-1.5 text-label-sm text-secondary">
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span>
                              Sugerida a partir do lote: {fabricacaoFromLote.display}. Você pode ajustar se necessário.
                            </span>
                          </p>
                        ) : null}
                        {fabricacaoFromLote && !fabricacaoFromLote.ok && effectiveLote.trim() && !validadeValue?.trim() && !isPvar ? (
                          <p className="text-label-sm text-destructive">{fabricacaoFromLote.error}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {produtoConfig?.controlaPeso ? (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface" htmlFor="peso">
                          <Barcode className="h-3.5 w-3.5" aria-hidden />
                          Peso (kg)
                        </label>
                        <input
                          id="peso"
                          type="number"
                          step="0.001"
                          {...register('peso')}
                          placeholder="0.000"
                          className={cn(
                            'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                            errors.peso ? 'border-destructive' : 'border-input',
                          )}
                        />
                        {errors.peso?.message ? (
                          <p className="text-label-sm text-destructive">{errors.peso.message}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {(showLote || isPvar) && conferences.length > 0 ? (
                <div className="mt-4">
                  <CollapsibleRecordCard
                    title={isPvar ? 'Caixas conferidas' : 'Lotes conferidos'}
                    count={conferences.length}
                    expanded={lotesListExpanded}
                    onToggle={() => setLotesListExpanded((prev) => !prev)}
                    emptyMessage={
                      isPvar
                        ? 'Nenhuma caixa conferida ainda. Bipe o GS1 ou informe o peso.'
                        : 'Nenhum lote conferido ainda. Preencha os dados acima e registre a conferência.'
                    }
                  >
                    {conferencesByPalete
                      ? conferencesByPalete.map((group) => (
                          <Fragment key={group.paleteCodigo}>
                            <li className="flex items-center gap-1.5 px-1 pt-2 pb-0.5 first:pt-0">
                              <Package
                                className="h-3 w-3 shrink-0 text-on-surface-variant"
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-on-surface-variant">
                                {group.paleteCodigo}
                              </span>
                              <span className="shrink-0 tabular-nums text-xs text-on-surface-variant/70">
                                {group.caixa} cx
                                {group.peso > 0 ? ` · ${group.peso.toFixed(3)} kg` : ''}
                              </span>
                            </li>
                            {group.records.map((record) => (
                              <RecordListItem
                                key={record.id}
                                onRemove={() => void handleDelete(record.id)}
                                removeLabel={`Excluir caixa ${record.peso ?? ''} kg`}
                              >
                                <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                                  {record.peso ?? '—'} kg
                                </p>
                                <p className="text-label-sm text-on-surface-variant">
                                  {[
                                    '1 cx',
                                    record.lote ? `Lote ${record.lote}` : null,
                                    showValidade && (record.fabricacao || record.validade)
                                      ? `Fab. ${formatIsoDateForDisplay(record.fabricacao ?? record.validade ?? '')}`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' · ') || '—'}
                                </p>
                              </RecordListItem>
                            ))}
                          </Fragment>
                        ))
                      : conferences.map((record) => {
                          const quantidade = resolveConferenceQuantidadePar(
                            record,
                            quantidadeModo,
                            unidadesPorCaixa,
                          );

                          return (
                            <RecordListItem
                              key={record.id}
                              onRemove={() => void handleDelete(record.id)}
                              removeLabel={`Excluir lote ${record.lote || record.validade || ''}`}
                            >
                              <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                                {record.lote || record.validade || '—'}
                              </p>
                              <p className="text-label-sm text-on-surface-variant">
                                {[
                                  showCaixa && quantidade.caixa > 0
                                    ? `${quantidade.caixa} cx`
                                    : null,
                                  showUnidade && quantidade.unidade > 0
                                    ? `${quantidade.unidade} un`
                                    : null,
                                  (produtoConfig?.pesoVariavel || produtoConfig?.controlaPeso) &&
                                  record.peso
                                    ? `${record.peso} kg`
                                    : null,
                                  record.lote ? `Lote ${record.lote}` : null,
                                  showValidade && (record.fabricacao || record.validade)
                                    ? `Fab. ${formatIsoDateForDisplay(record.fabricacao ?? record.validade ?? '')}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </p>
                            </RecordListItem>
                          );
                        })}
                  </CollapsibleRecordCard>
                </div>
              ) : null}
            </article>
            )}

          </form>
        )}

        {!showLote && conferences.length > 0 && (
          <div className="space-y-2">
            <p className="text-label-sm font-medium text-on-surface-variant">
              Registros ({conferences.length})
            </p>
            {conferences.map((record) => (
              <ConferenciaRecordItem
                key={record.id}
                record={record}
                quantidadeModo={quantidadeModo}
                unidadesPorCaixa={unidadesPorCaixa}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      {showFixedActionBar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/60 bg-surface/95 px-margin-mobile pb-safe-offset-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
          {saveError ? (
            <div
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error-container/20 px-3 py-2.5 text-body-sm text-on-error-container"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{saveError}</span>
            </div>
          ) : null}

          {isPvar && showPvarGs1PesoScan ? (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleAddCaixa}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-100 disabled:saturate-75"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <CheckCircle className="h-5 w-5" aria-hidden />
              )}
              {isSubmitting ? 'Salvando caixa...' : 'Adicionar caixa conferida'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={triggerConferenciaSubmit}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-100 disabled:saturate-75"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <CheckCircle className="h-5 w-5" aria-hidden />
              )}
              {isSubmitting ? 'Registrando...' : 'Conferir'}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
