'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loader2, Search, Truck, X } from 'lucide-react';
import { toast } from 'sonner';

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

import { DevolucaoStatusBadge } from '@/features/devolucao/components/devolucao-status-badge';
import { listarDemandasDevolucao } from '@/features/devolucao/lib/devolucao-api';
import type { DemandaDevolucaoListItem } from '@/features/devolucao/types/devolucao-gestao.schema';
import {
  DEVOLUCAO_NF_TIPO_LABELS,
  formatPesoDevolucao,
} from '@/features/devolucao/types/devolucao-gestao.schema';
import { FuncionarioSessaoSelector } from '@/features/gestao-recursos/components/funcionario-sessao-selector';
import { OperadorProximaPausaResumo } from '@/features/gestao-recursos/components/operador-proxima-pausa-resumo';
import { alocarOperadorDemandaDevolucao } from '@/features/gestao-recursos/lib/gestao-recursos-api';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';

type AlocarDemandaDevolucaoModalProps = {
  open: boolean;
  sessaoId: string;
  unidadeId: string;
  funcionarios: SessaoFuncionarioApi[];
  operators?: Operator[];
  preselectedSessaoFuncionarioId: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  setIsSubmitting: (value: boolean) => void;
};

const STATUS_ELEGIVEIS = new Set([
  'aberta',
  'em_analise',
  'em_execucao',
]);

const fieldClassName =
  'h-9 w-full rounded-md border border-outline-variant bg-background px-2.5 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const labelClassName =
  'text-[11px] font-medium uppercase tracking-wide text-muted-foreground';

function demandaCorrespondeBusca(
  demanda: DemandaDevolucaoListItem,
  termo: string,
): boolean {
  const q = termo.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    demanda.codigoDemanda.toLowerCase().includes(q) ||
    (demanda.transporteId?.toLowerCase().includes(q) ?? false) ||
    (demanda.placa?.toLowerCase().includes(q) ?? false) ||
    (demanda.cliente?.toLowerCase().includes(q) ?? false)
  );
}

function deveExibirAlertaPausa(operator: Operator | null): operator is Operator {
  if (!operator) {
    return false;
  }

  return Boolean(
    operator.emPausa ||
      operator.precisaPausa ||
      operator.pausaAtrasoMinutos != null,
  );
}

