import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { PRESENCA_STATUS_LABELS } from '../lib/sessao-labels';
import type { SessaoFuncionarioApi, SessaoPresencaStatusApi } from '../types';

const EXTRA_STATUSES: SessaoPresencaStatusApi[] = [
  'atestado',
  'folga',
  'esperado',
];

export interface PresencaStatusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario: SessaoFuncionarioApi;
  onConfirm: (status: SessaoPresencaStatusApi, observacao?: string | null) => void;
}

export function PresencaStatusSheet({
  open,
  onOpenChange,
  funcionario,
  onConfirm,
}: PresencaStatusSheetProps) {
  const [observacao, setObservacao] = useState(funcionario.observacao ?? '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-safe"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-md text-on-surface">
            {funcionario.nome}
          </SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Matrícula {funcionario.matricula} · {funcionario.cargo}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          <p className="text-label-sm font-medium text-on-surface-variant">
            Outros status
          </p>
          <div className="grid grid-cols-3 gap-2">
            {EXTRA_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  hapticMedium();
                  onConfirm(status, observacao || null);
                }}
                className="flex h-11 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-label-sm font-medium text-on-surface touch-manipulation active:scale-95"
              >
                {PRESENCA_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor={`obs-${funcionario.funcionarioId}`}
            className="mb-1 block text-label-sm font-medium text-on-surface-variant"
          >
            Observação (opcional)
          </label>
          <textarea
            id={`obs-${funcionario.funcionarioId}`}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Ex.: atestado médico até sexta"
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          className="mt-4 w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
      </SheetContent>
    </Sheet>
  );
}
