'use client';

import { useEffect, useMemo, useState } from 'react';

import { AlertTriangle, Loader2, PackageMinus } from 'lucide-react';

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import type { NfRow } from '@/features/devolucao/types/devolucao-checkin.schema';

export type DemandaFaltaPayload = {
  nfId: string;
  itemId: string;
  qtdFaltante: number;
};

type DevolucaoDemandaFaltaDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nfs: readonly NfRow[];
  isLoading?: boolean;
  onConfirm: (payload: DemandaFaltaPayload[], observacao: string) => Promise<void>;
};

type ItemFalta = {
  key: string;
  nfId: string;
  nfNumero: string;
  itemId: string;
  produto: string;
  sku: string;
  qtdEsperada: number;
  qtdDevolvida: number;
  qtdFaltante: number;
};

function buildItensFalta(nfs: readonly NfRow[]): ItemFalta[] {
  const itens: ItemFalta[] = [];

  for (const nf of nfs) {
    for (const item of nf.itens) {
      const qtdFaltante = Math.max(0, item.qtdNf - item.qtdDevolucao);
      if (qtdFaltante <= 0) continue;

      itens.push({
        key: `${nf.id}:${item.id}`,
        nfId: nf.id,
        nfNumero: nf.numero,
        itemId: item.id,
        produto: item.produto,
        sku: item.sku,
        qtdEsperada: item.qtdNf,
        qtdDevolvida: item.qtdDevolucao,
        qtdFaltante,
      });
    }
  }

  return itens;
}

export function DevolucaoDemandaFaltaDialog({
  open,
  onOpenChange,
  nfs,
  isLoading = false,
  onConfirm,
}: DevolucaoDemandaFaltaDialogProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(() => new Set());
  const [observacao, setObservacao] = useState('');

  const itensFalta = useMemo(() => buildItensFalta(nfs), [nfs]);

  useEffect(() => {
    if (!open) {
      setSelecionados(new Set());
      setObservacao('');
      return;
    }

    setSelecionados(new Set(itensFalta.map((item) => item.key)));
  }, [open, itensFalta]);

  const toggleItem = (key: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === itensFalta.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(itensFalta.map((item) => item.key)));
    }
  };

  const handleConfirm = async () => {
    const payload: DemandaFaltaPayload[] = itensFalta
      .filter((item) => selecionados.has(item.key))
      .map((item) => ({
        nfId: item.nfId,
        itemId: item.itemId,
        qtdFaltante: item.qtdFaltante,
      }));

    await onConfirm(payload, observacao.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <PackageMinus className="size-5" aria-hidden />
            Demanda de Falta
          </DialogTitle>
          <DialogDescription>
            Registre itens que não retornaram na viagem. A demanda será
            encaminhada para tratamento operacional.
          </DialogDescription>
        </DialogHeader>

        {itensFalta.length === 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-outline-variant bg-muted/30 p-4">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="text-caption text-muted-foreground">
              Nenhum item com falta de retorno identificado nas notas fiscais
              desta viagem.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-caption font-medium text-muted-foreground">
                {itensFalta.length} item(ns) com possível falta
              </p>
              <button
                type="button"
                onClick={toggleTodos}
                className="text-caption font-semibold text-primary hover:underline"
              >
                {selecionados.size === itensFalta.length
                  ? 'Desmarcar todos'
                  : 'Selecionar todos'}
              </button>
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-outline-variant">
              {itensFalta.map((item) => {
                const checked = selecionados.has(item.key);
                return (
                  <label
                    key={item.key}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 border-b border-outline-variant/30 p-3 last:border-b-0',
                      checked && 'bg-destructive/5',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item.key)}
                      className="mt-1 size-4 rounded border-outline-variant accent-destructive"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          NF {item.nfNumero}
                        </span>
                        <span className="text-caption font-bold">
                          {item.produto}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                      <p className="mt-1 text-[11px]">
                        Esperado: {item.qtdEsperada} un • Devolvido:{' '}
                        {item.qtdDevolvida} un •{' '}
                        <span className="font-bold text-destructive">
                          Falta: {item.qtdFaltante} un
                        </span>
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="demanda-falta-obs"
                className="mb-2 block text-caption font-medium text-muted-foreground"
              >
                Observação (opcional)
              </label>
              <textarea
                id="demanda-falta-obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                placeholder="Descreva o contexto reportado pelo motorista..."
                className="w-full resize-none rounded-lg border border-outline-variant bg-background px-3 py-2 text-caption focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading || selecionados.size === 0}
            onClick={handleConfirm}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <PackageMinus className="size-4" aria-hidden />
            )}
            Abrir Demanda de Falta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
