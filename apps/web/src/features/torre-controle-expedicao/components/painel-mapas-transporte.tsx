'use client';

import { useMemo, useState } from 'react';

import { ChevronDown, ChevronRight, Eye, Package, Truck } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import { EtapaStatusBadge } from '@/features/torre-controle-expedicao/components/etapa-status-badge';
import { ProcessoStatusBadge } from '@/features/torre-controle-expedicao/components/processo-status-badge';
import { formatarDuracaoSegundos } from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import type { MapaResumo } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

type GrupoTransporteMapas = {
  transporteId: string;
  transporteCodigo: string;
  mapas: MapaResumo[];
  concluidos: number;
  total: number;
};

function agruparMapasPorTransporte(mapas: MapaResumo[]): GrupoTransporteMapas[] {
  const grupos = new Map<string, GrupoTransporteMapas>();

  for (const mapa of mapas) {
    const existente = grupos.get(mapa.transporteId);

    if (existente) {
      existente.mapas.push(mapa);
      existente.total += 1;
      if (mapa.status === 'concluido') {
        existente.concluidos += 1;
      }
      continue;
    }

    grupos.set(mapa.transporteId, {
      transporteId: mapa.transporteId,
      transporteCodigo: mapa.transporteCodigo,
      mapas: [mapa],
      concluidos: mapa.status === 'concluido' ? 1 : 0,
      total: 1,
    });
  }

  return Array.from(grupos.values()).sort((a, b) =>
    a.transporteCodigo.localeCompare(b.transporteCodigo, 'pt-BR'),
  );
}

export type PainelMapasTransporteProps = {
  mapas: MapaResumo[];
  onVerTransporte: (transporteId: string) => void;
  className?: string;
};

export function PainelMapasTransporte({
  mapas,
  onVerTransporte,
  className,
}: PainelMapasTransporteProps) {
  const grupos = useMemo(() => agruparMapasPorTransporte(mapas), [mapas]);
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set());

  const toggleGrupo = (transporteId: string) => {
    setExpandidos((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(transporteId)) {
        proximo.delete(transporteId);
      } else {
        proximo.add(transporteId);
      }

      return proximo;
    });
  };

  const expandirTodos = () => {
    setExpandidos(new Set(grupos.map((grupo) => grupo.transporteId)));
  };

  const recolherTodos = () => {
    setExpandidos(new Set());
  };

  return (
    <section
      id="painel-mapas-transporte"
      className={cn(glassPanelClassName, 'overflow-hidden rounded-xl', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-low/30 px-4 py-3">
        <div>
          <h2 className="text-label-md font-semibold text-foreground">
            Mapas por transporte
          </h2>
          <p className="text-caption text-muted-foreground">
            {mapas.length} mapas em {grupos.length} transportes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={expandirTodos}>
            Expandir todos
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={recolherTodos}>
            Recolher todos
          </Button>
        </div>
      </div>

      {grupos.length === 0 ? (
        <div className="px-4 py-10 text-center text-caption text-muted-foreground">
          Nenhum mapa disponível para os filtros atuais.
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/60">
          {grupos.map((grupo) => {
            const expandido = expandidos.has(grupo.transporteId);
            const progresso =
              grupo.total > 0
                ? Math.round((grupo.concluidos / grupo.total) * 100)
                : 0;

            return (
              <div key={grupo.transporteId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
                  onClick={() => toggleGrupo(grupo.transporteId)}
                  aria-expanded={expandido}
                >
                  {expandido ? (
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-high">
                    <Truck className="size-4 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {grupo.transporteCodigo}
                      </span>
                      <span className="text-caption text-muted-foreground">
                        {grupo.concluidos}/{grupo.total} mapas
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          progresso === 100 ? 'bg-primary' : 'bg-primary/70',
                        )}
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      onVerTransporte(grupo.transporteId);
                    }}
                  >
                    <Eye className="size-3.5" aria-hidden />
                    Ver transporte
                  </Button>
                </button>

                {expandido ? (
                  <div className="border-t border-outline-variant/40 bg-surface-low/20 px-4 pb-4">
                    <div className="overflow-x-auto rounded-lg border border-outline-variant">
                      <table className={compactTableClassName}>
                        <thead>
                          <tr className={compactTableHeadRowClassName}>
                            <th className={compactTableHeadCellClassName()}>Mapa</th>
                            <th className={compactTableHeadCellClassName()}>Etapa</th>
                            <th className={compactTableHeadCellClassName()}>Status</th>
                            <th className={compactTableHeadCellClassName()}>Operador</th>
                            <th className={compactTableHeadCellClassName()}>Tempo parado</th>
                          </tr>
                        </thead>
                        <tbody className={compactTableBodyClassName}>
                          {grupo.mapas.map((mapa) => (
                            <tr
                              key={mapa.id}
                              className={cn(
                                compactTableRowClassName,
                                mapa.prioridade && 'bg-destructive/[0.03]',
                              )}
                            >
                              <td className={compactTableCellClassName}>
                                <div className="flex items-center gap-1.5">
                                  <Package
                                    className="size-3.5 shrink-0 text-muted-foreground"
                                    aria-hidden
                                  />
                                  <span className="font-mono font-semibold">
                                    {mapa.codigo}
                                  </span>
                                  {mapa.prioridade ? (
                                    <span className="rounded bg-destructive/10 px-1 py-px text-[8px] font-bold uppercase text-destructive">
                                      P
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className={compactTableCellClassName}>
                                <EtapaStatusBadge etapa={mapa.etapa} />
                              </td>
                              <td className={compactTableCellClassName}>
                                <ProcessoStatusBadge
                                  status={mapa.status}
                                  horario={{
                                    inicio: mapa.horarioInicio,
                                    fim: mapa.horarioFim,
                                  }}
                                />
                              </td>
                              <td className={compactTableCellClassName}>
                                {mapa.operador ?? '—'}
                              </td>
                              <td className={compactTableCellClassName}>
                                {mapa.status !== 'concluido'
                                  ? formatarDuracaoSegundos(
                                      mapa.tempoParadoSeg ?? mapa.tempoParadoMin * 60,
                                    )
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
