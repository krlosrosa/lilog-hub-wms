'use client';

import { useEffect, useMemo, useState } from 'react';

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
import { ChevronsUpDown, Plus, X } from 'lucide-react';

import type { OpcaoItemAgrupamento } from '@/features/transporte/lib/extrair-opcoes-agrupamento';

type AgrupamentoItemSelectorProps = {
  label: string;
  placeholder?: string;
  opcoes: OpcaoItemAgrupamento[];
  selecionados: string[];
  onAdicionar: (id: string) => void;
  onRemover: (id: string) => void;
  emptyMessage?: string;
};

export function AgrupamentoItemSelector({
  label,
  placeholder = 'Buscar e adicionar...',
  opcoes,
  selecionados,
  onAdicionar,
  onRemover,
  emptyMessage = 'Nenhum item disponível.',
}: AgrupamentoItemSelectorProps) {
  const [open, setOpen] = useState(false);

  const opcoesDisponiveis = useMemo(
    () => opcoes.filter((opcao) => !selecionados.includes(opcao.id)),
    [opcoes, selecionados],
  );

  const opcoesPorId = useMemo(
    () => new Map(opcoes.map((opcao) => [opcao.id, opcao])),
    [opcoes],
  );

  useEffect(() => {
    if (open && opcoesDisponiveis.length === 0) {
      setOpen(false);
    }
  }, [open, opcoesDisponiveis.length]);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={opcoesDisponiveis.length === 0 && selecionados.length === 0}
            className="h-8 w-full justify-between px-2.5 text-xs font-normal"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Plus className="size-3.5" aria-hidden />
              {opcoesDisponiveis.length === 0 && selecionados.length > 0
                ? 'Todos os itens adicionados'
                : placeholder}
            </span>
            <ChevronsUpDown className="size-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter>
            <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>Nenhum resultado.</CommandEmpty>
              <CommandGroup>
                {opcoesDisponiveis.map((opcao) => (
                  <CommandItem
                    key={opcao.id}
                    value={`${opcao.label} ${opcao.grupo ?? ''}`}
                    onSelect={() => onAdicionar(opcao.id)}
                    className="text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{opcao.label}</p>
                      {opcao.grupo && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {opcao.grupo}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="flex items-center justify-between border-t border-outline-variant px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              {selecionados.length} selecionado
              {selecionados.length !== 1 ? 's' : ''}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => setOpen(false)}
            >
              Concluir
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selecionados.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selecionados.map((id) => {
            const opcao = opcoesPorId.get(id);

            return (
              <span
                key={id}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border border-primary/30',
                  'bg-primary/5 px-2 py-0.5 text-[11px] text-foreground',
                )}
              >
                <span className="max-w-[180px] truncate">
                  {opcao?.label ?? id}
                </span>
                <button
                  type="button"
                  onClick={() => onRemover(id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remover ${opcao?.label ?? id}`}
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}
