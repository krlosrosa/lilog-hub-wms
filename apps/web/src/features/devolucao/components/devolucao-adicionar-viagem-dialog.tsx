'use client';

import { useEffect, useMemo, useState } from 'react';

import { FileStack, Loader2, Route, Search, Truck } from 'lucide-react';

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

import type { OutraViagem } from '@/features/devolucao/types/devolucao-checkin.schema';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

type DevolucaoAdicionarViagemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viagens: readonly OutraViagem[];
  isLoading?: boolean;
  onConfirm: (viagemId: string, nfIds: string[]) => Promise<void>;
};

export function DevolucaoAdicionarViagemDialog({
  open,
  onOpenChange,
  viagens,
  isLoading = false,
  onConfirm,
}: DevolucaoAdicionarViagemDialogProps) {
  const [busca, setBusca] = useState('');
  const [viagemSelecionadaId, setViagemSelecionadaId] = useState<string | null>(
    null,
  );
  const [nfIdsSelecionados, setNfIdsSelecionados] = useState<Set<string>>(
    () => new Set(),
  );

  const viagensFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return viagens;
    return viagens.filter(
      (v) =>
        v.viagemRavexId.toLowerCase().includes(term) ||
        v.placa.toLowerCase().includes(term) ||
        v.motorista.toLowerCase().includes(term) ||
        v.transportadora.toLowerCase().includes(term),
    );
  }, [viagens, busca]);

  const viagemSelecionada = viagens.find((v) => v.id === viagemSelecionadaId);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setViagemSelecionadaId(null);
      setNfIdsSelecionados(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (viagemSelecionada) {
      setNfIdsSelecionados(new Set(viagemSelecionada.nfs.map((nf) => nf.id)));
    } else {
      setNfIdsSelecionados(new Set());
    }
  }, [viagemSelecionada]);

  const toggleNf = (nfId: string) => {
    setNfIdsSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(nfId)) next.delete(nfId);
      else next.add(nfId);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!viagemSelecionadaId || nfIdsSelecionados.size === 0) return;
    await onConfirm(viagemSelecionadaId, [...nfIdsSelecionados]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b border-outline-variant px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-headline-md">
            <Route className="size-5 text-primary" aria-hidden />
            Adicionar NFs de outra viagem
          </DialogTitle>
          <DialogDescription>
            Selecione uma viagem RAVEX e vincule as notas fiscais de retorno ao
            check-in atual.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[calc(90vh-180px)] grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          <div className="flex flex-col border-b border-outline-variant md:border-b-0 md:border-r">
            <div className="border-b border-outline-variant p-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar viagem, placa ou motorista..."
                  className="w-full rounded-lg border border-outline-variant bg-muted py-2 pl-10 pr-3 text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {viagensFiltradas.length === 0 ? (
                <p className="px-2 py-6 text-center text-caption text-muted-foreground">
                  Nenhuma viagem disponível para vincular.
                </p>
              ) : (
                <ul className="space-y-2">
                  {viagensFiltradas.map((viagem) => {
                    const selected = viagemSelecionadaId === viagem.id;
                    return (
                      <li key={viagem.id}>
                        <button
                          type="button"
                          onClick={() => setViagemSelecionadaId(viagem.id)}
                          className={cn(
                            'w-full rounded-xl border p-3 text-left transition-all',
                            selected
                              ? 'border-primary/40 bg-primary/10 shadow-sm'
                              : 'border-outline-variant bg-card hover:border-primary/20 hover:bg-muted/50',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-mono text-label-md font-bold text-primary">
                                {viagem.viagemRavexId}
                              </p>
                              <p className="mt-1 text-caption text-muted-foreground">
                                {viagem.data}
                              </p>
                            </div>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {viagem.nfs.length} NF
                              {viagem.nfs.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2 text-caption text-foreground">
                            <Truck className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="font-mono">{viagem.placa}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="truncate">{viagem.motorista}</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden">
            <div className="border-b border-outline-variant px-4 py-3">
              <p className="text-label-md font-semibold text-foreground">
                Notas disponíveis
              </p>
              <p className="text-caption text-muted-foreground">
                {viagemSelecionada
                  ? `${viagemSelecionada.transportadora} — selecione as NFs`
                  : 'Escolha uma viagem à esquerda'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {!viagemSelecionada ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <FileStack className="size-8 opacity-40" aria-hidden />
                  <p className="text-caption">
                    Selecione uma viagem para ver as notas fiscais
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {viagemSelecionada.nfs.map((nf) => {
                    const checked = nfIdsSelecionados.has(nf.id);
                    return (
                      <li key={nf.id}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                            checked
                              ? 'border-tertiary/30 bg-tertiary/5'
                              : 'border-outline-variant hover:bg-muted/40',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleNf(nf.id)}
                            className="mt-1 size-4 rounded border-outline-variant text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-label-md font-bold">
                                {nf.numero}
                              </span>
                              <span className="shrink-0 font-mono text-caption text-muted-foreground">
                                {currency.format(nf.valorTotal)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-caption text-muted-foreground">
                              {nf.cliente}
                            </p>
                            <p className="mt-1 text-[10px] uppercase text-muted-foreground">
                              {nf.itensTotal} itens • {nf.tipoDevolucao}
                            </p>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-outline-variant px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isLoading || !viagemSelecionadaId || nfIdsSelecionados.size === 0
            }
            onClick={handleConfirm}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Vincular {nfIdsSelecionados.size > 0 ? nfIdsSelecionados.size : ''}{' '}
            NF{nfIdsSelecionados.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
