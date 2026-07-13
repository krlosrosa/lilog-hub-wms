'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { EncerrarCncBody } from '@/features/cnc/lib/cnc-api';
import type { CncDetalhe, CncResponsavel } from '@/features/cnc/types/cnc.schema';
import { CNC_RESPONSAVEL_LABELS } from '@/features/cnc/types/cnc.schema';

type ModalEncerrarCncProps = {
  open: boolean;
  cnc: CncDetalhe;
  processando: boolean;
  onOpenChange: (aberto: boolean) => void;
  onConfirm: (body: EncerrarCncBody) => void;
};

const RESPONSAVEL_OPTIONS = Object.entries(CNC_RESPONSAVEL_LABELS) as [
  CncResponsavel,
  string,
][];

const inputClass = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function ModalEncerrarCnc({
  open,
  cnc,
  processando,
  onOpenChange,
  onConfirm,
}: ModalEncerrarCncProps) {
  const [observacao, setObservacao] = useState(cnc.observacao ?? '');
  const [valorDebito, setValorDebito] = useState(
    cnc.valorDebito !== null ? String(cnc.valorDebito) : '',
  );
  const [responsavel, setResponsavel] = useState<CncResponsavel>(
    cnc.responsavel,
  );

  const handleConfirm = () => {
    onConfirm({
      observacao: observacao.trim() || null,
      valorDebito: valorDebito.trim() ? Number(valorDebito) : null,
      responsavel,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg border-outline-variant bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">
            Encerrar não conformidade
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-muted-foreground">
              Registre a observação final e encerre a CNC{' '}
              <span className="font-semibold text-foreground">{cnc.numero}</span>
              .
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="encerrar-responsavel"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Responsável
            </label>
            <select
              id="encerrar-responsavel"
              value={responsavel}
              onChange={(event) =>
                setResponsavel(event.target.value as CncResponsavel)
              }
              className={inputClass}
            >
              {RESPONSAVEL_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="encerrar-observacao"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Observação
            </label>
            <textarea
              id="encerrar-observacao"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Contexto, decisões ou pontos de atenção..."
            />
          </div>

          <div>
            <label
              htmlFor="encerrar-valor-debito"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Valor de débito (R$)
            </label>
            <input
              id="encerrar-valor-debito"
              type="number"
              min="0"
              step="0.01"
              value={valorDebito}
              onChange={(event) => setValorDebito(event.target.value)}
              className={inputClass}
              placeholder="0,00"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={processando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            disabled={processando}
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Encerrar CNC
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
