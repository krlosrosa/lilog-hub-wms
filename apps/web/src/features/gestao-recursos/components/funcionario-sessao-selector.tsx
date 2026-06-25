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
import { ChevronsUpDown, X } from 'lucide-react';

import { funcionarioMatchesBusca } from '@/features/gestao-recursos/lib/funcionario-busca';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

type FuncionarioSessaoSelectorProps = {
  funcionarios: SessaoFuncionarioApi[];
  value: string | null;
  onChange: (sessaoFuncionarioId: string | null) => void;
  missoesPorSessaoFuncionario?: Map<string, number>;
  disabled?: boolean;
  id?: string;
};

function filtrarFuncionariosPorBusca(
  funcionarios: SessaoFuncionarioApi[],
  busca: string,
): SessaoFuncionarioApi[] {
  const termo = busca.trim().toLowerCase();

  if (!termo) {
    return funcionarios;
  }

  return funcionarios.filter((funcionario) =>
    funcionarioMatchesBusca(funcionario, termo),
  );
}

export function FuncionarioSessaoSelector({
  funcionarios,
  value,
  onChange,
  missoesPorSessaoFuncionario,
  disabled = false,
  id,
}: FuncionarioSessaoSelectorProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const selecionado = useMemo(
    () => funcionarios.find((funcionario) => funcionario.id === value) ?? null,
    [funcionarios, value],
  );

  const funcionariosFiltrados = useMemo(
    () => filtrarFuncionariosPorBusca(funcionarios, busca),
    [funcionarios, busca],
  );

  useEffect(() => {
    if (!open) {
      setBusca('');
    }
  }, [open]);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || funcionarios.length === 0}
            className={cn(
              'h-9 w-full min-w-0 justify-between px-2.5 text-left text-caption font-normal',
              !selecionado && 'text-muted-foreground',
            )}
          >
            <span className="min-w-0 truncate">
              {funcionarios.length === 0
                ? 'Nenhum funcionário presente'
                : selecionado
                  ? `${selecionado.matricula} — ${selecionado.nome}`
                  : 'Selecionar responsável'}
            </span>
            <ChevronsUpDown
              className="ml-1 size-3.5 shrink-0 opacity-50"
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Matrícula, ID ou nome..."
              value={busca}
              onValueChange={setBusca}
              className="h-9 text-caption"
            />
            <CommandList className="max-h-60">
              {funcionariosFiltrados.length === 0 ? (
                <CommandEmpty>
                  {busca.trim()
                    ? `Nenhum resultado para "${busca.trim()}".`
                    : 'Nenhum funcionário disponível.'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {funcionariosFiltrados.map((funcionario) => {
                    const missoesAtivas =
                      missoesPorSessaoFuncionario?.get(funcionario.id) ?? 0;
                    const selected = value === funcionario.id;

                    return (
                      <CommandItem
                        key={funcionario.id}
                        value={funcionario.id}
                        onSelect={() => {
                          onChange(funcionario.id);
                          setOpen(false);
                        }}
                        className={cn(
                          'cursor-pointer py-2',
                          selected && 'bg-primary/10',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-caption font-medium text-foreground">
                            {funcionario.nome}
                            {missoesAtivas > 0 ? (
                              <span className="ml-1 font-normal text-muted-foreground">
                                ({missoesAtivas})
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate font-mono text-[10px] text-muted-foreground">
                            {funcionario.matricula} · ID{' '}
                            {funcionario.funcionarioId}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selecionado && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onChange(null)}
          aria-label="Limpar responsável selecionado"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