export function AlocarDemandaDevolucaoModal({
  open,
  sessaoId,
  unidadeId,
  funcionarios,
  operators = [],
  preselectedSessaoFuncionarioId,
  isSubmitting,
  onClose,
  onSuccess,
  setIsSubmitting,
}: AlocarDemandaDevolucaoModalProps) {
  const [demandas, setDemandas] = useState<DemandaDevolucaoListItem[]>([]);
  const [selectedDemandaIds, setSelectedDemandaIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedDemandasCache, setSelectedDemandasCache] = useState<
    Map<string, DemandaDevolucaoListItem>
  >(() => new Map());
  const [sessaoFuncionarioId, setSessaoFuncionarioId] = useState<string | null>(
    null,
  );
  const [isLoadingDemandas, setIsLoadingDemandas] = useState(false);
  const [buscaDemanda, setBuscaDemanda] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const buscaInputRef = useRef<HTMLInputElement>(null);

  const isBusy = isSaving || isSubmitting;

  const funcionariosElegiveis = useMemo(
    () =>
      funcionarios.filter(
        (f) => f.status === 'presente' || f.status === 'atraso',
      ),
    [funcionarios],
  );

  const missoesPorSessaoFuncionario = useMemo(() => {
    const map = new Map<string, number>();
    for (const operator of operators) {
      const count =
        operator.tasks?.length ?? (operator.status === 'atuando' ? 1 : 0);
      map.set(operator.id, count);
    }
    return map;
  }, [operators]);

  useEffect(() => {
    if (!open) {
      setIsSaving(false);
      return;
    }

    setSelectedDemandaIds(new Set());
    setSelectedDemandasCache(new Map());
    setSessaoFuncionarioId(preselectedSessaoFuncionarioId);
    setBuscaDemanda('');
    setIsLoadingDemandas(true);

    void listarDemandasDevolucao(unidadeId)
      .then((response) => {
        setDemandas(
          response.demandas.filter((demanda) =>
            STATUS_ELEGIVEIS.has(demanda.status),
          ),
        );
      })
      .catch(() => {
        toast.error('Não foi possível carregar demandas de devolução');
        setDemandas([]);
      })
      .finally(() => {
        setIsLoadingDemandas(false);
      });
  }, [open, unidadeId, preselectedSessaoFuncionarioId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => buscaInputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  const selectedOperator = useMemo(
    () => operators.find((item) => item.id === sessaoFuncionarioId) ?? null,
    [operators, sessaoFuncionarioId],
  );

  const demandasSelecionadas = useMemo(
    () =>
      [...selectedDemandaIds]
        .map(
          (id) =>
            selectedDemandasCache.get(id) ??
            demandas.find((demanda) => demanda.id === id),
        )
        .filter((demanda): demanda is DemandaDevolucaoListItem => demanda != null),
    [selectedDemandaIds, selectedDemandasCache, demandas],
  );

  const termoBuscaDemanda = buscaDemanda.trim();

  const demandasFiltradas = useMemo(
    () =>
      termoBuscaDemanda
        ? demandas.filter((demanda) =>
            demandaCorrespondeBusca(demanda, termoBuscaDemanda),
          )
        : demandas,
    [demandas, termoBuscaDemanda],
  );

  const cacheDemandaSelecionada = useCallback((demanda: DemandaDevolucaoListItem) => {
    setSelectedDemandasCache((prev) => {
      const next = new Map(prev);
      next.set(demanda.id, demanda);
      return next;
    });
  }, []);

  const toggleDemanda = useCallback(
    (demanda: DemandaDevolucaoListItem) => {
      setSelectedDemandaIds((prev) => {
        const next = new Set(prev);
        if (next.has(demanda.id)) {
          next.delete(demanda.id);
        } else {
          next.add(demanda.id);
          cacheDemandaSelecionada(demanda);
        }
        return next;
      });
    },
    [cacheDemandaSelecionada],
  );

  const removerDemanda = useCallback((demandaId: string) => {
    setSelectedDemandaIds((prev) => {
      const next = new Set(prev);
      next.delete(demandaId);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isBusy) {
      return;
    }

    if (!sessaoFuncionarioId) {
      toast.error('Selecione um operador.');
      return;
    }

    if (selectedDemandaIds.size === 0) {
      toast.error('Selecione ao menos uma demanda.');
      return;
    }

    setIsSaving(true);
    setIsSubmitting(true);

    try {
      await Promise.all(
        [...selectedDemandaIds].map((demandaId) =>
          alocarOperadorDemandaDevolucao({
            unidadeId,
            demandaId,
            sessaoId,
            sessaoFuncionarioId,
            funcao: 'conferente',
          }),
        ),
      );

      const quantidade = selectedDemandaIds.size;
      toast.success(
        quantidade === 1
          ? 'Operador alocado com sucesso.'
          : `${quantidade} demandas alocadas com sucesso.`,
      );
      onClose();
      await onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao alocar operador',
      );
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  }, [
    isBusy,
    sessaoFuncionarioId,
    selectedDemandaIds,
    unidadeId,
    sessaoId,
    onClose,
    onSuccess,
    setIsSubmitting,
  ]);

  const submitLabel = isBusy
    ? 'Alocando...'
    : `Alocar operador${selectedDemandaIds.size ? ` · ${selectedDemandaIds.size} demanda${selectedDemandaIds.size === 1 ? '' : 's'}` : ''}`;

  const renderDemandaDisponivel = (
    demanda: DemandaDevolucaoListItem,
    compact = false,
  ) => {
    const selected = selectedDemandaIds.has(demanda.id);
    const tipoLabel =
      demanda.tiposNf.length > 0
        ? demanda.tiposNf.map((tipo) => DEVOLUCAO_NF_TIPO_LABELS[tipo]).join(', ')
        : 'Sem tipo';

    return (
      <li key={demanda.id}>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => toggleDemanda(demanda)}
          className={cn(
            'w-full rounded-md border px-2.5 text-left transition-colors',
            compact ? 'py-1.5' : 'py-2',
            selected
              ? 'border-primary bg-primary/10'
              : 'border-outline-variant bg-surface-low hover:bg-surface-high/40',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'font-mono font-semibold text-foreground',
                compact ? 'text-[11px] leading-tight' : 'text-caption',
              )}
            >
              {demanda.codigoDemanda}
            </p>
            <DevolucaoStatusBadge status={demanda.status} compact />
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            {demanda.cliente ?? 'Sem cliente'}
          </p>
          {!compact ? (
            <p className="text-[10px] text-muted-foreground">
              {demanda.transporteId ?? 'Sem transporte'} · {demanda.placa ?? 'Sem placa'} ·{' '}
              {demanda.totalNfs} NF · {formatPesoDevolucao(demanda.pesoDevolvido)}
            </p>
          ) : (
            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Truck className="size-3 shrink-0" aria-hidden />
              {demanda.placa ?? 'Sem placa'} · {demanda.transporteId ?? '—'}
            </p>
          )}
          {!compact ? (
            <p className="truncate text-[10px] text-muted-foreground">{tipoLabel}</p>
          ) : null}
        </button>
      </li>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isBusy && onClose()}>
      <DialogContent className="flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <div className="shrink-0 border-b border-outline-variant pb-4 pl-5 pr-12 pt-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-headline-sm">
                Alocar operador — Devolução
              </DialogTitle>
              <DialogDescription className="text-caption">
                Selecione o operador e as demandas de devolução abertas para alocação na sessão.
              </DialogDescription>
            </DialogHeader>

            {deveExibirAlertaPausa(selectedOperator) ? (
              <OperadorProximaPausaResumo
                operator={selectedOperator}
                layout="inline"
                className="w-full shrink-0 lg:max-w-sm"
              />
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <div className="min-h-0 space-y-3 overflow-y-auto border-b border-outline-variant px-5 py-4 lg:border-b-0 lg:border-r">
            <label className="block space-y-1">
              <span className={labelClassName}>Responsável</span>
              <FuncionarioSessaoSelector
                id="funcionario-devolucao"
                funcionarios={funcionariosElegiveis}
                value={sessaoFuncionarioId}
                onChange={setSessaoFuncionarioId}
                missoesPorSessaoFuncionario={missoesPorSessaoFuncionario}
                disabled={isBusy}
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={labelClassName}>Demandas selecionadas</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {demandasSelecionadas.length}
                </span>
              </div>
              {demandasSelecionadas.length === 0 ? (
                <p className="rounded-md border border-dashed border-outline-variant px-3 py-4 text-center text-caption text-muted-foreground">
                  Selecione demandas à direita.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-outline-variant bg-muted/15 p-1.5">
                  {demandasSelecionadas.map((demanda) => (
                    <li
                      key={demanda.id}
                      className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[11px] font-semibold text-foreground">
                          {demanda.codigoDemanda}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {demanda.placa ?? 'Sem placa'} ·{' '}
                          {demanda.transporteId ?? 'Sem transporte'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 shrink-0 p-0"
                        disabled={isBusy}
                        onClick={() => removerDemanda(demanda.id)}
                        aria-label={`Remover demanda ${demanda.codigoDemanda}`}
                      >
                        <X className="size-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col space-y-1.5 overflow-hidden px-5 py-4">
            <div className="space-y-1.5">
              <span className={labelClassName}>Buscar demanda</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={buscaInputRef}
                  value={buscaDemanda}
                  onChange={(event) => setBuscaDemanda(event.target.value)}
                  placeholder="Buscar por viagem, transporte ou placa..."
                  className={cn(fieldClassName, 'pl-8')}
                  disabled={isLoadingDemandas || isBusy}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2">
              <span className={labelClassName}>Demandas disponíveis</span>
              {!isLoadingDemandas ? (
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {termoBuscaDemanda
                    ? `${demandasFiltradas.length} de ${demandas.length}`
                    : demandas.length}
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 rounded-md border border-outline-variant bg-muted/15 p-1.5">
              {isLoadingDemandas ? (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : demandas.length === 0 ? (
                <p className="px-2 py-10 text-center text-caption text-muted-foreground">
                  Nenhuma demanda elegível para alocação.
                </p>
              ) : demandasFiltradas.length === 0 ? (
                <p className="px-2 py-10 text-center text-caption text-muted-foreground">
                  Nenhuma demanda encontrada para &quot;{termoBuscaDemanda}&quot;.
                </p>
              ) : (
                <ul className="grid max-h-[min(62vh,560px)] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
                  {demandasFiltradas.map((demanda) =>
                    renderDemandaDisponivel(demanda, true),
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-outline-variant bg-background px-5 py-3 sm:justify-between">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            {selectedDemandaIds.size > 0
              ? `${selectedDemandaIds.size} demanda${selectedDemandaIds.size === 1 ? '' : 's'} selecionada${selectedDemandaIds.size === 1 ? '' : 's'}`
              : 'Nenhuma demanda selecionada'}
          </p>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-9"
              disabled={isBusy}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-9 min-w-[9rem]"
              disabled={
                isBusy ||
                isLoadingDemandas ||
                !sessaoFuncionarioId ||
                selectedDemandaIds.size === 0
              }
              onClick={() => void handleSubmit()}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Alocando...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
