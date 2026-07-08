'use client';

import { useState } from 'react';

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
import { Check, ChevronsUpDown } from 'lucide-react';

import type { MapaGrupoProcessoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

export type FiltroProcessoMapa = 'todos' | MapaGrupoProcessoApi;

const OPCOES: Array<{ value: FiltroProcessoMapa; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'separacao', label: 'Separação' },
  { value: 'conferencia', label: 'Conferência' },
  { value: 'carregamento', label: 'Carregamento' },
];

type ProcessoMapaComboboxProps = {
  value: FiltroProcessoMapa;
  onChange: (value: FiltroProcessoMapa) => void;
  disabled?: boolean;
  className?: string;
};

export function ProcessoMapaCombobox({
  value,
  onChange,
  disabled = false,
  className,
}: ProcessoMapaComboboxProps) {
  const [open, setOpen] = useState(false);
  const selecionado = OPCOES.find((opcao) => opcao.value === value);

  return (
    <div className={cn('w-full', className)}>
      <p className="mb-1 text-label-md font-medium text-foreground">Processo</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-9 w-full justify-between px-3 text-body-md font-normal"
          >
            <span className="truncate">{selecionado?.label ?? 'Todos'}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar processo..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhum processo encontrado.</CommandEmpty>
              <CommandGroup>
                {OPCOES.map((opcao) => (
                  <CommandItem
                    key={opcao.value}
                    value={opcao.label}
                    onSelect={() => {
                      onChange(opcao.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value === opcao.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {opcao.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function labelProcessoMapa(
  processo: MapaGrupoProcessoApi | 'devolucao',
): string {
  switch (processo) {
    case 'separacao':
      return 'Separação';
    case 'conferencia':
      return 'Conferência';
    case 'carregamento':
      return 'Carregamento';
    case 'devolucao':
      return 'Devolução';
    default:
      return processo;
  }
}

export function badgeProcessoMapaClassName(
  processo: MapaGrupoProcessoApi | 'devolucao',
): string {
  switch (processo) {
    case 'separacao':
      return 'bg-primary/15 text-primary';
    case 'conferencia':
      return 'bg-tertiary/15 text-tertiary';
    case 'carregamento':
      return 'bg-warning/15 text-warning';
    case 'devolucao':
      return 'bg-secondary/15 text-secondary';
    default:
      return 'bg-muted text-muted-foreground';
  }
}
