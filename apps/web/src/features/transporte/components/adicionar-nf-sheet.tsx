'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from '@lilog/ui';
import { FilePlus, Loader2, MapPin, Package, Search } from 'lucide-react';

import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import { useVincularNfsDevolucao } from '@/features/transporte/hooks/use-vincular-nfs-devolucao';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';
import type { DevolucaoNfElegivelApiItem } from '@/features/transporte/lib/expedicao-api';

const nf = new Intl.NumberFormat('pt-BR');

const filterInputClass = cn(
  'rounded-md border border-outline-variant bg-surface-low text-xs text-foreground',
  'focus:outline-none focus:ring-1 focus:ring-ring',
);

function filtrarNotasFiscais(
  notas: DevolucaoNfElegivelApiItem[],
  termo: string,
): DevolucaoNfElegivelApiItem[] {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return notas;
  }

  return notas.filter((nota) => {
    const numeroNf = nota.numeroNf.toLowerCase();
    const cliente = (nota.cliente ?? '').toLowerCase();
    const codCliente = (nota.codCliente ?? '').toLowerCase();

    return (
      numeroNf.includes(busca) ||
      cliente.includes(busca) ||
      codCliente.includes(busca)
    );
  });
}

function formatarPesoCompacto(peso: number): string {
  if (peso >= 1000) {
    return `${(peso / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}t`;
  }

  return `${nf.format(peso)} kg`;
}

type AdicionarNfSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transporte: TransporteGrupo | null;
  unidadeId: string | null;
  onVinculado?: () => void | Promise<void>;
};

