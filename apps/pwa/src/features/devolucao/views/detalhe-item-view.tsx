import { Button, cn } from '@lilog/ui';

import { Link } from '@tanstack/react-router';

import {

  AlertTriangle,

  ArrowLeft,

  Barcode,

  CheckCircle,

  Loader2,

  Package,

  PackageCheck,

  QrCode,

  Repeat,

  ScanLine,

} from 'lucide-react';

import type { ChangeEventHandler } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { UseFormRegisterReturn } from 'react-hook-form';



import { hapticLight, hapticMedium } from '@/lib/haptics';

import { QrScannerModal } from '@/components/qr-scanner';



import { useDetalheItem } from '../hooks/use-detalhe-item';
import { useAvariasRegistradas } from '../hooks/use-avarias-registradas';
import {
  CollapsibleRecordCard,
  RecordListItem,
} from '../components/expandable-record-list';



interface DetalheItemViewProps {

  demandId: string;

}



function NumericField({

  id,

  label,

  value,

  onChange,

  error,

  inputMode = 'numeric',

}: {

  id: string;

  label: string;

  value: string;

  onChange: ChangeEventHandler<HTMLInputElement>;

  error?: string;

  inputMode?: 'numeric' | 'decimal';

}) {

  return (

    <div className="space-y-2">

      <label className="text-label-md text-on-surface-variant" htmlFor={id}>

        {label}

      </label>

      <input

        id={id}

        type="number"

        inputMode={inputMode}

        min={0}

        value={value}

        onChange={onChange}

        placeholder="0"

        className="numeric-input h-11 w-full rounded-lg border border-outline-variant bg-surface-bright px-3 text-center font-mono text-headline-md focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30"

      />

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

  onScanClick,

  error,

}: {

  id: string;

  label: string;

  icon: typeof Barcode;

  placeholder: string;

  registerProps: UseFormRegisterReturn<'lote'> | UseFormRegisterReturn<'idPalete'>;

  onScanClick?: () => void;

  error?: string;

}) {

  return (

    <div className="space-y-2">

      <label className="text-label-md text-on-surface-variant" htmlFor={id}>

        {label}

      </label>

      <div className="relative">

        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />

        <input

          id={id}

          type="text"

          placeholder={placeholder}

          autoComplete="off"

          {...registerProps}

          className="h-11 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-12 font-mono text-data-mono focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30"

        />

        {onScanClick ? (

          <button

            type="button"

            aria-label={`Escanear ${label}`}

            onClick={onScanClick}

            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-secondary transition-colors active:bg-surface-container-high touch-manipulation"

          >

            <ScanLine className="h-5 w-5" />

          </button>

        ) : null}

      </div>

      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}

    </div>

  );

}



function SalvarConferenciaBottomDock({
  canSave,
  isSaving,
  onSave,
}: {
  canSave: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <Button
        type="button"
        onClick={() => {
          hapticMedium();
          void onSave();
        }}
        disabled={!canSave || isSaving}
        className={cn(
          'pointer-events-auto flex h-14 w-full items-center justify-center gap-2 rounded-none border-t border-outline-variant text-label-md font-semibold shadow-[0_-4px_16px_rgba(11,28,48,0.08)] touch-manipulation active:scale-[0.99]',
          canSave
            ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
            : 'bg-surface-container-high text-on-surface-variant'
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <PackageCheck className="h-5 w-5" />
            Salvar conferência
          </>
        )}
      </Button>
    </div>,
    document.body
  );
}



