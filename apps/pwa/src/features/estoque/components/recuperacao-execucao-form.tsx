import { cn } from '@lilog/ui';
import { Camera, Minus, Plus, X } from 'lucide-react';
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import { hapticLight } from '@/lib/haptics';
import type { CapturedPhoto } from '@/lib/offline/hooks/use-photo-capture';

import type { RecuperacaoExecucaoForm } from '../types/recuperacao.schema';

interface RecuperacaoExecucaoFormProps {
  register: UseFormRegister<RecuperacaoExecucaoForm>;
  watch: UseFormWatch<RecuperacaoExecucaoForm>;
  setValue: UseFormSetValue<RecuperacaoExecucaoForm>;
  errors: FieldErrors<RecuperacaoExecucaoForm>;
  qtyMaxima: number;
  photos: CapturedPhoto[];
  disabled?: boolean;
  rootError?: string;
  onCapture: () => void;
  onRemovePhoto: (id: number) => void;
  hiddenInput: React.ReactNode;
}

function NumericStepper({
  id,
  label,
  value,
  max,
  onChange,
  error,
  disabled,
  variant = 'default',
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
  error?: string;
  disabled?: boolean;
  variant?: 'default' | 'secondary';
}) {
  const safeValue = Number.isFinite(value) ? value : 0;

  function adjust(delta: number) {
    if (disabled) return;
    hapticLight();
    onChange(Math.max(0, Math.min(max, safeValue + delta)));
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-label-sm text-on-surface-variant">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center rounded-lg border bg-surface-container',
          variant === 'secondary'
            ? 'border-secondary/40'
            : 'border-destructive/30',
          disabled && 'opacity-60',
        )}
      >
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={disabled || safeValue <= 0}
          aria-label={`Diminuir ${label}`}
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-l-lg text-on-surface-variant transition-colors active:bg-surface-container-high disabled:opacity-40 touch-manipulation"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeValue}
          disabled={disabled}
          onChange={(e) => {
            const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10);
            const next = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
            onChange(Math.min(max, next));
          }}
          className={cn(
            'numeric-input h-10 min-w-0 flex-1 bg-transparent text-center font-mono text-body-md font-semibold outline-none disabled:opacity-60',
            variant === 'secondary' ? 'text-secondary' : 'text-destructive',
          )}
        />
        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={disabled || safeValue >= max}
          aria-label={`Aumentar ${label}`}
          className="flex h-10 w-9 shrink-0 items-center justify-center rounded-r-lg text-on-surface-variant transition-colors active:bg-surface-container-high disabled:opacity-40 touch-manipulation"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}

export function RecuperacaoExecucaoFormPanel({
  register,
  watch,
  setValue,
  errors,
  qtyMaxima,
  photos,
  disabled,
  rootError,
  onCapture,
  onRemovePhoto,
  hiddenInput,
}: RecuperacaoExecucaoFormProps) {
  const qtyAvariada = watch('qtyAvariada');
  const qtyRecuperada = watch('qtyRecuperada');

  function handleAvariadaChange(next: number) {
    setValue('qtyAvariada', next, { shouldValidate: true });
    if (qtyRecuperada > next) {
      setValue('qtyRecuperada', next, { shouldValidate: true });
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumericStepper
          id="qtyAvariada"
          label="Qtd avariada"
          value={qtyAvariada}
          max={qtyMaxima}
          disabled={disabled}
          onChange={handleAvariadaChange}
          error={errors.qtyAvariada?.message}
        />
        <NumericStepper
          id="qtyRecuperada"
          label="Qtd recuperada"
          value={qtyRecuperada}
          max={qtyAvariada > 0 ? qtyAvariada : qtyMaxima}
          disabled={disabled}
          variant="secondary"
          onChange={(next) =>
            setValue('qtyRecuperada', next, { shouldValidate: true })
          }
          error={errors.qtyRecuperada?.message}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="observacao"
          className="text-label-sm text-on-surface-variant"
        >
          Observações
        </label>
        <textarea
          id="observacao"
          rows={2}
          disabled={disabled}
          placeholder="Opcional..."
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary disabled:opacity-60"
          {...register('observacao')}
        />
        {errors.observacao?.message && (
          <p className="text-label-sm text-destructive">
            {errors.observacao.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-label-sm text-on-surface-variant">Fotos</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            type="button"
            onClick={onCapture}
            disabled={disabled}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors active:border-secondary active:bg-surface-container touch-manipulation disabled:opacity-50"
          >
            <Camera className="h-4 w-4" aria-hidden />
            <span className="text-[9px] font-bold uppercase">Foto</span>
          </button>
          {photos.map((photo) => (
            <div key={photo.id} className="relative h-16 w-16 shrink-0">
              <img
                src={photo.previewUrl}
                alt="Evidência"
                className="h-full w-full rounded-lg border border-outline-variant object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemovePhoto(photo.id)}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground touch-manipulation"
                  aria-label="Remover foto"
                >
                  <X className="h-2.5 w-2.5" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
        {hiddenInput}
      </div>

      {rootError && (
        <p className="text-label-sm text-destructive">{rootError}</p>
      )}
    </div>
  );
}
