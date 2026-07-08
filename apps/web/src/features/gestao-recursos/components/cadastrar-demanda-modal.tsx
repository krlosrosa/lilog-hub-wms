'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Loader2, Lock, MapPin, Search, X } from 'lucide-react';
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

import {
  criarDemandas,
  listMapasGrupoDisponiveis,
} from '@/features/gestao-recursos/lib/gestao-recursos-api';
import {
  atualizarDadosCarregamentoTransporte,
  listDocasExpedicao,
  type DocaSelectItem,
} from '@/features/gestao-recursos/lib/doca-api';
import {
  ProcessoMapaCombobox,
  badgeProcessoMapaClassName,
  labelProcessoMapa,
  type FiltroProcessoMapa,
} from '@/features/gestao-recursos/components/processo-mapa-combobox';
import { FuncionarioSessaoSelector } from '@/features/gestao-recursos/components/funcionario-sessao-selector';
import type { MapaGrupoDisponivelApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { MapaGrupoProcessoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import { OperadorProximaPausaResumo } from '@/features/gestao-recursos/components/operador-proxima-pausa-resumo';

type CadastrarDemandaModalProps = {
  open: boolean;
  sessaoId: string;
  unidadeId?: string | null;
  funcionarios: SessaoFuncionarioApi[];
  operators?: Operator[];
  preselectedSessaoFuncionarioId: string | null;
  processoFixo?: MapaGrupoProcessoApi;
  isSubmitting: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
};

const fieldClassName =
  'h-9 w-full rounded-md border border-outline-variant bg-background px-2.5 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const labelClassName =
  'text-[11px] font-medium uppercase tracking-wide text-muted-foreground';

function encontrarMapaPorIdentificador(
  mapas: MapaGrupoDisponivelApi[],
  identificador: string,
): MapaGrupoDisponivelApi | undefined {
  const termo = identificador.trim().toLowerCase();
  if (!termo) return undefined;

  return (
    mapas.find((mapa) => mapa.microUuid.toLowerCase() === termo) ??
    mapas.find((mapa) => mapa.id.toLowerCase() === termo) ??
    mapas.find((mapa) => mapa.microUuid.toLowerCase().includes(termo))
  );
}

function mapaCorrespondeBusca(
  mapa: MapaGrupoDisponivelApi,
  termo: string,
): boolean {
  const q = termo.trim().toLowerCase();
  if (!q) return true;

  return (
    mapa.microUuid.toLowerCase().includes(q) ||
    mapa.id.toLowerCase().includes(q) ||
    mapa.titulo.toLowerCase().includes(q) ||
    (mapa.transporteRota?.toLowerCase().includes(q) ?? false)
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

function mensagemSucessoAtribuicao(
  processo: MapaGrupoProcessoApi | undefined,
  quantidadeMapas: number,
): string {
  const plural = quantidadeMapas === 1 ? '' : 's';

  if (processo === 'carregamento') {
    return 'Carregamento iniciado com sucesso.';
  }

  if (processo === 'conferencia') {
    return `${quantidadeMapas} mapa${plural} atribuído${plural} à conferência.`;
  }

  if (processo === 'separacao') {
    return `${quantidadeMapas} mapa${plural} atribuído${plural} à separação.`;
  }

  return `${quantidadeMapas} demanda${plural} atribuída${plural} com sucesso.`;
}

export function CadastrarDemandaModal({
  open,
  sessaoId,
  unidadeId,
  funcionarios,
  operators = [],
  preselectedSessaoFuncionarioId,
  processoFixo,
  isSubmitting,
  onClose,
  onSuccess,
}: CadastrarDemandaModalProps) {
  const isCarregamento = processoFixo === 'carregamento';
  const [mapas, setMapas] = useState<MapaGrupoDisponivelApi[]>([]);
  const [selectedMapaIds, setSelectedMapaIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedMapasCache, setSelectedMapasCache] = useState<
    Map<string, MapaGrupoDisponivelApi>
  >(() => new Map());
  const [sessaoFuncionarioId, setSessaoFuncionarioId] = useState<string | null>(
    null,
  );
  const [isLoadingMapas, setIsLoadingMapas] = useState(false);
  const [filtroProcesso, setFiltroProcesso] = useState<FiltroProcessoMapa>('todos');
  const [buscaMapa, setBuscaMapa] = useState('');
  const [docas, setDocas] = useState<DocaSelectItem[]>([]);
  const [docaId, setDocaId] = useState('');
  const [lacreCarregamento, setLacreCarregamento] = useState('');
  const [isLoadingDocas, setIsLoadingDocas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const mapaInputRef = useRef<HTMLInputElement>(null);

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

  const loadMapas = useCallback(async () => {
    setIsLoadingMapas(true);
    try {
      const response = await listMapasGrupoDisponiveis(sessaoId, {
        processo:
          processoFixo ??
          (filtroProcesso === 'todos' ? undefined : filtroProcesso),
      });
      setMapas(response.items);
    } catch {
      toast.error('Não foi possível carregar os mapas disponíveis.');
      setMapas([]);
    } finally {
      setIsLoadingMapas(false);
    }
  }, [sessaoId, filtroProcesso, processoFixo]);

  useEffect(() => {
    if (!open) {
      setIsSaving(false);
      return;
    }
    setSelectedMapaIds(new Set());
    setSelectedMapasCache(new Map());
    setSessaoFuncionarioId(preselectedSessaoFuncionarioId);
    setFiltroProcesso(processoFixo ?? 'todos');
    setBuscaMapa('');
    setDocaId('');
    setLacreCarregamento('');
  }, [open, preselectedSessaoFuncionarioId, processoFixo]);

  useEffect(() => {
    if (!open || !isCarregamento || !unidadeId) {
      setDocas([]);
      return;
    }

    setIsLoadingDocas(true);
    void listDocasExpedicao(unidadeId)
      .then(setDocas)
      .catch(() => {
        toast.error('Não foi possível carregar as docas.');
        setDocas([]);
      })
      .finally(() => {
        setIsLoadingDocas(false);
      });
  }, [open, isCarregamento, unidadeId]);

  useEffect(() => {
    if (!open) return;
    void loadMapas();
  }, [open, loadMapas]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => mapaInputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  const selectedOperator = useMemo(
    () => operators.find((item) => item.id === sessaoFuncionarioId) ?? null,
    [operators, sessaoFuncionarioId],
  );

  const mapasSelecionados = useMemo(
    () =>
      [...selectedMapaIds]
        .map((id) => selectedMapasCache.get(id) ?? mapas.find((m) => m.id === id))
        .filter((mapa): mapa is MapaGrupoDisponivelApi => mapa != null),
    [selectedMapaIds, selectedMapasCache, mapas],
  );

  const termoBuscaMapa = buscaMapa.trim();

  const mapasFiltrados = useMemo(
    () =>
      termoBuscaMapa
        ? mapas.filter((mapa) => mapaCorrespondeBusca(mapa, termoBuscaMapa))
        : mapas,
    [mapas, termoBuscaMapa],
  );

  const cacheMapaSelecionado = useCallback((mapa: MapaGrupoDisponivelApi) => {
    setSelectedMapasCache((prev) => {
      const next = new Map(prev);
      next.set(mapa.id, mapa);
      return next;
    });
  }, []);

  const toggleMapa = useCallback(
    (mapa: MapaGrupoDisponivelApi) => {
      setSelectedMapaIds((prev) => {
        const next = new Set(prev);
        if (next.has(mapa.id)) {
          next.delete(mapa.id);
        } else {
          next.add(mapa.id);
          cacheMapaSelecionado(mapa);
        }
        return next;
      });
    },
    [cacheMapaSelecionado],
  );

  const removerMapa = useCallback((mapaId: string) => {
    setSelectedMapaIds((prev) => {
      const next = new Set(prev);
      next.delete(mapaId);
      return next;
    });
  }, []);

  const adicionarMapaPorIdentificador = useCallback(
    async (identificador: string) => {
      let mapa = encontrarMapaPorIdentificador(mapas, identificador);

      if (!mapa) {
        try {
          const response = await listMapasGrupoDisponiveis(sessaoId);
          mapa = encontrarMapaPorIdentificador(response.items, identificador);
        } catch {
          toast.error('Não foi possível buscar o mapa.');
          return;
        }
      }

      if (!mapa) {
        toast.error('Mapa não encontrado com esse ID.');
        return;
      }

      setSelectedMapaIds((prev) => {
        if (prev.has(mapa!.id)) {
          toast.info('Este mapa já está selecionado.');
          return prev;
        }
        const next = new Set(prev);
        next.add(mapa!.id);
        toast.success(`Mapa ${mapa!.microUuid} adicionado.`);
        return next;
      });
      cacheMapaSelecionado(mapa);
      setBuscaMapa('');
    },
    [mapas, sessaoId, cacheMapaSelecionado],
  );

  const handleMapaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void adicionarMapaPorIdentificador(buscaMapa);
  };

  const transportesSelecionados = useMemo(
    () => [...new Set(mapasSelecionados.map((mapa) => mapa.transporteId))],
    [mapasSelecionados],
  );

  const handleSubmit = async () => {
    if (isBusy) {
      return;
    }

    if (!sessaoFuncionarioId) {
      toast.error('Selecione um funcionário.');
      return;
    }

    if (selectedMapaIds.size === 0) {
      toast.error('Selecione ao menos um mapa-grupo.');
      return;
    }

    if (isCarregamento && !docaId) {
      toast.error('Selecione a doca de carregamento.');
      return;
    }

    const quantidadeMapas = selectedMapaIds.size;

    setIsSaving(true);

    try {
      await criarDemandas({
        sessaoId,
        sessaoFuncionarioId,
        mapaGrupoIds: [...selectedMapaIds],
      });

      if (isCarregamento && unidadeId && (docaId || lacreCarregamento.trim())) {
        await Promise.all(
          transportesSelecionados.map((transporteId) =>
            atualizarDadosCarregamentoTransporte(transporteId, {
              unidadeId,
              docaId: docaId || null,
              lacreCarregamento: lacreCarregamento.trim() || null,
            }),
          ),
        );
      }

      toast.success(
        mensagemSucessoAtribuicao(processoFixo, quantidadeMapas),
      );
      onClose();
      await onSuccess();
    } catch {
      toast.error('Não foi possível cadastrar as demandas.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitLabel = isBusy
    ? 'Salvando...'
    : isCarregamento
      ? `Iniciar carregamento${selectedMapaIds.size ? ` · ${selectedMapaIds.size} mapa${selectedMapaIds.size === 1 ? '' : 's'}` : ''}`
      : `Atribuir ${selectedMapaIds.size || ''} mapa${selectedMapaIds.size === 1 ? '' : 's'}`;

  const renderMapaDisponivel = (mapa: MapaGrupoDisponivelApi, compact = false) => {
    const selected = selectedMapaIds.has(mapa.id);

    return (
      <li key={mapa.id}>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => toggleMapa(mapa)}
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
                'font-medium text-foreground',
                compact ? 'text-[11px] leading-tight' : 'text-caption',
              )}
            >
              {mapa.titulo}
            </p>
            {!isCarregamento ? (
              <span
                className={cn(
                  'shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase',
                  badgeProcessoMapaClassName(mapa.processo),
                )}
              >
                {labelProcessoMapa(mapa.processo)}
              </span>
            ) : null}
          </div>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {mapa.microUuid}
          </p>
          {!compact ? (
            <p className="text-[10px] text-muted-foreground">
              {mapa.transporteRota ?? 'Sem rota'} · {mapa.totalItens} itens ·{' '}
              {mapa.pesoTotalKg.toFixed(1)} kg
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {mapa.transporteRota ?? 'Sem rota'}
            </p>
          )}
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
                {isCarregamento ? 'Iniciar carregamento' : 'Cadastrar demanda'}
              </DialogTitle>
              <DialogDescription className="text-caption">
                {isCarregamento
                  ? 'Responsável, doca, lacre e mapas do veículo.'
                  : 'Atribua mapas a um funcionário. Escaneie o QR ou selecione na lista.'}
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
                id="funcionario-demanda"
                funcionarios={funcionariosElegiveis}
                value={sessaoFuncionarioId}
                onChange={setSessaoFuncionarioId}
                missoesPorSessaoFuncionario={missoesPorSessaoFuncionario}
                disabled={isBusy}
              />
            </label>

            {isCarregamento ? (
              <>
                <label className="block space-y-1">
                  <span className={labelClassName}>Doca</span>
                  <select
                    value={docaId}
                    disabled={isLoadingDocas || isBusy}
                    onChange={(event) => setDocaId(event.target.value)}
                    className={fieldClassName}
                  >
                    <option value="">
                      {isLoadingDocas ? 'Carregando...' : 'Selecionar'}
                    </option>
                    {docas.map((doca) => (
                      <option key={doca.id} value={doca.id}>
                        {doca.codigo} · {doca.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className={labelClassName}>Lacre</span>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="text"
                      value={lacreCarregamento}
                      maxLength={100}
                      disabled={isBusy}
                      onChange={(event) =>
                        setLacreCarregamento(event.target.value)
                      }
                      placeholder="Opcional"
                      className={cn(fieldClassName, 'pl-8')}
                    />
                  </div>
                </label>
              </>
            ) : !processoFixo ? (
              <ProcessoMapaCombobox
                value={filtroProcesso}
                onChange={setFiltroProcesso}
                disabled={isLoadingMapas || isBusy}
              />
            ) : null}

            {isCarregamento && transportesSelecionados.length > 1 ? (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden />
                Doca e lacre serão aplicados a {transportesSelecionados.length}{' '}
                transportes.
              </p>
            ) : null}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className={labelClassName}>Mapas selecionados</span>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {mapasSelecionados.length}
                </span>
              </div>
              {mapasSelecionados.length === 0 ? (
                <p className="rounded-md border border-dashed border-outline-variant px-3 py-4 text-center text-caption text-muted-foreground">
                  Escaneie ou selecione mapas à direita.
                </p>
              ) : (
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-outline-variant bg-muted/15 p-1.5">
                  {mapasSelecionados.map((mapa) => (
                    <li
                      key={mapa.id}
                      className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[11px] font-semibold text-foreground">
                          {mapa.microUuid}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {mapa.titulo}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 shrink-0 p-0"
                        disabled={isBusy}
                        onClick={() => removerMapa(mapa.id)}
                        aria-label={`Remover mapa ${mapa.microUuid}`}
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
              <span className={labelClassName}>Adicionar mapa</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={mapaInputRef}
                  value={buscaMapa}
                  onChange={(event) => setBuscaMapa(event.target.value)}
                  onKeyDown={handleMapaKeyDown}
                  placeholder="Filtrar ou digite o ID do mapa (Enter para adicionar)..."
                  className={cn(fieldClassName, 'pl-8')}
                  disabled={isLoadingMapas || isBusy}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2">
              <span className={labelClassName}>Mapas disponíveis</span>
              {!isLoadingMapas ? (
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {termoBuscaMapa
                    ? `${mapasFiltrados.length} de ${mapas.length}`
                    : mapas.length}
                </span>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 rounded-md border border-outline-variant bg-muted/15 p-1.5">
              {isLoadingMapas ? (
                <div className="flex h-full min-h-64 items-center justify-center">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : mapas.length === 0 ? (
                <p className="px-2 py-10 text-center text-caption text-muted-foreground">
                  Nenhum mapa disponível
                  {!isCarregamento && filtroProcesso !== 'todos'
                    ? ` em ${labelProcessoMapa(filtroProcesso).toLowerCase()}`
                    : ''}
                  .
                </p>
              ) : mapasFiltrados.length === 0 ? (
                <p className="px-2 py-10 text-center text-caption text-muted-foreground">
                  Nenhum mapa encontrado para &quot;{termoBuscaMapa}&quot;.
                </p>
              ) : (
                <ul className="grid max-h-[min(62vh,560px)] grid-cols-1 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
                  {mapasFiltrados.map((mapa) => renderMapaDisponivel(mapa, true))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-outline-variant bg-background px-5 py-3 sm:justify-between">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            {selectedMapaIds.size > 0
              ? `${selectedMapaIds.size} mapa${selectedMapaIds.size === 1 ? '' : 's'} selecionado${selectedMapaIds.size === 1 ? '' : 's'}`
              : 'Nenhum mapa selecionado'}
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
                isLoadingMapas ||
                (isCarregamento && isLoadingDocas) ||
                !sessaoFuncionarioId ||
                selectedMapaIds.size === 0 ||
                (isCarregamento && !docaId)
              }
              onClick={() => void handleSubmit()}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
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
