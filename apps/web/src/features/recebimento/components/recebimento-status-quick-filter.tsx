'use client';

import { useCallback, useState } from 'react';

import {
  Button,
  cn,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@lilog/ui';
import { Check, ChevronsUpDown, ListFilter } from 'lucide-react';

import {
  FILTROS_STATUS_RECEBIMENTO,
  getRecebimentoStatusLabel,
} from '@/features/recebimento/types/recebimento-filtros';
import type { RecebimentoStatus } from '@/features/recebimento/types/recebimento-lista.schema';

type RecebimentoStatusQuickFilterProps = {
  value: RecebimentoStatus[];
  onChange: (value: RecebimentoStatus[]) => void;
};

export function RecebimentoStatusQuickFilter({
  value,
  onChange,
}: RecebimentoStatusQuickFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = useCallback(
    (status: RecebimentoStatus) => {
      const jaSelecionado = value.includes(status);
      onChange(
        jaSelecionado
          ? value.filter((s) => s !== status)
          : [...value, status],
      );
    },
    [onChange, value],
  );

  const limpar = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const temSelecao = value.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Filtrar por status"
          aria-expanded={open}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-outline-variant px-2.5 text-[11px] font-medium transition-colors hover:bg-surface-highest hover:text-foreground',
            temSelecao
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'text-muted-foreground',
          )}
        >
          <ListFilter className="size-3 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Status</span>
          {temSelecao ? (
            <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
              {value.length}
            </span>
          ) : (
            <ChevronsUpDown className="size-3 shrink-0 opacity-50" aria-hidden />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-2rem,16rem)] p-0"
        align="end"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandGroup>
              {FILTROS_STATUS_RECEBIMENTO.map((status) => {
                const selecionado = value.includes(status);
                return (
                  <CommandItem
                    key={status}
                    value={status}
                    onSelect={() => toggleStatus(status)}
                    className="text-xs"
                  >
                    <span
                      className={cn(
                        'flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-outline-variant',
                        selecionado &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {selecionado ? (
                        <Check className="size-2.5" aria-hidden />
                      ) : null}
                    </span>
                    {getRecebimentoStatusLabel(status)}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {temSelecao ? (
          <div className="border-t border-outline-variant p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[11px] text-muted-foreground"
              onClick={limpar}
            >
              Limpar seleção
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
