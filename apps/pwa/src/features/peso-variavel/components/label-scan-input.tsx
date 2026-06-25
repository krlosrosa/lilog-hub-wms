import { Button, cn } from '@lilog/ui';
import { Barcode, CheckCircle, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LabelScanInputProps {
  isScanning: boolean;
  disabled?: boolean;
  onScan: (codigo: string) => void;
  focusKey?: number;
}

export function LabelScanInput({
  isScanning,
  disabled = false,
  onScan,
  focusKey = 0,
}: LabelScanInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!disabled && !isScanning) {
      inputRef.current?.focus();
    }
  }, [disabled, isScanning, focusKey]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isScanning) return;
    onScan(trimmed);
    setValue('');
  }, [value, disabled, isScanning, onScan]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border-2 bg-primary-container p-5 transition-colors',
          disabled
            ? 'border-outline-variant opacity-60'
            : 'border-secondary/40 focus-within:border-secondary',
          !disabled && !isScanning && 'animate-pulse-border',
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          {isScanning ? (
            <Loader2
              className="h-11 w-11 animate-spin text-secondary"
              aria-hidden
            />
          ) : (
            <Barcode className="h-11 w-11 text-secondary" aria-hidden />
          )}

          <div className="w-full space-y-1">
            <h3 className="text-headline-md font-semibold text-on-primary-container">
              {isScanning ? 'Lendo etiqueta…' : 'Bipar etiqueta'}
            </h3>
            <p className="text-body-sm text-on-primary-container/80">
              Digite ou escaneie o código GS1-128 da caixa
            </p>
          </div>

          <div className="w-full space-y-1.5">
            <label htmlFor="label-scan" className="sr-only">
              Código da etiqueta
            </label>
            <input
              ref={inputRef}
              id="label-scan"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isScanning}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="ETQ-94210-001"
              className={cn(
                'h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-center font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary disabled:cursor-not-allowed disabled:opacity-50',
              )}
            />
            <p className="text-label-sm text-on-primary-container/70">
              Ou pressione Enter após digitar o código
            </p>
          </div>
        </div>

        <style>{`
          @keyframes pulse-border {
            0%, 100% { border-color: hsl(var(--secondary) / 0.3); }
            50% { border-color: hsl(var(--secondary) / 0.7); }
          }
          .animate-pulse-border {
            animation: pulse-border 2s ease-in-out infinite;
          }
        `}</style>
      </div>

      <Button
        type="button"
        className="h-12 w-full rounded-lg bg-secondary text-on-secondary active:scale-95 transition-transform touch-manipulation"
        disabled={disabled || isScanning || !value.trim()}
        onClick={submit}
      >
        {isScanning ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            Lendo…
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-5 w-5" aria-hidden />
            Confirmar bip
          </>
        )}
      </Button>
    </div>
  );
}
