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
  Loader2,
  Minus,
  Package,
  PackageCheck,
  Plus,
  QrCode,
  ScanLine,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { UseFormRegisterReturn } from 'react-hook-form';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { QrScannerModal } from '@/components/qr-scanner';

import { ChecklistResumoCard } from '../components/checklist-resumo-card';
import { setConferenciaNavigation } from '../lib/conferencia-conferidos-store';
import { setConferenciaEntryStep } from '../lib/conferencia-sku-session';
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

function StepIndicator({ step }: { step: ConferenciaStep }) {
  return (
    <div className="flex items-center gap-2 border-b border-outline-variant/50 px-margin-mobile py-3">
      {([1, 2, 3] as const).map((n) => (
        <div
          key={n}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            n === step ? 'w-8 bg-secondary' : n < step ? 'w-4 bg-secondary/40' : 'w-4 bg-surface-container'
          )}
          aria-hidden
        />
      ))}
      <span className="ml-auto text-label-sm text-on-surface-variant">Etapa {step} de 3</span>
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
}: {
  id: string;
  label: string;
  icon: typeof Barcode;
  placeholder: string;
  registerProps: UseFormRegisterReturn;
  onScanClick?: () => void;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          autoComplete="off"
          {...registerProps}
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

function NumericStepper({
  id,
  label,
  value,
  onChange,
  error,
  step = 1,
  min = 0,
  inputMode = 'numeric' as 'numeric' | 'decimal',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  step?: number;
  min?: number;
  inputMode?: 'numeric' | 'decimal';
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
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
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
  isSavingConferencia,
  onNext,
  onPrev,
  onSave,
}: {
  step: ConferenciaStep;
  canAdvanceStep1: boolean;
  canAdvanceStep2: boolean;
  canSaveConferencia: boolean;
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
    errors,
    form,
    conferidoTotais,
    hasLotesConferidos,
    canSaveConferencia,
    isSavingConferencia,
    saveError,
    canAdvanceStep1,
    canAdvanceStep2,
    scanOpen,
    scanTitle,
    skuValue,
    idPaleteValue,
    produtoConfig,
  } = state;

  const recebidaCaixa = form.watch('recebidaCaixa') ?? '';
  const recebidaUnidade = form.watch('recebidaUnidade') ?? '';
  const peso = form.watch('peso') ?? '';

  const dockHeight = step === 1 ? '72px' : '80px';

  return (
    <div className="page-enter flex flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          {step > 1 ? (
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
              {skuValue || item.sku || 'Etapa ' + step + ' de 3'}
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
        <StepIndicator step={step} />
      </div>

      <div
        className="px-margin-mobile pt-4"
        style={{
          paddingBottom: `calc(${dockHeight} + env(safe-area-inset-bottom, 0px) + 16px)`,
        }}
      >
        <div className="mb-4">
          <ChecklistResumoCard {...checklistResumo} defaultOpen={false} />
        </div>

        {step === 1 ? (
          <StepHeroCard
            icon={QrCode}
            title="ID do Palete / WMS"
            subtitle="Escaneie ou digite o ID do palete para iniciar a conferência"
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
                  <p className="mt-1 truncate font-mono text-label-sm text-on-surface-variant">
                    Palete {idPaleteValue || '—'}
                  </p>
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-surface px-3 py-2.5 text-center">
                    <span className="block text-label-sm text-on-surface-variant">Caixa</span>
                    <span
                      className={cn(
                        'font-mono text-headline-md font-semibold',
                        conferidoTotais.caixa > 0 ? 'text-on-surface' : 'text-on-surface-variant'
                      )}
                    >
                      {conferidoTotais.caixa > 0 ? conferidoTotais.caixa : '—'}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface px-3 py-2.5 text-center">
                    <span className="block text-label-sm text-on-surface-variant">Unidade</span>
                    <span
                      className={cn(
                        'font-mono text-headline-md font-semibold',
                        conferidoTotais.unidade > 0 ? 'text-on-surface' : 'text-on-surface-variant'
                      )}
                    >
                      {conferidoTotais.unidade > 0 ? conferidoTotais.unidade : '—'}
                    </span>
                  </div>
                </div>
                {hasLotesConferidos ? (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-label-sm font-medium text-secondary">
                    <CheckCircle className="h-4 w-4" aria-hidden />
                    {lotesConferidos.length}{' '}
                    {lotesConferidos.length === 1 ? 'lote conferido' : 'lotes conferidos'}
                  </p>
                ) : null}
              </div>
            </article>

            <form
              className="space-y-4 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm"
              onSubmit={(e) => e.preventDefault()}
            >
              <ScanField
                id="lote"
                label="Lote (batch)"
                icon={Barcode}
                placeholder="Escaneie ou digite o lote"
                registerProps={actions.register('lote')}
                onScanClick={() => actions.openScan('lote')}
                error={errors.lote?.message}
              />

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant" htmlFor="validade">
                  Validade / fabricação
                </label>
                <div className="relative">
                  <Calendar
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                    aria-hidden
                  />
                  <input
                    id="validade"
                    type="date"
                    {...actions.register('validade')}
                    className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-4 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
                  />
                </div>
                {errors.validade?.message ? (
                  <p className="text-label-sm text-destructive">{errors.validade.message}</p>
                ) : null}
              </div>

              <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                Quantidades
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <NumericStepper
                  id="recebida-caixa"
                  label="Recebida caixa"
                  value={recebidaCaixa}
                  onChange={(v) => actions.setValue('recebidaCaixa', v, { shouldValidate: true })}
                  error={errors.recebidaCaixa?.message}
                />
                <NumericStepper
                  id="recebida-unidade"
                  label="Recebida unidade"
                  value={recebidaUnidade}
                  onChange={(v) => actions.setValue('recebidaUnidade', v, { shouldValidate: true })}
                  error={errors.recebidaUnidade?.message}
                />
              </div>

              {produtoConfig.pesoVariavel || produtoConfig.controlaPeso ? (
                <NumericStepper
                  id="peso"
                  label="Peso (kg)"
                  inputMode="decimal"
                  step={0.1}
                  value={peso}
                  onChange={(v) => actions.setValue('peso', v, { shouldValidate: true })}
                  error={errors.peso?.message}
                />
              ) : null}

              <div className="flex flex-col gap-2 border-t border-outline-variant/50 pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border-outline-variant text-destructive touch-manipulation active:scale-[0.98] hover:bg-destructive/10"
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
                      });
                      setConferenciaEntryStep(demandId, step);
                    }}
                  >
                    <AlertTriangle className="h-5 w-5" />
                    Registrar avaria
                  </Link>
                </Button>
              </div>
            </form>

            <div className="space-y-3">
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
        isSavingConferencia={isSavingConferencia}
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
