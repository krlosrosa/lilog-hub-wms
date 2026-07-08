import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  ClipboardList,
  Loader2,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';

import { QrScannerModal } from '@/components/qr-scanner/qr-scanner-modal';
import { hapticLight, hapticMedium } from '@/lib/haptics';

import { useArmazenagemScanEntry } from '../hooks/use-armazenagem-scan-entry';
import { ArmazenagemDemandasSheet } from '../components/armazenagem-demandas-sheet';

export function ArmazenagemScanEntryView() {
  const { state, actions } = useArmazenagemScanEntry();
  const { codigo, error, isSubmitting, unidadeDisponivel } = state;
  const [scanOpen, setScanOpen] = useState(false);
  const [demandasSheetOpen, setDemandasSheetOpen] = useState(false);

  return (
    <div className="page-enter flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/movimentacao"
            aria-label="Voltar à movimentação"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform touch-manipulation active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Armazenagem
            </h1>
            <p className="truncate text-label-sm text-on-surface-variant">
              Bipe a etiqueta do palete para iniciar
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticLight();
              setDemandasSheetOpen(true);
            }}
            aria-label="Ver demandas em aberto"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-transform touch-manipulation active:scale-90"
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-margin-mobile py-8">
        {!unidadeDisponivel ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-warning" aria-hidden />
            <p className="text-body-md text-on-surface-variant">
              Selecione uma unidade para continuar.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-lg space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="etiqueta-palete"
                className="text-label-md text-on-surface-variant"
              >
                Etiqueta palete / QR
              </label>
              <div
                className={cn(
                  'relative flex items-center rounded-lg border bg-surface-bright transition-colors',
                  error
                    ? 'border-destructive/60 ring-1 ring-destructive/25'
                    : 'border-outline-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary',
                )}
              >
                <input
                  id="etiqueta-palete"
                  type="text"
                  value={codigo}
                  onChange={(e) => {
                    actions.setCodigo(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && codigo.trim() && !isSubmitting) {
                      e.preventDefault();
                      actions.onSubmit();
                    }
                  }}
                  placeholder="Bipe a etiqueta do palete..."
                  autoComplete="off"
                  autoFocus
                  disabled={isSubmitting}
                  enterKeyHint="go"
                  aria-invalid={Boolean(error)}
                  className="h-14 flex-1 bg-transparent pl-4 pr-[4.5rem] font-mono text-base text-on-surface outline-none disabled:opacity-60"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-secondary" aria-hidden />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        hapticLight();
                        setScanOpen(true);
                      }}
                      disabled={isSubmitting}
                      aria-label="Escanear etiqueta do palete"
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-on-secondary touch-manipulation disabled:opacity-60"
                    >
                      <ScanLine className="h-5 w-5" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
              {error ? (
                <p className="text-label-sm text-destructive">{error}</p>
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  Pegue o próximo palete e bipe a etiqueta gerada no recebimento.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                hapticMedium();
                actions.onSubmit();
              }}
              disabled={!codigo.trim() || isSubmitting}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation',
                codigo.trim() && !isSubmitting
                  ? 'bg-secondary text-on-secondary active:scale-[0.98]'
                  : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Localizando palete...
                </>
              ) : (
                <>
                  <ScanLine className="h-5 w-5" aria-hidden />
                  Continuar
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <QrScannerModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        title="Escanear etiqueta do palete"
        onScan={(value) => {
          setScanOpen(false);
          actions.onScan(value);
        }}
      />

      <ArmazenagemDemandasSheet
        open={demandasSheetOpen}
        onOpenChange={setDemandasSheetOpen}
      />
    </div>
  );
}
