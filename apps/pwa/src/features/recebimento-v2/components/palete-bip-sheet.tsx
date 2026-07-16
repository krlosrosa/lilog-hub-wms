import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from '@lilog/ui';
import { Barcode, Loader2, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

interface PaleteBipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: (codigo: string) => Promise<void>;
  onAutoGenerate?: () => Promise<void>;
}

export function PaleteBipSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar palete',
  onConfirm,
  onAutoGenerate,
}: PaleteBipSheetProps) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCodigo('');
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [open]);

  function resolveCodigoFromInput(): string {
    return (inputRef.current?.value ?? codigo).trim();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = resolveCodigoFromInput();
    if (!normalized) {
      setError('Informe ou escaneie o ID do palete');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(normalized);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao associar palete');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAutoGenerate() {
    if (!onAutoGenerate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAutoGenerate();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao gerar palete');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-t border-outline-variant bg-surface px-margin-mobile pb-safe-offset-4"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-sm text-on-surface">{title}</SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            {description}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
          <label className="flex items-center gap-1.5 text-label-sm font-medium text-on-surface" htmlFor="palete-codigo">
            <Barcode className="h-3.5 w-3.5" aria-hidden />
            ID do palete / WMS
          </label>
          <input
            id="palete-codigo"
            ref={inputRef}
            value={codigo}
            onChange={(event) => {
              setCodigo(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              void handleSubmit(event);
            }}
            placeholder="Escaneie ou digite o código"
            autoComplete="off"
            className={cn(
              'h-12 w-full rounded-lg border bg-surface px-3 font-mono text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20',
              error ? 'border-destructive' : 'border-input',
            )}
          />
          {error ? <p className="text-label-sm text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              confirmLabel
            )}
          </Button>

          {onAutoGenerate ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleAutoGenerate()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-label-md font-medium"
            >
              <Wand2 className="h-4 w-4" aria-hidden />
              Gerar automaticamente
            </Button>
          ) : null}
        </form>
      </SheetContent>
    </Sheet>
  );
}
