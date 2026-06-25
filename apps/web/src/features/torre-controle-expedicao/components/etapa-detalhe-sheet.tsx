'use client';

import { toast } from 'sonner';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import type {
  EtapaPipeline,
  MapaResumo,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { formatarDuracaoSegundos } from '@/features/torre-controle-expedicao/lib/formatar-tempo';

export type EtapaDetalheSheetProps = {
  open: boolean;
  etapa: EtapaPipeline | null;
  mapas: MapaResumo[];
  onOpenChange: (open: boolean) => void;
};

export function EtapaDetalheSheet({
  open,
  etapa,
  mapas,
  onOpenChange,
}: EtapaDetalheSheetProps) {
  if (!etapa) {
    return null;
  }

  const handleMockAction = () => {
    toast.success('Realocação de operadores simulada', {
      description: `Sugestão enviada para ${etapa.label} (mock).`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="border-b border-outline-variant pb-4 text-left">
          <SheetTitle>{etapa.label}</SheetTitle>
          <SheetDescription>
            {etapa.qtdMapas} mapas na fila · tempo médio parado{' '}
            {etapa.tempoMedioParadoMin} min
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          <div className="grid grid-cols-2 gap-3 text-caption">
            <div>
              <p className="text-muted-foreground">Volume acumulado</p>
              <p className="font-semibold tabular-nums">
                {etapa.volumeAcumuladoPaletes} paletes
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Saturação</p>
              <p className="font-semibold tabular-nums">{etapa.saturacaoPercent}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Capacidade/h</p>
              <p className="font-semibold tabular-nums">{etapa.capacidadeHora}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gargalo</p>
              <p className="font-semibold">
                {etapa.isGargalo ? 'Sim' : 'Não'}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-medium text-muted-foreground">
              Mapas na fila
            </p>
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    <th className={compactTableHeadCellClassName()}>Mapa</th>
                    <th className={compactTableHeadCellClassName()}>Transporte</th>
                    <th className={compactTableHeadCellClassName()}>Parado</th>
                    <th className={compactTableHeadCellClassName()}>Operador</th>
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {mapas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-4 text-center text-xs text-muted-foreground"
                      >
                        Nenhum mapa nesta etapa (mock).
                      </td>
                    </tr>
                  ) : (
                    mapas.map((mapa) => (
                      <tr key={mapa.id} className={compactTableRowClassName}>
                        <td className={compactTableCellClassName}>
                          <div className="flex items-center gap-1">
                            {mapa.codigo}
                            {mapa.prioridade ? (
                              <span className="text-[8px] font-bold text-destructive">
                                P
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className={compactTableCellClassName}>
                          {mapa.transporteCodigo}
                        </td>
                        <td className={compactTableCellClassName}>
                          {formatarDuracaoSegundos(
                            mapa.tempoParadoSeg ?? mapa.tempoParadoMin * 60,
                          )}
                        </td>
                        <td className={compactTableCellClassName}>
                          {mapa.operador ?? '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-low p-3 text-caption">
            <p className="font-medium text-foreground">Operadores alocados (mock)</p>
            <p className="mt-1 text-muted-foreground">
              Capacidade estimada: {etapa.capacidadeHora} mapas/h com equipe atual.
            </p>
          </div>
        </div>

        <SheetFooter className="border-t border-outline-variant pt-4">
          <Button type="button" className="w-full" onClick={handleMockAction}>
            Sugerir realocação de operadores
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
