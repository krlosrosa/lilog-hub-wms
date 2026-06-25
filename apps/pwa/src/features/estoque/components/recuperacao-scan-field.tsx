import { cn } from '@lilog/ui';
import { Barcode, CheckCircle, Loader2, QrCode } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hapticLight } from '@/lib/haptics';

interface RecuperacaoScanFieldProps {
  type: 'sku';
  label: string;
  validated: boolean;
  isScanning: boolean;
  disabled?: boolean;
  onScan: (codigo: string) => void;
}

export function RecuperacaoScanField({
  type,
  label,
  validated,
  isScanning,
  disabled = false,
  onScan,
}: RecuperacaoScanFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const Icon = validated ? CheckCircle : Barcode;

  useEffect(() => {
    if (!disabled && !validated && !isScanning) {
      inputRef.current?.focus();
    }
  }, [disabled, validated, isScanning]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isScanning || validated) return;
    hapticLight();
    onScan(trimmed);
    setValue('');
  }, [value, disabled, isScanning, validated, onScan]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  if (validated) {
    return (
      <div className="flex w-full items-center justify-between rounded-lg border border-solid border-secondary bg-surface-container-high p-4">
        <div className="flex min-w-0 items-center gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
          <span className="truncate text-body-md font-bold text-on-surface">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 border-dashed border-outline-variant bg-surface p-4 transition-colors touch-manipulation',
        isScanning && 'border-secondary bg-surface-container-low',
        !disabled && !isScanning && 'active:bg-surface-container-low',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {isScanning ? (
            <Loader2
              className="h-5 w-5 shrink-0 animate-spin text-secondary"
              aria-hidden
            />
          ) : (
            <Icon
              className="h-5 w-5 shrink-0 text-on-surface-variant"
              aria-hidden
            />
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled || isScanning}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={label}
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent text-body-md font-medium text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || isScanning || !value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary transition-transform touch-manipulation active:scale-90 disabled:opacity-40"
          aria-label={`Escanear ${type}`}
        >
          <QrCode className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {isScanning && (
        <div
          className="pointer-events-none absolute inset-0 animate-pulse bg-secondary/10"
          aria-hidden
        />
      )}
    </div>
  );
}
