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

import type { MotivoBloqueioSaldoApi } from '@/features/estoque/types/estoque.api';
import type { SaldoDetalhe } from '@/features/estoque/types/estoque-gestao.schema';

type BloquearSaldoDialogProps = {
  open: boolean;
  saldo: SaldoDetalhe;
  motivos: MotivoBloqueioSaldoApi[];
  processando: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (params: {
    motivoBloqueioId: string;
    quantidade?: number;
    observacao?: string;
  }) => void;
};

const fieldClassName = cn(
  'w-full rounded-lg border border-input bg-surface-low px-3 py-2',
  'text-label-md placeholder:text-muted-foreground/50',
  'focus:outline-none focus:ring-2 focus:ring-ring',
);

export function BloquearSaldoDialog({
  open,
  saldo,
  motivos,
  processando,
  onOpenChange,
  onConfirm,
}: BloquearSaldoDialogProps) {
  const [motivoBloqueioId, setMotivoBloqueioId] = useState('');
  const [quantidade, setQuantidade] = useState(String(saldo.quantidade));
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (open) {
      setMotivoBloqueioId('');
      setQuantidade(String(saldo.quantidade));
      setObservacao('');
    }
  }, [open, saldo.quantidade]);

  const quantidadeNumerica = Number(quantidade);
  const quantidadeValida =
    quantidade.trim() !== '' &&
    Number.isFinite(quantidadeNumerica) &&
    quantidadeNumerica > 0 &&
    quantidadeNumerica <= saldo.quantidade;

  const isBloqueioParcial =
    quantidadeValida && quantidadeNumerica < saldo.quantidade;

  const handleConfirm = () => {
    if (!motivoBloqueioId || !quantidadeValida) {
      return;
    }

    onConfirm({
      motivoBloqueioId,
      quantidade:
        quantidadeNumerica < saldo.quantidade ? quantidadeNumerica : undefined,
      observacao: observacao.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle>Bloquear saldo</DialogTitle>
          <DialogDescription>
            Informe a quantidade a bloquear do lote{' '}
            <span className="font-semibold text-foreground">
              {saldo.lote || '—'}
            </span>{' '}
            na posição{' '}
            <span className="font-mono font-semibold text-foreground">
              {saldo.enderecoMascarado}
            </span>
            . Saldo liberado disponível:{' '}
            <span className="font-semibold text-foreground">
              {saldo.quantidade} {saldo.unidadeMedida}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="quantidade-bloqueio"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Quantidade a bloquear <span className="text-destructive">*</span>
            </label>
            <input
              id="quantidade-bloqueio"
              type="number"
              min={0}
              max={saldo.quantidade}
              step="any"
              value={quantidade}
              onChange={(event) => setQuantidade(event.target.value)}
              className={fieldClassName}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Máximo: {saldo.quantidade} {saldo.unidadeMedida}
              {isBloqueioParcial ? (
                <>
                  {' '}
                  · Restará liberado:{' '}
                  {(saldo.quantidade - quantidadeNumerica).toFixed(4)}{' '}
                  {saldo.unidadeMedida}
                </>
              ) : null}
            </p>
          </div>

          <div>
            <label
              htmlFor="motivo-bloqueio"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Motivo <span className="text-destructive">*</span>
            </label>
            <select
              id="motivo-bloqueio"
              value={motivoBloqueioId}
              onChange={(event) => setMotivoBloqueioId(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Selecione um motivo</option>
              {motivos.map((motivo) => (
                <option key={motivo.id} value={motivo.id}>
                  {motivo.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="observacao-bloqueio"
              className="mb-1 block text-label-md text-muted-foreground"
            >
              Observação
            </label>
            <textarea
              id="observacao-bloqueio"
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              rows={3}
              className={fieldClassName}
              placeholder="Detalhes adicionais sobre o bloqueio..."
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
            disabled={processando || !motivoBloqueioId || !quantidadeValida}
            onClick={handleConfirm}
            className="gap-2"
          >
            {processando ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {isBloqueioParcial ? 'Confirmar bloqueio parcial' : 'Confirmar bloqueio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
