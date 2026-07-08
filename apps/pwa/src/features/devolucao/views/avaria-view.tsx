import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Loader2,
  Package,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { ChangeEventHandler } from 'react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { AvariaSelectField } from '../components/avaria-select-field';
import { useAvaria } from '../hooks/use-avaria';

interface AvariaViewProps {
  demandId: string;
}

function QuantityField({
  id,
  label,
  suffix,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-label-md text-on-surface-variant" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={onChange}
          placeholder="0"
          className="numeric-input h-11 w-full rounded-lg border border-outline-variant bg-surface-bright px-3 pr-10 text-center font-mono text-headline-md focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/30"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-label-sm text-on-surface-variant">
          {suffix}
        </span>
      </div>
      {error ? <p className="text-label-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function AvariaView({ demandId }: AvariaViewProps) {
  const { state, actions } = useAvaria(demandId);
  const {
    item,
    photos,
    isSubmitting,
    errors,
    minPhotos,
    tipoOptions,
    naturezaOptions,
    causaOptions,
    replicarParaTodosConferidos,
    itensConferidosCount,
    podeReplicar,
    form,
    parametrosConferencia,
    conferidoTotais,
  } = state;

  const { quantidadeModo } = parametrosConferencia;
  const showCaixa = quantidadeModo === 'caixa' || quantidadeModo === 'ambos';
  const showUnidade = quantidadeModo === 'unidade' || quantidadeModo === 'ambos';

  const conferidoLabel = (() => {
    if (!conferidoTotais.hasConferencia) {
      return '—';
    }

    const parts: string[] = [];
    if (showCaixa && conferidoTotais.caixa > 0) {
      parts.push(`${conferidoTotais.caixa} cx`);
    }
    if (showUnidade && conferidoTotais.unidade > 0) {
      parts.push(`${conferidoTotais.unidade} un`);
    }

    return parts.length > 0 ? parts.join(' · ') : '—';
  })();

  const quantidadeCaixa = form.watch('quantidadeCaixa') ?? 0;
  const quantidadeUnidade = form.watch('quantidadeUnidade') ?? 0;

  return (
    <div className="flex flex-col">
      {actions.hiddenInput}

      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 px-margin-mobile py-sm">
          <Link
            to="/devolucao/$id"
            params={{ id: demandId }}
            aria-label="Voltar para conferência"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors active:bg-surface-container-low"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold text-on-surface">
              Registro de avaria
            </h1>
            <p className="truncate text-label-sm text-on-surface-variant">
              {item.cargoRef} · Exceção ativa
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-warning-container px-2.5 py-1 text-label-sm font-medium text-on-warning-container">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />
            Avaria
          </span>
        </div>
      </div>

      <div className="px-margin-mobile pb-lg pt-sm">
        <article className="mb-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface-container">
              <Package className="h-7 w-7 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-label-md font-bold text-primary">SKU: {item.sku}</p>
              <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
                {item.description}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-3 py-2 text-center">
              <span className="block text-label-sm text-on-surface-variant">Conferido</span>
              <span className="font-mono text-label-md font-semibold text-on-surface">
                {conferidoLabel}
              </span>
            </div>
            <div className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-3 py-2 text-center">
              <span className="block text-label-sm text-on-surface-variant">Locação</span>
              <span className="font-mono text-label-md font-semibold text-on-surface">
                {item.location}
              </span>
            </div>
          </div>
        </article>

        <section className="exception-glow mb-4 space-y-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-warning" aria-hidden />
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
              Dados da avaria
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-label-md text-on-surface-variant">Quantidade avariada</p>
            <div
              className={cn(
                'grid gap-3',
                showCaixa && showUnidade ? 'grid-cols-2' : 'grid-cols-1',
              )}
            >
              {showCaixa ? (
                <QuantityField
                  id="qtd-caixa"
                  label="Caixas"
                  suffix="cx"
                  value={quantidadeCaixa}
                  onChange={(e) =>
                    form.setValue('quantidadeCaixa', Number(e.target.value) || 0, {
                      shouldValidate: true,
                    })
                  }
                  error={errors.quantidadeCaixa?.message}
                />
              ) : null}
              {showUnidade ? (
                <QuantityField
                  id="qtd-unidade"
                  label="Unidades"
                  suffix="un"
                  value={quantidadeUnidade}
                  onChange={(e) =>
                    form.setValue('quantidadeUnidade', Number(e.target.value) || 0, {
                      shouldValidate: true,
                    })
                  }
                  error={errors.quantidadeUnidade?.message}
                />
              ) : null}
            </div>
          </div>

          <div className="space-y-3 border-t border-outline-variant/50 pt-4">
            <p className="text-label-md text-on-surface-variant">Classificação</p>
            <AvariaSelectField
              id="tipo"
              label="Tipo"
              options={tipoOptions}
              placeholder="Selecione o tipo"
              error={errors.tipo?.message}
              className="h-12 rounded-lg"
              {...actions.register('tipo')}
            />
            <AvariaSelectField
              id="natureza"
              label="Natureza"
              options={naturezaOptions}
              placeholder="Selecione a natureza"
              error={errors.natureza?.message}
              className="h-12 rounded-lg"
              {...actions.register('natureza')}
            />
            <AvariaSelectField
              id="causa"
              label="Causa"
              options={causaOptions}
              placeholder="Selecione a causa"
              error={errors.causa?.message}
              className="h-12 rounded-lg"
              {...actions.register('causa')}
            />
          </div>

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors touch-manipulation',
              podeReplicar
                ? 'border-outline-variant active:bg-surface-container-low'
                : 'cursor-not-allowed border-outline-variant/60 opacity-60',
              replicarParaTodosConferidos &&
                podeReplicar &&
                'border-warning bg-warning-container/20'
            )}
          >
            <input
              type="checkbox"
              disabled={!podeReplicar}
              {...actions.register('replicarParaTodosConferidos')}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-outline text-secondary focus:ring-secondary disabled:cursor-not-allowed"
            />
            <div className="min-w-0 flex flex-col gap-1">
              <span className="text-label-md font-medium text-on-surface">
                Replicar para itens conferidos
              </span>
              <span className="text-label-sm text-on-surface-variant">
                {podeReplicar
                  ? `Aplica nos ${itensConferidosCount} item(ns) já conferido(s) desta demanda.`
                  : 'Conferir itens antes de replicar.'}
              </span>
            </div>
          </label>
        </section>

        <section className="mb-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-on-surface-variant" aria-hidden />
              <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                Evidências
              </h2>
            </div>
            <span className="shrink-0 rounded-lg bg-surface-container px-2.5 py-0.5 text-label-sm text-on-surface-variant">
              mín. {minPhotos} fotos
            </span>
          </div>

          <div className="hide-scrollbar -mx-1 flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                hapticLight();
                actions.capture();
              }}
              className="flex h-[104px] w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant transition-all active:scale-95 hover:border-secondary hover:bg-surface-container-low hover:text-secondary touch-manipulation"
            >
              <Plus className="h-6 w-6" />
              <span className="text-label-sm">Anexar</span>
            </button>
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low"
              >
                <img
                  src={photo.previewUrl}
                  alt={`Evidência ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remover evidência ${index + 1}`}
                  onClick={() => {
                    hapticLight();
                    void actions.removePhoto(photo.id);
                  }}
                  className="absolute right-1.5 top-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/70 text-background touch-manipulation active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void actions.handleSubmit();
          }}
          disabled={isSubmitting}
          className="mb-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary text-headline-md shadow-lg touch-manipulation hover:bg-secondary/90 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          {isSubmitting ? 'Processando...' : 'Confirmar registro de avaria'}
        </Button>
      </div>
    </div>
  );
}
