'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { Loader2, MapPin } from 'lucide-react';

import type {
  NivelPrioridadeTransporte,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';
import {
  NIVEL_PRIORIDADE_LABELS,
  NIVEL_PRIORIDADE_OPCOES,
} from '@/features/transporte/types/transporte.schema';

const inputClassName = cn(
  'mt-1 w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
);

export type PrioridadeTransporteConfirmPayload = {
  isPrioridade: boolean;
  nivelPrioridade?: NivelPrioridadeTransporte;
};

type PrioridadeTransporteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transporte: TransporteGrupo | null;
  processando: boolean;
  onConfirmar: (payload: PrioridadeTransporteConfirmPayload) => void;
};

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) {
    return iso;
  }
  return `${dia}/${mes}/${ano}`;
}

export function PrioridadeTransporteModal({
  open,
  onOpenChange,
  transporte,
  processando,
  onConfirmar,
}: PrioridadeTransporteModalProps) {
  const [isPrioridade, setIsPrioridade] = useState(false);
  const [nivelPrioridade, setNivelPrioridade] =
    useState<NivelPrioridadeTransporte>('normal');

  useEffect(() => {
    if (!open || !transporte) {
      return;
    }

    setIsPrioridade(Boolean(transporte.isPrioridade));
    setNivelPrioridade(transporte.nivelPrioridade ?? 'normal');
  }, [open, transporte]);

  const podeConfirmar = !isPrioridade || nivelPrioridade.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Prioridade do transporte
          </DialogTitle>
          <DialogDescription>
            Defina se este transporte deve ser tratado como prioridade na
            expedição.
          </DialogDescription>
        </DialogHeader>

        {transporte ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-outline-variant/60 bg-surface-low/50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Rota {transporte.rota}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transporte.cidade} · {formatarData(transporte.dataTransporte)}
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-outline-variant/60 px-3 py-2.5">
              <input
                type="checkbox"
                checked={isPrioridade}
                onChange={(event) => setIsPrioridade(event.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              <span className="text-sm font-medium text-foreground">
                Marcar como prioridade
              </span>
            </label>

            <div>
              <label
                htmlFor="nivel-prioridade"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Nível de prioridade
              </label>
              <select
                id="nivel-prioridade"
                value={nivelPrioridade}
                disabled={!isPrioridade || processando}
                onChange={(event) =>
                  setNivelPrioridade(
                    event.target.value as NivelPrioridadeTransporte,
                  )
                }
                className={cn(
                  inputClassName,
                  !isPrioridade && 'cursor-not-allowed opacity-50',
                )}
              >
                {NIVEL_PRIORIDADE_OPCOES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {NIVEL_PRIORIDADE_LABELS[nivel]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={processando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!transporte || !podeConfirmar || processando}
            onClick={() =>
              onConfirmar({
                isPrioridade,
                nivelPrioridade: isPrioridade ? nivelPrioridade : undefined,
              })
            }
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
