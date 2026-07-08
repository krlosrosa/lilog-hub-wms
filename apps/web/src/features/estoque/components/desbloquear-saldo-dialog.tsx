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
import { Loader2 } from 'lucide-react';

import type { SaldoDetalhe } from '@/features/estoque/types/estoque-gestao.schema';

type DesbloquearSaldoDialogProps = {
  open: boolean;
  saldo: SaldoDetalhe;
  processando: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: { observacao?: string }) => void;
};

const fieldClassName = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function DesbloquearSaldoDialog({
  open,
  saldo,
  processando,
  onOpenChange,
  onConfirm,
}: DesbloquearSaldoDialogProps) {
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (!open) {
      setObservacao('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle>Desbloquear saldo</DialogTitle>
          <DialogDescription>
            Liberar {saldo.quantidade} {saldo.unidadeMedida} bloqueados na posição{' '}
            <span className="font-mono font-semibold text-foreground">
              {saldo.enderecoMascarado}
            </span>
            {saldo.motivoBloqueio ? (
              <>
                {' '}
                (motivo: {saldo.motivoBloqueio.nome})
              </>
            ) : null}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label
            htmlFor="observacao-desbloqueio"
            className="mb-1 block text-label-md text-muted-foreground"
          >
            Observação
          </label>
          <textarea
            id="observacao-desbloqueio"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            rows={3}
            className={fieldClassName}
            placeholder="Motivo do desbloqueio (opcional)..."
          />
        </div>

        <DialogFooter>
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
            disabled={processando}
            onClick={() =>
              onConfirm({
                observacao: observacao.trim() || undefined,
              })
            }
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar desbloqueio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
