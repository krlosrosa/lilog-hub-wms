'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Loader2, Search, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { useUnidadeContext } from '@/contexts/unidade-context';
import { listFuncionarios } from '@/features/funcionarios/lib/funcionario-api';
import {
  addEscalaFuncionarios,
  listEscalaFuncionarios,
  removeEscalaFuncionario,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import { EscalaTurnoBadge } from '@/features/sessao-operacao/components/escala-turno-badge';
import type { EscalaApi, EscalaFuncionarioApi } from '@/features/sessao-operacao/types/escala.api';
import { formatHorarioIntervalo } from '@/features/sessao-operacao/types/escala.schema';

type EscalaFuncionariosPanelProps = {
  escala: EscalaApi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
};

type Candidato = {
  id: number;
  label: string;
};

export function EscalaFuncionariosPanel({
  escala,
  open,
  onOpenChange,
  onChanged,
}: EscalaFuncionariosPanelProps) {
  const { unidadeSelecionada } = useUnidadeContext();
  const [membros, setMembros] = useState<EscalaFuncionarioApi[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [busca, setBusca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);

  const loadMembros = useCallback(async () => {
    if (!escala) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await listEscalaFuncionarios(escala.id);
      setMembros(response.items);
    } catch {
      toast.error('Não foi possível carregar os funcionários da escala.');
    } finally {
      setIsLoading(false);
    }
  }, [escala]);

  const loadCandidatos = useCallback(async () => {
    if (!escala || !unidadeSelecionada?.id) {
      return;
    }

    try {
      const response = await listFuncionarios({
        unidadeId: unidadeSelecionada.id,
        limit: 100,
        page: 1,
        situacao: 'ativo',
      });

      const vinculados = new Set(membros.map((item) => item.funcionarioId));
      setCandidatos(
        response.items
          .filter((item) => !vinculados.has(item.id))
          .map((item) => ({
            id: item.id,
            label: `${item.matricula} — ${item.nome}`,
          })),
      );
    } catch {
      toast.error('Não foi possível carregar funcionários disponíveis.');
    }
  }, [escala, membros, unidadeSelecionada?.id]);

  useEffect(() => {
    if (!open || !escala) {
      return;
    }

    void loadMembros();
  }, [open, escala, loadMembros]);

  useEffect(() => {
    if (!open || !escala) {
      return;
    }

    void loadCandidatos();
  }, [open, escala, membros, loadCandidatos]);

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setBusca('');
    }
  }, [open]);

  const resumoHorario = useMemo(() => {
    if (!escala) {
      return '';
    }

    return formatHorarioIntervalo(
      escala.horaInicioPlanejada,
      escala.horaFimPlanejada,
    );
  }, [escala]);

  const candidatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return candidatos;
    }

    return candidatos.filter((item) => item.label.toLowerCase().includes(termo));
  }, [busca, candidatos]);

  const todosVisiveisSelecionados =
    candidatosFiltrados.length > 0 &&
    candidatosFiltrados.every((item) => selectedIds.has(item.id));

  const algunsVisiveisSelecionados =
    candidatosFiltrados.some((item) => selectedIds.has(item.id)) &&
    !todosVisiveisSelecionados;

  const toggleSelecionado = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelecionarTodosVisiveis = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (todosVisiveisSelecionados) {
        for (const item of candidatosFiltrados) {
          next.delete(item.id);
        }
      } else {
        for (const item of candidatosFiltrados) {
          next.add(item.id);
        }
      }

      return next;
    });
  };

  const handleAdd = async () => {
    if (!escala || selectedIds.size === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addEscalaFuncionarios(
        escala.id,
        Array.from(selectedIds),
      );
      const quantidade = result.adicionados;
      toast.success(
        quantidade === 1
          ? 'Funcionário adicionado à escala.'
          : `${quantidade} funcionários adicionados à escala.`,
      );
      setSelectedIds(new Set());
      setBusca('');
      await loadMembros();
      onChanged();
    } catch {
      toast.error('Não foi possível adicionar os funcionários.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!escala) {
      return;
    }

    setIsSubmitting(true);

    try {
      await removeEscalaFuncionario(escala.id, id);
      toast.success('Funcionário removido da escala.');
      await loadMembros();
      onChanged();
    } catch {
      toast.error('Não foi possível remover o funcionário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full border-outline-variant bg-card sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-foreground">
            {escala?.nome ?? 'Escala'}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Equipe {escala?.equipeNome} · {resumoHorario}
            {escala?.cruzaMeiaNoite && (
              <span className="ml-2 inline-flex align-middle">
                <EscalaTurnoBadge cruzaMeiaNoite />
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-2 rounded-xl border border-outline-variant p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-body-sm font-medium text-foreground">
                Adicionar funcionários
              </p>
              {candidatos.length > 0 && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-body-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-outline-variant"
                    checked={todosVisiveisSelecionados}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = algunsVisiveisSelecionados;
                      }
                    }}
                    onChange={toggleSelecionarTodosVisiveis}
                    disabled={isSubmitting || candidatosFiltrados.length === 0}
                  />
                  Selecionar todos
                </label>
              )}
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Buscar por matrícula ou nome…"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                disabled={isSubmitting || candidatos.length === 0}
                className="h-9 w-full rounded-lg border border-outline-variant bg-background py-1.5 pl-8 pr-3 text-body-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-44 overflow-y-auto rounded-lg border border-outline-variant/60">
              {candidatos.length === 0 ? (
                <p className="px-3 py-4 text-center text-body-sm text-muted-foreground">
                  Nenhum funcionário disponível para adicionar.
                </p>
              ) : candidatosFiltrados.length === 0 ? (
                <p className="px-3 py-4 text-center text-body-sm text-muted-foreground">
                  Nenhum resultado para &quot;{busca}&quot;.
                </p>
              ) : (
                <ul className="divide-y divide-outline-variant/60">
                  {candidatosFiltrados.map((item) => (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-body-sm text-foreground hover:bg-surface-highest/60">
                        <input
                          type="checkbox"
                          className="size-3.5 rounded border-outline-variant"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelecionado(item.id)}
                          disabled={isSubmitting}
                        />
                        <span className="truncate">{item.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => void handleAdd()}
              disabled={selectedIds.size === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <UserPlus className="size-4" aria-hidden />
              )}
              {selectedIds.size === 0
                ? 'Adicionar selecionados'
                : selectedIds.size === 1
                  ? 'Adicionar 1 funcionário'
                  : `Adicionar ${selectedIds.size} funcionários`}
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant">
            <table className={compactTableClassName}>
              <thead>
                <tr className={compactTableHeadRowClassName}>
                  <th className={compactTableHeadCellClassName()}>Matrícula</th>
                  <th className={compactTableHeadCellClassName()}>Nome</th>
                  <th
                    className={compactTableHeadCellClassName('hidden md:table-cell')}
                  >
                    Cargo
                  </th>
                  <th className={compactTableHeadCellClassName('w-12')} />
                </tr>
              </thead>
              <tbody className={compactTableBodyClassName}>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : membros.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-body-sm text-muted-foreground">
                      Nenhum funcionário vinculado a esta escala.
                    </td>
                  </tr>
                ) : (
                  membros.map((membro) => (
                    <tr key={membro.id} className="border-b border-outline-variant/60">
                      <td className="px-4 py-3 text-body-sm text-foreground">
                        {membro.matricula}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-foreground">
                        {membro.nome}
                      </td>
                      <td className="hidden px-4 py-3 text-body-sm text-muted-foreground md:table-cell">
                        {membro.cargo}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          onClick={() => void handleRemove(membro.funcionarioId)}
                          aria-label={`Remover ${membro.nome}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
