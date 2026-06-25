'use client';

import { Loader2, MapPin, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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

import type { EnderecoApi } from '@/features/enderecos/types/endereco.api';

import { EnderecoDisponivelOption } from './item-armazenagem-row';
import type { ItemArmazenagemView } from '../types/armazenagem.api';

type SelecionarEnderecoDialogProps = {
  open: boolean;
  item: ItemArmazenagemView | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (enderecoId: string) => Promise<void>;
  onSearch: (search: string, page?: number) => Promise<{
    items: EnderecoApi[];
    total: number;
    page: number;
    limit: number;
  }>;
};

export function SelecionarEnderecoDialog({
  open,
  item,
  isSaving,
  onClose,
  onConfirm,
  onSearch,
}: SelecionarEnderecoDialogProps) {
  const [busca, setBusca] = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enderecos, setEnderecos] = useState<EnderecoApi[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedBusca(busca);
      setPagina(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setDebouncedBusca('');
      setEnderecos([]);
      setTotal(0);
      setPagina(1);
      setSelecionadoId(null);
      return;
    }

    setSelecionadoId(item?.enderecoSugeridoId ?? null);
  }, [open, item?.enderecoSugeridoId]);

  const carregarEnderecos = useCallback(async () => {
    if (!open || !item) return;

    setIsLoading(true);

    try {
      const response = await onSearch(debouncedBusca, pagina);
      setEnderecos(response.items);
      setTotal(response.total);
    } catch {
      setEnderecos([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedBusca, item, onSearch, open, pagina]);

  useEffect(() => {
    void carregarEnderecos();
  }, [carregarEnderecos]);

  const totalPaginas = Math.max(1, Math.ceil(total / 20));

  async function handleConfirm() {
    if (!selecionadoId) return;
    await onConfirm(selecionadoId);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-outline-variant px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-primary" aria-hidden />
            Selecionar endereço de armazenagem
          </DialogTitle>
          <DialogDescription>
            {item?.produtoSku
              ? `${item.produtoSku} — ${item.produtoNome ?? 'Produto'}`
              : 'Escolha um endereço disponível para o item.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por endereço, zona ou rua..."
              className={cn(
                'h-10 w-full rounded-lg border border-outline-variant bg-background pl-10 pr-3 text-sm outline-none',
                'focus:border-primary focus:ring-1 focus:ring-primary/30',
              )}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Endereços disponíveis ordenados por prioridade de picking e ocupação.
          </p>

          <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando endereços...
              </div>
            ) : enderecos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum endereço disponível encontrado.
              </div>
            ) : (
              enderecos.map((endereco) => (
                <EnderecoDisponivelOption
                  key={endereco.id}
                  endereco={endereco}
                  selected={selecionadoId === endereco.id}
                  onSelect={() => setSelecionadoId(endereco.id)}
                />
              ))
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Página {pagina} de {totalPaginas} · {total} endereços
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pagina <= 1 || isLoading}
                  onClick={() => setPagina((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pagina >= totalPaginas || isLoading}
                  onClick={() =>
                    setPagina((current) => Math.min(totalPaginas, current + 1))
                  }
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-outline-variant px-6 py-4">
          <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!selecionadoId || isSaving}
            onClick={() => void handleConfirm()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              'Confirmar endereço'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
