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

import type { PreConfiguracaoImpressao } from '@/features/expedicao-impressao-config/types/impressao-config.schema';

type PreConfiguracaoImpressaoComboboxProps = {
  opcoes: PreConfiguracaoImpressao[];
  selecionadaId: string | null;
  onSelecionar: (id: string | null) => void;
  className?: string;
};

export function PreConfiguracaoImpressaoCombobox({
  opcoes,
  selecionadaId,
  onSelecionar,
  className,
}: PreConfiguracaoImpressaoComboboxProps) {
  const [open, setOpen] = useState(false);
  const selecionada = opcoes.find((opcao) => opcao.id === selecionadaId);

  return (
    <div className={cn('w-full sm:w-72', className)}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Configuração salva
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'h-9 w-full justify-between px-3 text-xs font-normal',
              !selecionada && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {selecionada?.nome ?? 'Configuração personalizada'}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="end"
        >
          <Command>
            <CommandInput
              placeholder="Buscar configuração..."
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>Nenhuma configuração salva.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="configuracao-personalizada"
                  onSelect={() => {
                    onSelecionar(null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-3.5',
                      selecionadaId === null ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  Configuração personalizada
                </CommandItem>
                {opcoes.map((opcao) => (
                  <CommandItem
                    key={opcao.id}
                    value={opcao.nome}
                    onSelect={() => {
                      onSelecionar(opcao.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-3.5',
                        selecionadaId === opcao.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate text-xs font-medium">
                      {opcao.nome}
                    </span>
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
