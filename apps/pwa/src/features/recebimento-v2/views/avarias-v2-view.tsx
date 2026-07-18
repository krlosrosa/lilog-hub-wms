import { zodResolver } from '@hookform/resolvers/zod';
import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  Loader2,
  Package,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AvariaSelectField } from '@/features/recebimento/components/avaria-select-field';
import { CollapsibleRecordCard } from '@/features/recebimento/components/expandable-record-list';
import {
  AVARIA_NATUREZA_OPTIONS,
  AVARIA_TIPO_OPTIONS,
  getAvariaCausaOptions,
} from '@/features/recebimento/lib/avaria-labels';
import {
  sumAvariasQuantidade,
  validateAvariaQuantidade,
} from '@/features/recebimento/lib/avaria-quantidade';
import {
  buildAvariaSchema,
  type AvariaForm,
} from '@/features/recebimento/types/recebimento.schema';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { PhotoCaptureHiddenInputV2 } from '../components/photo-capture-hidden-input-v2';
import { useAvariaV2 } from '../hooks/use-avaria-v2';
import { useConferenciaV2 } from '../hooks/use-conferencia-v2';
import { useParametrosConferenciaV2 } from '../hooks/use-parametros-conferencia-v2';
import { usePhotoCaptureV2 } from '../hooks/use-photo-capture-v2';
import { useProcessV2 } from '../hooks/use-process-v2';
import {
  resolveConferidoTotaisForSkuV2,
  resolveConferenceQuantidadePar,
} from '../lib/conferencia-quantidade';
import {
  normalizeSkuParam,
  resolveProductForSkuV2,
  resolveUnidadesPorCaixa,
} from '../lib/resolve-produto-conferencia-v2';
import type { DamageRecord } from '../local-db/schema';
import { recebimentoV2Db } from '../local-db/db';

const MIN_PHOTOS = 2;

function avariaCaptureSessionOwnerId(sessionId: string): string {
  return `avaria-session-${sessionId}`;
}

function formatIsoDateForDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function DamageCard({
  damage,
  onDelete,
}: {
  damage: DamageRecord;
  onDelete: (id: string) => void;
}) {
  const tipo = AVARIA_TIPO_OPTIONS.find((o) => o.value === damage.tipo)?.label ?? damage.tipo;

  return (
    <article className="flex items-start gap-3 rounded-lg border border-outline-variant bg-surface p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-4.5 w-4.5 text-destructive" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body-sm font-semibold text-on-surface">{tipo ?? damage.description}</p>
          {damage.replicarParaTodos ? (
            <span className="rounded-md bg-warning-container/40 px-2 py-0.5 text-label-sm font-medium text-on-surface">
              Replicado
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-label-sm text-muted-foreground">
          {damage.quantity} un
          {damage.lote ? ` · Lote ${damage.lote}` : ''}
        </p>
        {damage.sku && (
          <p className="text-label-sm text-muted-foreground">SKU: {damage.sku}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          hapticLight();
          onDelete(damage.id);
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-destructive touch-manipulation transition-transform active:scale-90"
        aria-label="Remover avaria"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </article>
  );
}

interface AvariasV2ViewProps {
  demandId: string;
  sku?: string;
}

interface AvariaFormV2 extends AvariaForm {
  sku?: string;
  replicarParaTodosConferidos?: boolean;
}

export function AvariasV2View({ demandId, sku: rawSku }: AvariasV2ViewProps) {
  const initialSku = normalizeSkuParam(rawSku);
  const { process } = useProcessV2(demandId);
  const parametrosConferencia = useParametrosConferenciaV2(process?.unidadeId);
  const { quantidadeModo, loteModo } = parametrosConferencia;
  const showCaixa = quantidadeModo === 'caixa' || quantidadeModo === 'ambos';
  const showUnidade = quantidadeModo === 'unidade' || quantidadeModo === 'ambos';
  const quantidadeGridClass =
    showCaixa && showUnidade ? 'grid-cols-2' : 'grid-cols-1';

  const { avarias, registrarAvaria, removerAvaria, limparAvarias, isLoading } =
    useAvariaV2(demandId);
  const { conferences } = useConferenciaV2(demandId);
  const [showForm, setShowForm] = useState(Boolean(initialSku));
  const [captureSessionId, setCaptureSessionId] = useState(() => crypto.randomUUID());
  const [isClearing, setIsClearing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [lotesListExpanded, setLotesListExpanded] = useState(true);

  const activeSku = initialSku;
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState(1);

  useEffect(() => {
    if (!activeSku) {
      setUnidadesPorCaixa(1);
      return;
    }

    void resolveProductForSkuV2(demandId, activeSku).then((product) => {
      setUnidadesPorCaixa(product ? resolveUnidadesPorCaixa(product) : 1);
    });
  }, [activeSku, demandId]);

  const captureOwnerId = avariaCaptureSessionOwnerId(captureSessionId);

  const photoCapture = usePhotoCaptureV2({
    processId: demandId,
    ownerType: 'avaria',
    ownerId: captureOwnerId,
  });

  const lotesConferidos = useMemo(() => {
    if (!activeSku) return [];
    const normalized = normalizeSkuParam(activeSku).toUpperCase();
    return conferences.filter(
      (record) => normalizeSkuParam(record.sku).toUpperCase() === normalized,
    );
  }, [activeSku, conferences]);

  const lotesDisponiveis = useMemo(() => {
    const lotes = new Set<string>();
    for (const record of lotesConferidos) {
      const value = record.lote?.trim();
      if (value) {
        lotes.add(value);
      }
    }
    return [...lotes].sort((a, b) => a.localeCompare(b));
  }, [lotesConferidos]);

  const itensConferidosSkus = useMemo(() => {
    const skus = new Set<string>();
    for (const record of conferences) {
      const normalized = normalizeSkuParam(record.sku).trim();
      if (normalized) {
        skus.add(normalized);
      }
    }
    return [...skus];
  }, [conferences]);

  const podeReplicar = itensConferidosSkus.length > 0;

  const exigeSelecaoLote = lotesDisponiveis.length > 1;
  const showFabricacao = loteModo === 'fabricacao' || loteModo === 'ambos';

  const conferidoTotais = useMemo(() => {
    if (!activeSku) return { caixa: 0, unidade: 0, hasConferencia: false };
    return resolveConferidoTotaisForSkuV2(
      lotesConferidos,
      activeSku,
      quantidadeModo,
      unidadesPorCaixa,
    );
  }, [activeSku, lotesConferidos, quantidadeModo, unidadesPorCaixa]);

  const avariaFormSchema = useMemo(
    () => buildAvariaSchema(quantidadeModo),
    [quantidadeModo],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AvariaFormV2>({
    resolver: zodResolver(avariaFormSchema),
    defaultValues: {
      sku: initialSku ?? '',
      quantidadeCaixa: 0,
      quantidadeUnidade: 0,
      tipo: '',
      natureza: '',
      causa: '',
      lote: '',
      replicarParaTodosConferidos: false,
    },
  });

  const natureza = watch('natureza');
  const loteValue = watch('lote');
  const replicarParaTodosConferidos = watch('replicarParaTodosConferidos') ?? false;
  const replicarAtivo = replicarParaTodosConferidos && podeReplicar;
  const causaOptions = useMemo(() => getAvariaCausaOptions(natureza ?? ''), [natureza]);
  const loteAutoSelect = lotesDisponiveis.length === 1 ? lotesDisponiveis[0]! : null;

  useEffect(() => {
    if (initialSku) {
      setValue('sku', initialSku);
      setCaptureSessionId(crypto.randomUUID());
      setShowForm(true);
    }
  }, [initialSku, setValue]);

  useEffect(() => {
    setValue('causa', '');
  }, [natureza, setValue]);

  useEffect(() => {
    if (!loteAutoSelect || loteValue === loteAutoSelect) {
      return;
    }

    setValue('lote', loteAutoSelect, { shouldValidate: true });
  }, [loteAutoSelect, loteValue, setValue]);

  async function onSubmit(form: AvariaFormV2) {
    const sku = form.sku || activeSku || undefined;
    const replicar = form.replicarParaTodosConferidos && podeReplicar;

    if (replicar) {
      if (itensConferidosSkus.length === 0) {
        toast.error('Não há itens conferidos para replicar avaria');
        return;
      }
    } else if (sku) {
      const conferido = resolveConferidoTotaisForSkuV2(conferences, sku);
      if (!conferido.hasConferencia) {
        toast.error('Produto ainda não conferido');
        return;
      }

      const avariasDoSku = avarias.filter((avaria) => avaria.sku === sku);
      const quantidadeError = validateAvariaQuantidade({
        quantidadeCaixa: form.quantidadeCaixa,
        quantidadeUnidade: form.quantidadeUnidade,
        conferido,
        avariasRegistradas: sumAvariasQuantidade(avariasDoSku),
        quantidadeModo,
      });

      if (quantidadeError) {
        setError(quantidadeError.field, { message: quantidadeError.message });
        return;
      }
    }

    if (photoCapture.photos.length < MIN_PHOTOS) {
      setPhotoError(`Informe pelo menos ${MIN_PHOTOS} fotos de evidência`);
      return;
    }
    setPhotoError(null);

    try {
      hapticMedium();
      await registrarAvaria({
        ...form,
        sku: replicar ? undefined : sku,
        replicarParaTodos: replicar,
        skusAlvo: replicar ? itensConferidosSkus : undefined,
        quantidadeModo,
        mediaIds: photoCapture.getPhotoIds(),
      });
      reset({
        sku: form.sku || activeSku,
        quantidadeCaixa: 0,
        quantidadeUnidade: 0,
        tipo: '',
        natureza: '',
        causa: '',
        lote: '',
        replicarParaTodosConferidos: false,
      });
      setShowForm(false);
      setCaptureSessionId(crypto.randomUUID());
      toast.success(
        replicar
          ? `Avaria replicada para ${itensConferidosSkus.length} item(ns) conferido(s)`
          : 'Avaria registrada',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar avaria');
    }
  }

  async function handleCloseForm() {
    const ownerId = avariaCaptureSessionOwnerId(captureSessionId);
    await recebimentoV2Db.media
      .where('ownerId')
      .equals(ownerId)
      .filter((media) => media.ownerType === 'avaria')
      .delete();

    setPhotoError(null);
    setShowForm(false);
    setCaptureSessionId(crypto.randomUUID());
  }

  async function handleClearAll() {
    if (!confirm('Limpar todas as avarias?')) return;
    setIsClearing(true);
    try {
      await limparAvarias();
      toast.success('Avarias limpas');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setIsClearing(false);
    }
  }

  const filteredAvarias = initialSku
    ? avarias.filter((a) => a.sku === initialSku)
    : avarias;

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v2/$id/itens"
            params={{ id: demandId }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-sm font-bold text-on-surface">Avarias</h1>
            <p className="text-label-sm text-muted-foreground">
              {filteredAvarias.length} registro(s)
              {initialSku ? ` · SKU ${initialSku}` : ''}
            </p>
          </div>

          {avarias.length > 0 && (
            <button
              type="button"
              onClick={() => void handleClearAll()}
              disabled={isClearing}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-label-sm font-medium text-destructive touch-manipulation"
              aria-label="Limpar todas avarias"
            >
              {isClearing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              )}
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-body-md font-semibold text-on-surface">Nova avaria</p>
              <button
                type="button"
                onClick={() => void handleCloseForm()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground touch-manipulation"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {!initialSku && (
              <div className="space-y-1.5">
                <label className="text-label-sm font-medium text-on-surface" htmlFor="sku">
                  SKU
                </label>
                <input
                  id="sku"
                  {...register('sku')}
                  placeholder="Ex: 12345"
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            )}

            <AvariaSelectField
              id="natureza"
              label="Natureza da não conformidade"
              options={AVARIA_NATUREZA_OPTIONS}
              error={errors.natureza?.message}
              {...register('natureza', { required: 'Selecione a natureza' })}
            />

            <AvariaSelectField
              id="tipo"
              label="Tipo da não conformidade"
              options={AVARIA_TIPO_OPTIONS}
              error={errors.tipo?.message}
              {...register('tipo', { required: 'Selecione o tipo' })}
            />

            <AvariaSelectField
              id="causa"
              label="Causa"
              options={causaOptions}
              disabled={!natureza}
              error={errors.causa?.message}
              {...register('causa', { required: 'Selecione a causa' })}
            />

            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors touch-manipulation',
                podeReplicar
                  ? 'border-outline-variant active:bg-surface-container-low'
                  : 'cursor-not-allowed border-outline-variant/60 opacity-60',
                replicarAtivo && 'border-warning bg-warning-container/20',
              )}
            >
              <input
                type="checkbox"
                disabled={!podeReplicar}
                {...register('replicarParaTodosConferidos')}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline text-secondary focus:ring-secondary disabled:cursor-not-allowed"
              />
              <div className="min-w-0 flex flex-col gap-1">
                <span className="text-label-md font-medium text-on-surface">
                  Replicar para todos os itens conferidos
                </span>
                <span className="text-label-sm text-on-surface-variant">
                  {podeReplicar
                    ? `Aplica a mesma avaria nos ${itensConferidosSkus.length} item(ns) já conferido(s) desta demanda.`
                    : 'Conferir itens antes de replicar.'}
                </span>
              </div>
            </label>

            {replicarAtivo ? (
              <p className="rounded-lg border border-warning/30 bg-warning-container/10 px-3 py-2.5 text-label-sm text-on-surface">
                Será aplicado na quantidade conferida de cada item, com o mesmo tipo, natureza, causa e evidências.
              </p>
            ) : null}

            {!replicarAtivo ? (
            <div className={cn('grid gap-3', quantidadeGridClass)}>
              {showCaixa ? (
                <div className="space-y-1.5">
                  <label className="text-label-sm font-medium text-on-surface" htmlFor="quantidadeCaixa">
                    Qtd. caixa
                  </label>
                  <input
                    id="quantidadeCaixa"
                    type="number"
                    min={0}
                    {...register('quantidadeCaixa', { valueAsNumber: true })}
                    className={cn(
                      'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                      errors.quantidadeCaixa ? 'border-destructive' : 'border-input',
                    )}
                  />
                  {errors.quantidadeCaixa?.message ? (
                    <p className="text-label-sm text-destructive">{errors.quantidadeCaixa.message}</p>
                  ) : null}
                </div>
              ) : null}
              {showUnidade ? (
                <div className="space-y-1.5">
                  <label className="text-label-sm font-medium text-on-surface" htmlFor="quantidadeUnidade">
                    Qtd. unidade
                  </label>
                  <input
                    id="quantidadeUnidade"
                    type="number"
                    min={0}
                    {...register('quantidadeUnidade', { valueAsNumber: true })}
                    className={cn(
                      'w-full rounded-lg border bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
                      errors.quantidadeUnidade ? 'border-destructive' : 'border-input',
                    )}
                  />
                  {errors.quantidadeUnidade?.message ? (
                    <p className="text-label-sm text-destructive">{errors.quantidadeUnidade.message}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            ) : null}

            {!replicarAtivo && activeSku && conferidoTotais.hasConferencia && (
              <p className="text-label-sm text-on-surface-variant">
                Conferido para este SKU:
                {showCaixa && conferidoTotais.caixa > 0 ? ` ${conferidoTotais.caixa} cx` : ''}
                {showCaixa && showUnidade && conferidoTotais.caixa > 0 && conferidoTotais.unidade > 0
                  ? ' ·'
                  : ''}
                {showUnidade && conferidoTotais.unidade > 0 ? ` ${conferidoTotais.unidade} un` : ''}
              </p>
            )}

            {!replicarAtivo && activeSku && lotesConferidos.length > 0 ? (
              <CollapsibleRecordCard
                title="Lotes conferidos"
                count={lotesConferidos.length}
                expanded={lotesListExpanded}
                onToggle={() => setLotesListExpanded((prev) => !prev)}
                emptyMessage="Nenhum lote conferido para este SKU."
              >
                {lotesConferidos.map((record) => {
                  const quantidade = resolveConferenceQuantidadePar(
                    record,
                    quantidadeModo,
                    unidadesPorCaixa,
                  );

                  return (
                    <li
                      key={record.id}
                      className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-3 py-2.5"
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
                          record.peso ? `${record.peso} kg` : null,
                          showFabricacao && (record.fabricacao || record.validade)
                            ? `Fab. ${formatIsoDateForDisplay(record.fabricacao ?? record.validade ?? '')}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </li>
                  );
                })}
              </CollapsibleRecordCard>
            ) : null}

            {!replicarAtivo && lotesDisponiveis.length > 0 ? (
              <AvariaSelectField
                id="lote"
                label={exigeSelecaoLote ? 'Lote avariado' : 'Lote'}
                options={lotesDisponiveis.map((lote) => ({
                  value: lote,
                  label: lote,
                }))}
                placeholder={
                  exigeSelecaoLote
                    ? 'Selecione o lote conferido'
                    : 'Selecione o lote (opcional)'
                }
                error={errors.lote?.message}
                className="h-12 rounded-lg"
                {...register('lote')}
              />
            ) : !replicarAtivo ? (
              <div className="space-y-1.5">
                <label className="text-label-sm font-medium text-on-surface" htmlFor="lote">
                  Lote (opcional)
                </label>
                <input
                  id="lote"
                  {...register('lote')}
                  placeholder="Número do lote"
                  className="w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-label-sm font-medium text-on-surface">
                  Evidências fotográficas (mín. {MIN_PHOTOS})
                </p>
                <button
                  type="button"
                  onClick={() => photoCapture.capture()}
                  disabled={photoCapture.isProcessing}
                  className="inline-flex items-center gap-1 text-label-sm text-secondary disabled:opacity-50"
                >
                  {photoCapture.isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Camera className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Capturar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {photoCapture.photos.map((photo, index) => (
                  <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-outline-variant">
                    <img src={photo.previewUrl} alt={`Evidência ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void photoCapture.removePhoto(photo.id)}
                      className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/75 text-background"
                      aria-label={`Remover evidência ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              {photoError && <p className="text-label-sm text-destructive">{photoError}</p>}
              <PhotoCaptureHiddenInputV2
                inputRef={photoCapture.inputRef}
                onChange={photoCapture.handleFileChange}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {isSubmitting
                ? 'Salvando...'
                : replicarAtivo
                  ? 'Replicar avaria'
                  : 'Salvar avaria'}
            </Button>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-container" aria-hidden />
            ))}
          </div>
        ) : filteredAvarias.length === 0 && !showForm ? (
          <div className="py-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-body-md text-muted-foreground">Nenhuma avaria registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAvarias.map((avaria) => (
              <DamageCard
                key={avaria.id}
                damage={avaria}
                onDelete={async (id) => {
                  try {
                    await removerAvaria(id);
                    toast.success('Avaria removida');
                  } catch {
                    toast.error('Erro ao remover avaria');
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