export function DetalheItemView({ demandId }: DetalheItemViewProps) {

  const { state, actions } = useDetalheItem(demandId);
  const avarias = useAvariasRegistradas(demandId);

  const {
    item,
    lotesConferidos,
    lotesListExpanded,
    isSubmitting,
    errors,
    form,
    conferidoTotais,
    hasLotesConferidos,
    canSaveConferencia,
    isSavingConferencia,
    scanOpen,
    scanTitle,
  } = state;

  const recebidaCaixa = form.watch('recebidaCaixa') ?? '';

  const recebidaUnidade = form.watch('recebidaUnidade') ?? '';

  const peso = form.watch('peso') ?? '';



  return (

    <div className="flex flex-col">

      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">

        <div className="flex items-center gap-2 px-margin-mobile py-sm">

          <Link

            to="/devolucao/$id/itens"

            params={{ id: demandId }}

            aria-label="Voltar para lista de itens"

            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container-low"

          >

            <ArrowLeft className="h-5 w-5" />

          </Link>

          <div className="min-w-0 flex-1">

            <h1 className="truncate text-headline-md font-semibold text-on-surface">

              Conferência cega

            </h1>

            <p className="truncate font-mono text-label-sm text-on-surface-variant">{item.sku}</p>

          </div>

          {'isNovo' in item && item.isNovo ? (
            <span className="shrink-0 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">
              Item novo
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-container">
              Exp {item.expiry}
            </span>
          )}

        </div>

      </div>



      <div className="px-margin-mobile pb-[calc(56px+env(safe-area-inset-bottom,0px)+16px)] pt-sm">

        <article className="mb-4 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">

          <div className="flex gap-3">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container">

              <Package className="h-8 w-8 text-secondary" />

            </div>

            <div className="min-w-0 flex-1">

              <h2 className="line-clamp-2 text-headline-md font-semibold leading-tight text-on-surface">

                {item.name}

              </h2>

              <p className="mt-1 truncate text-body-sm text-on-surface-variant">

                {item.supplier}

              </p>

              <p className="mt-0.5 font-mono text-label-sm text-on-tertiary-fixed-variant">

                {demandId}

              </p>

            </div>

          </div>

          {'isReentrega' in item && item.isReentrega && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
              <Repeat className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-label-sm font-medium text-primary">Reentrega</span>
              {'quantidadeEsperada' in item && item.quantidadeEsperada !== undefined && (
                <>
                  <span className="text-on-surface-variant/40">·</span>
                  <span className="text-label-sm text-on-surface-variant">
                    Qtd. esperada:{' '}
                    <span className="font-mono font-semibold text-on-surface">
                      {item.quantidadeEsperada}
                    </span>{' '}
                    un
                  </span>
                </>
              )}
            </div>
          )}

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
                    conferidoTotais.caixa > 0 ? 'text-on-surface' : 'text-on-tertiary-fixed-variant'
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
                    conferidoTotais.unidade > 0 ? 'text-on-surface' : 'text-on-tertiary-fixed-variant'
                  )}
                >
                  {conferidoTotais.unidade > 0 ? conferidoTotais.unidade : '—'}
                </span>
              </div>
            </div>
            {hasLotesConferidos && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-label-sm font-medium text-secondary">
                <CheckCircle className="h-4 w-4" aria-hidden />
                {lotesConferidos.length}{' '}
                {lotesConferidos.length === 1 ? 'lote conferido' : 'lotes conferidos'}
              </p>
            )}
          </div>

        </article>



        <form

          className="space-y-4 rounded-xl border border-outline-variant bg-surface p-4 shadow-sm"

          onSubmit={(e) => e.preventDefault()}

        >

          <div className="space-y-3">

            <ScanField

              id="lote"

              label="Lote (batch)"

              icon={Barcode}

              placeholder="Escaneie ou digite o lote"

              registerProps={actions.register('lote')}

              onScanClick={() => actions.openScan('lote')}

              error={errors.lote?.message}

            />

            <ScanField

              id="id-palete"

              label="ID do palete / WMS"

              icon={QrCode}

              placeholder="P-0000-0000"

              registerProps={actions.register('idPalete')}

              onScanClick={() => actions.openScan('idPalete')}

            />

          </div>



          <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">

            Quantidades

          </h3>

          <div className="grid grid-cols-2 gap-3">

            <NumericField

              id="recebida-caixa"

              label="Recebida caixa"

              value={recebidaCaixa}

              onChange={(e) => form.setValue('recebidaCaixa', e.target.value)}

              error={errors.recebidaCaixa?.message}

            />

            <NumericField

              id="recebida-unidade"

              label="Recebida unidade"

              value={recebidaUnidade}

              onChange={(e) => form.setValue('recebidaUnidade', e.target.value)}

              error={errors.recebidaUnidade?.message}

            />

          </div>



          <NumericField

            id="peso"

            label="Peso (kg)"

            inputMode="decimal"

            value={peso}

            onChange={(e) => form.setValue('peso', e.target.value)}

            error={errors.peso?.message}

          />



          <div className="flex flex-col gap-2 border-t border-outline-variant/50 pt-4">
            <Button
              type="button"
              onClick={() => {
                hapticMedium();
                void actions.handleAddLote();
              }}
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-on-secondary text-headline-md shadow-md touch-manipulation hover:bg-secondary/90 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              {isSubmitting ? 'Salvando lote...' : 'Adicionar lote conferido'}
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-error text-error touch-manipulation active:scale-[0.98] hover:bg-error-container/20"
            >
              <Link
                to="/devolucao/$id/avaria"
                params={{ id: demandId }}
                onClick={() => hapticLight()}
              >
                <AlertTriangle className="h-5 w-5" />
                Registrar avaria
              </Link>
            </Button>
          </div>
        </form>

        <div className="mt-4 space-y-3">
        <CollapsibleRecordCard
          title="Lotes conferidos"
          count={lotesConferidos.length}
          expanded={lotesListExpanded}
          onToggle={actions.toggleLotesListExpanded}
          emptyMessage="Nenhum lote conferido ainda. Preencha os dados acima e adicione o primeiro lote."
        >
          {lotesConferidos.map((lote) => (
            <RecordListItem
              key={lote.id}
              onRemove={() => actions.removeLote(lote.id)}
              removeLabel={`Excluir lote ${lote.lote}`}
            >
              <p className="truncate font-mono text-label-md font-semibold text-on-surface">
                {lote.lote}
              </p>
              <p className="text-label-sm text-on-surface-variant">
                {lote.recebidaCaixa} cx · {lote.recebidaUnidade} un · {lote.peso} kg
              </p>
              {lote.idPalete ? (
                <p className="truncate font-mono text-label-sm text-on-tertiary-fixed-variant">
                  Palete {lote.idPalete}
                </p>
              ) : null}
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
                <p className="truncate text-label-sm text-on-tertiary-fixed-variant">
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

      <SalvarConferenciaBottomDock
        canSave={canSaveConferencia}
        isSaving={isSavingConferencia}
        onSave={actions.handleSaveConferencia}
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

