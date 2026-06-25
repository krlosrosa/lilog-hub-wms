import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { AvariaSelectField } from '../components/avaria-select-field';
import {
  useContagemAvaria,
  type ContagemAvariaContext,
} from '../hooks/use-contagem-avaria';
import type { ContagemAvariaOrigem } from '../types/estoque.schema';

interface ContagemAvariaViewProps {
  demandaId: string;
  origem: ContagemAvariaOrigem;
  endereco?: string;
  codigoProduto?: string;
  itemId?: string;
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

function EnderecoContextCard({ context }: { context: ContagemAvariaContext }) {
  return (
    <article className="mb-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Endereço
          </p>
          <p className="font-mono text-headline-md font-bold text-primary">
            {context.endereco}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <div className="flex gap-3 border-t border-outline-variant pt-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container">
          <Package className="h-6 w-6 text-secondary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-label-md font-bold text-primary">SKU: {context.sku}</p>
          <p className="mt-0.5 line-clamp-2 text-body-sm text-on-surface-variant">
            {context.descricao}
          </p>
          {context.lote && (
            <p className="mt-1 text-label-sm text-on-surface-variant">
              Lote: <span className="font-mono font-semibold text-on-surface">{context.lote}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ContagemAvariaView({
  demandaId,
  origem,
  endereco,
  codigoProduto,
  itemId,
}: ContagemAvariaViewProps) {
  const { state, actions } = useContagemAvaria({
    demandaId,
    origem,
    endereco,
    codigoProduto,
    itemId,
  });
  const {
    context,
    form,
    photos,
    isSubmitting,
    errors,
    minPhotos,
    motivoOptions,
    backPath,
  } = state;

  const quantidadeCaixas = form.watch('quantidadeCaixas') ?? 0;
  const quantidadeUnidades = form.watch('quantidadeUnidades') ?? 0;

  return (
    <div className="flex flex-col">
      {actions.hiddenInput}

      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2 px-margin-mobile py-sm">
          <Link
            to={backPath}
            params={{ id: demandaId }}
            aria-label="Voltar"
            onPointerDown={() => hapticLight()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors active:bg-surface-container-low touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold text-on-surface">
              Registro de avaria
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              #{demandaId} · {origem === 'cega' ? 'Contagem cega' : 'Validação'}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-warning-container px-2.5 py-1 text-label-sm font-medium text-on-warning-container">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />
            Avaria
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg px-margin-mobile pb-lg pt-sm">
        <EnderecoContextCard context={context} />

        <section className="exception-glow mb-4 space-y-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-warning" aria-hidden />
            <h2 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
              Dados da avaria
            </h2>
          </div>

          <AvariaSelectField
            id="motivo"
            label="Motivo"
            options={motivoOptions}
            placeholder="Selecione o motivo"
            error={errors.motivo?.message}
            className="h-12 rounded-lg"
            {...actions.register('motivo')}
          />

          <div className="space-y-3 border-t border-outline-variant/50 pt-4">
            <p className="text-label-md text-on-surface-variant">Quantidade avariada</p>
            <div className="grid grid-cols-2 gap-3">
              <NumericStepper
                id="qtd-caixas"
                label="Caixas"
                value={Number(quantidadeCaixas) || 0}
                onChange={(v) =>
                  form.setValue('quantidadeCaixas', v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.quantidadeCaixas?.message}
              />
              <NumericStepper
                id="qtd-unidades"
                label="Unidades"
                value={Number(quantidadeUnidades) || 0}
                onChange={(v) =>
                  form.setValue('quantidadeUnidades', v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                error={errors.quantidadeUnidades?.message}
              />
            </div>
          </div>

          {errors.root?.message && (
            <p className="text-label-sm text-destructive">{errors.root.message}</p>
          )}
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
              <Plus className="h-6 w-6" aria-hidden />
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
                  <Trash2 className="h-4 w-4" aria-hidden />
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
          className={cn(
            'mb-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary text-headline-md shadow-lg touch-manipulation hover:bg-secondary/90 active:scale-[0.98]'
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <CheckCircle className="h-5 w-5" aria-hidden />
          )}
          {isSubmitting ? 'Processando...' : 'Confirmar registro de avaria'}
        </Button>
      </div>
    </div>
  );
}
