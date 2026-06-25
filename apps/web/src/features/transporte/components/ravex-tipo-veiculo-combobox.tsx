'use client';

import { useEffect, useRef, useState } from 'react';

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
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';

import { fieldLabelClassName } from '@/features/docas/components/form-field-classes';
import type { RavexTipoVeiculo } from '@/features/transporte/lib/perfis-tarifas-api';

const compactLabelClassName = cn(fieldLabelClassName, 'mb-1 text-xs');

type RavexTipoVeiculoComboboxProps = {
  tipos: RavexTipoVeiculo[];
  tipoSelecionado: RavexTipoVeiculo | null;
  isLoading: boolean;
  isDisabled: boolean;
  dialogOpen?: boolean;
  onSelect: (tipo: RavexTipoVeiculo) => void;
  onClear: () => void;
};

export function RavexTipoVeiculoCombobox({
  tipos,
  tipoSelecionado,
  isLoading,
  isDisabled,
  dialogOpen = true,
  onSelect,
  onClear,
}: RavexTipoVeiculoComboboxProps) {
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dialogOpen) {
      setOpen(false);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <section
      className={cn(
        'relative space-y-2.5 rounded-lg border border-outline-variant/60',
        'bg-surface-low/50 p-3 sm:p-3.5',
        open && 'z-20',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={compactLabelClassName}>Importar do Ravex</p>
          <p className="text-[10px] leading-snug text-muted-foreground">
            Abra a lista, busque pelo nome ou ID e selecione para preencher o
            formulário.
          </p>
        </div>
        {!isLoading && tipos.length > 0 ? (
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {tipos.length} tipos
          </span>
        ) : null}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isLoading || isDisabled}
            className={cn(
              'h-9 w-full justify-between px-3 font-normal',
              !tipoSelecionado && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {isLoading
                ? 'Carregando tipos de veículo...'
                : tipoSelecionado
                  ? `${tipoSelecionado.id} – ${tipoSelecionado.nome}`
                  : 'Buscar tipo de veículo...'}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          portalled={false}
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter>
            <CommandInput
              ref={searchInputRef}
              placeholder="Buscar por nome ou ID..."
            />
            <CommandList>
              <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
              <CommandGroup>
                {tipos.map((tipo) => (
                  <CommandItem
                    key={tipo.id}
                    value={`${tipo.id} ${tipo.nome}`}
                    onSelect={() => {
                      onSelect(tipo);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'size-4 shrink-0 text-primary',
                        tipoSelecionado?.id === tipo.id
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium text-foreground">
                        {tipo.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground group-aria-selected:text-foreground/70">
                        ID {tipo.id} · {tipo.peso} kg · {tipo.cubagem} m³
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {tipoSelecionado ? (
        <div
          className={cn(
            'flex items-center justify-between gap-2 rounded-lg border border-primary/20',
            'bg-primary/5 px-2.5 py-2',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
              Selecionado
            </p>
            <p className="truncate text-sm font-medium text-foreground">
              {tipoSelecionado.nome}
            </p>
            <p className="text-[10px] text-muted-foreground">
              ID {tipoSelecionado.id} · {tipoSelecionado.peso} kg ·{' '}
              {tipoSelecionado.cubagem} m³
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={onClear}
            disabled={isDisabled}
            aria-label="Limpar seleção Ravex"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Sincronizando com a Ravex...
        </div>
      ) : null}
    </section>
  );
}