export function AdicionarNfSheet({
  open,
  onOpenChange,
  transporte,
  unidadeId,
  onVinculado,
}: AdicionarNfSheetProps) {
  const [busca, setBusca] = useState('');

  const {
    notasFiscais,
    remessasReentregaVinculadas,
    selecionados,
    carregando,
    vinculando,
    intervaloData,
    setIntervaloData,
    toggleSelecionado,
    vincularSelecionados,
    recarregar,
  } = useVincularNfsDevolucao({
    transporteId: transporte?.id ?? null,
    unidadeId,
    open,
    onVinculado,
  });

  useEffect(() => {
    if (!open) {
      setBusca('');
    }
  }, [open]);

  const notasFiltradas = useMemo(
    () => filtrarNotasFiscais(notasFiscais, busca),
    [notasFiscais, busca],
  );

  if (!transporte) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex h-full w-[96vw] max-w-none flex-col gap-0',
          'rounded-l-2xl border-outline-variant bg-card p-0 shadow-2xl sm:max-w-none',
        )}
      >
        <SheetHeader className="shrink-0 space-y-0 border-b border-outline-variant/60 bg-surface-low/30 px-8 py-6 text-left">
          <div className="flex items-start justify-between gap-6 pr-10">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Adicionar NF
              </p>
              <SheetTitle className="truncate text-2xl font-bold tracking-tight text-foreground">
                {transporte.rota}
              </SheetTitle>
            </div>
            <TransporteStatusBadge status={transporte.status} />
          </div>

          <SheetDescription asChild>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-highest px-3 py-1 text-sm text-foreground ring-1 ring-inset ring-outline-variant/50">
                <Package className="size-3.5 text-muted-foreground" aria-hidden />
                {transporte.quantidadeRemessas} NFs ·{' '}
                {formatarPesoCompacto(transporte.pesoTotal)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-highest px-3 py-1 text-sm text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                <MapPin className="size-3.5" aria-hidden />
                {transporte.cidade} · {transporte.bairro}
              </span>
              {remessasReentregaVinculadas > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary ring-1 ring-inset ring-primary/20">
                  {remessasReentregaVinculadas} reentrega(s) vinculada(s)
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col bg-surface-low/10">
          <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Selecione NFs de reentrega ou devolução total para vincular
                como remessas neste transporte.
              </p>

              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-outline-variant/60 bg-surface-low/30 px-3 py-3">
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Período
                  </span>
                  <input
                    type="date"
                    value={intervaloData.dataInicio}
                    onChange={(event) =>
                      setIntervaloData({
                        ...intervaloData,
                        dataInicio: event.target.value,
                      })
                    }
                    aria-label="Data início do período"
                    className={cn(filterInputClass, 'px-2 py-1.5')}
                  />
                  <span className="text-[10px] text-muted-foreground">até</span>
                  <input
                    type="date"
                    value={intervaloData.dataFim}
                    onChange={(event) =>
                      setIntervaloData({
                        ...intervaloData,
                        dataFim: event.target.value,
                      })
                    }
                    aria-label="Data fim do período"
                    className={cn(filterInputClass, 'px-2 py-1.5')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    carregando ||
                    !intervaloData.dataInicio.trim() ||
                    !intervaloData.dataFim.trim()
                  }
                  onClick={() => void recarregar()}
                  className="h-8 gap-1.5"
                >
                  {carregando ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Search className="size-3.5" aria-hidden />
                  )}
                  Buscar
                </Button>
              </div>

              {carregando ? (
                <div className="flex min-h-[240px] items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : notasFiscais.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-8 py-12 text-center">
                  <FilePlus
                    className="mb-3 size-10 text-muted-foreground/40"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-foreground">
                    Nenhuma NF disponível
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    Nenhuma NF de reentrega ou devolução total encontrada no
                    período selecionado. Ajuste as datas e busque novamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Filtrar por NF, cliente ou código cliente..."
                      aria-label="Filtrar notas fiscais"
                      className={cn(
                        filterInputClass,
                        'w-full py-2 pl-8 pr-3 placeholder:text-muted-foreground/50',
                      )}
                    />
                  </div>

                  {notasFiltradas.length === 0 ? (
                    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-6 py-8 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Nenhuma NF encontrada
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ajuste o filtro textual ou limpe a busca para ver as
                        NFs do período selecionado.
                      </p>
                      {busca.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setBusca('')}
                        >
                          Limpar filtro
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ul className="divide-y divide-outline-variant/60 overflow-hidden rounded-xl border border-outline-variant bg-card">
                      {notasFiltradas.map((nota) => {
                        const selecionado = selecionados.has(nota.id);

                        return (
                          <li key={nota.id}>
                            <label
                              className={cn(
                                'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                                selecionado && 'bg-primary/5',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selecionado}
                                onChange={() => toggleSelecionado(nota.id)}
                                className="mt-0.5 size-4 rounded border-outline-variant"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    NF {nota.numeroNf}
                                  </span>
                                  <span className="rounded-full bg-surface-highest px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {nota.tipo}
                                  </span>
                                </div>
                                <p className="mt-1 truncate text-sm text-foreground">
                                  {nota.cliente ?? 'Cliente não informado'}
                                  {nota.codCliente ? ` · ${nota.codCliente}` : ''}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {nota.motivo}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>{nota.quantidadeItens} item(ns)</span>
                                  <span>·</span>
                                  <span>{formatarPesoCompacto(nota.pesoTotal)}</span>
                                  {nota.transporteOrigemId && (
                                    <>
                                      <span>·</span>
                                      <span>
                                        Origem: {nota.transporteOrigemId}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {busca.trim() && notasFiltradas.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {notasFiltradas.length} de {notasFiscais.length} NF
                      {notasFiscais.length !== 1 ? 's' : ''} exibida
                      {notasFiltradas.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <SheetFooter className="shrink-0 gap-2 border-t border-outline-variant/60 bg-card px-6 py-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[120px]"
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => void vincularSelecionados()}
              disabled={vinculando || selecionados.size === 0 || !unidadeId}
              className="min-w-[160px] gap-2"
            >
              {vinculando && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Adicionar ao transporte
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
