'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@lilog/ui';
import { ChevronsUpDown, Loader2, X } from 'lucide-react';

import { listProdutos } from '@/features/produto/lib/produto-api';
import type { ProdutoApi } from '@/features/produto/types/produto.api';

type ProdutoSelectorComboboxProps = {
  produtoId: string | null;
  produtoSku: string | null;
  produtoDescricao: string | null;
  disabled?: boolean;
  isSaving?: boolean;
  onSelect: (produto: ProdutoApi) => void;
  onClear: () => void;
};

export function ProdutoSelectorCombobox({
  produtoId,
  produtoSku,
  produtoDescricao,
  disabled = false,
  isSaving = false,
  onSelect,
  onClear,
}: ProdutoSelectorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [opcoes, setOpcoes] = useState<ProdutoApi[]>([]);
  const [carregando, setCarregando] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setBusca('');
      setOpcoes([]);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const term = busca.trim();
    if (term.length < 2) {
      setOpcoes([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    const timer = window.setTimeout(() => {
      void listProdutos({ search: term, limit: 20 })
        .then((response) => setOpcoes(response.items))
        .catch(() => setOpcoes([]))
        .finally(() => setCarregando(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, busca]);

  const handleSelect = useCallback(
    (produto: ProdutoApi) => {
      onSelect(produto);
      setOpen(false);
    },
    [onSelect],
  );

  const temProduto = Boolean(produtoId && produtoSku);

  return (
    <div className="flex min-w-[180px] items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isSaving}
            className={cn(
              'h-8 min-w-0 flex-1 justify-between px-2 text-left text-[11px] font-normal',
              !temProduto && 'text-muted-foreground',
            )}
          >
            <span className="min-w-0 truncate">
              {isSaving ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Salvando...
                </span>
              ) : temProduto ? (
                <>
                  <span className="font-mono font-semibold text-primary">
                    {produtoSku}
                  </span>
                  {produtoDescricao ? (
                    <span className="ml-1 text-muted-foreground">
                      — {produtoDescricao}
                    </span>
                  ) : null}
                </>
              ) : (
                'Buscar produto...'
              )}
            </span>
            <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={searchInputRef}
              placeholder="SKU ou descrição (mín. 2 caracteres)..."
              value={busca}
              onValueChange={setBusca}
              className="h-8 text-xs"
            />
            <CommandList>
              {carregando ? (
                <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Buscando produtos...
                </div>
              ) : busca.trim().length < 2 ? (
                <CommandEmpty>Digite ao menos 2 caracteres.</CommandEmpty>
              ) : opcoes.length === 0 ? (
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {opcoes.map((produto) => (
                    <CommandItem
                      key={produto.id}
                      value={produto.id}
                      onSelect={() => handleSelect(produto)}
                      className="text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] font-semibold text-primary">
                          {produto.sku}
                        </p>
                        <p className="truncate text-foreground">
                          {produto.descricao}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {temProduto && !disabled && !isSaving ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onClear}
          aria-label="Remover produto do endereço"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
