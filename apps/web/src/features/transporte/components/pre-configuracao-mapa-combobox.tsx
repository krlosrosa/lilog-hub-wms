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

import type { PreConfiguracaoMapa } from '@/features/transporte/types/transporte.schema';

type PreConfiguracaoMapaComboboxProps = {
  opcoes: PreConfiguracaoMapa[];
  selecionadaId: string | null;
  onSelecionar: (id: string | null) => void;
  carregando?: boolean;
  className?: string;
};

export function PreConfiguracaoMapaCombobox({
  opcoes,
  selecionadaId,
  onSelecionar,
  carregando = false,
  className,
}: PreConfiguracaoMapaComboboxProps) {
  const [open, setOpen] = useState(false);

  const selecionada = opcoes.find((opcao) => opcao.id === selecionadaId);

  return (
    <div className={cn('w-full sm:w-72', className)}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Pré-configuração
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={carregando}
            className={cn(
              'h-9 w-full justify-between px-3 text-xs font-normal',
              !selecionada && !carregando && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {carregando
                ? 'Carregando…'
                : (selecionada?.nome ?? 'Configuração personalizada')}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="end">
          <Command>
            <CommandInput placeholder="Buscar pré-configuração..." className="h-9" />
            <CommandList>
              <CommandEmpty>Nenhuma pré-configuração encontrada.</CommandEmpty>
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
                    value={`${opcao.nome} ${opcao.descricao ?? ''}`}
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
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{opcao.nome}</p>
                      {opcao.descricao && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {opcao.descricao}
                        </p>
                      )}
                    </div>
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
