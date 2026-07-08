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

type AjustarSaldoDialogProps = {
  open: boolean;
  saldo: SaldoDetalhe;
  processando: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: { novaQuantidade: number; motivo: string }) => void;
};

const fieldClassName = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function AjustarSaldoDialog({
  open,
  saldo,
  processando,
  onOpenChange,
  onConfirm,
}: AjustarSaldoDialogProps) {
  const [novaQuantidade, setNovaQuantidade] = useState(String(saldo.quantidade));
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (open) {
      setNovaQuantidade(String(saldo.quantidade));
      setMotivo('');
    }
  }, [open, saldo.quantidade]);

  const quantidadeNumerica = Number(novaQuantidade);
  const quantidadeValida =
    novaQuantidade.trim() !== '' &&
    Number.isFinite(quantidadeNumerica) &&
    quantidadeNumerica >= 0;

  const handleConfirm = () => {
    if (!quantidadeValida || !motivo.trim()) {
      return;
    }

    onConfirm({
      novaQuantidade: quantidadeNumerica,
      motivo: motivo.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle>Ajustar quantidade</DialogTitle>
          <DialogDescription>
            Quantidade atual:{' '}
            <span className="font-semibold text-foreground">
              {saldo.quantidade} {saldo.unidadeMedida}
            </span>
            . Informe a nova quantidade e o motivo do ajuste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="nova-quantidade"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Nova quantidade <span className="text-destructive">*</span>
            </label>
            <input
              id="nova-quantidade"
              type="number"
              min={0}
              step="any"
              value={novaQuantidade}
              onChange={(event) => setNovaQuantidade(event.target.value)}
              className={fieldClassName}
            />
          </div>

          <div>
            <label
              htmlFor="motivo-ajuste"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Motivo <span className="text-destructive">*</span>
            </label>
            <textarea
              id="motivo-ajuste"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              rows={3}
              className={fieldClassName}
              placeholder="Ex.: contagem cíclica, perda identificada, correção de entrada..."
            />
          </div>
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
            disabled={processando || !quantidadeValida || !motivo.trim()}
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Confirmar ajuste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
