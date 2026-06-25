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
import { RiscoBadge } from '@/features/torre-controle-expedicao/components/risco-badge';
import type { DocaCelula } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type DocaDetalheSheetProps = {
  open: boolean;
  doca: DocaCelula | null;
  onOpenChange: (open: boolean) => void;
};

export function DocaDetalheSheet({
  open,
  doca,
  onOpenChange,
}: DocaDetalheSheetProps) {
  if (!doca) {
    return null;
  }

  const nivelRisco =
    doca.nivel === 'critico'
      ? 'critico'
      : doca.nivel === 'alto'
        ? 'alto'
        : doca.nivel === 'parcial'
          ? 'medio'
          : 'baixo';

  const handleMockAction = (action: string) => {
    toast.success(`${action} simulado`, {
      description: `Ação registrada para doca ${doca.label} (mock).`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="border-b border-outline-variant pb-4 text-left">
          <SheetTitle>Doca {doca.label}</SheetTitle>
          <SheetDescription>
            {doca.transportesAtivos} transportes ativos · fila de espera:{' '}
            {doca.filaEspera}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          <div className="flex flex-wrap items-center gap-3">
            <RiscoBadge nivel={nivelRisco} />
            <span className="text-caption text-muted-foreground">
              Tempo médio ocupação: {doca.tempoMedioOcupacaoMin} min
            </span>
          </div>

          <div>
            <p className="mb-2 text-caption font-medium text-muted-foreground">
              Veículos na doca
            </p>
            <div className="overflow-x-auto rounded-lg border border-outline-variant">
              <table className={compactTableClassName}>
                <thead>
                  <tr className={compactTableHeadRowClassName}>
                    <th className={compactTableHeadCellClassName()}>Transporte</th>
                    <th className={compactTableHeadCellClassName()}>Placa</th>
                    <th className={compactTableHeadCellClassName()}>Ocupação</th>
                  </tr>
                </thead>
                <tbody className={compactTableBodyClassName}>
                  {doca.transportes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-2 py-4 text-center text-xs text-muted-foreground"
                      >
                        Doca livre.
                      </td>
                    </tr>
                  ) : (
                    doca.transportes.map((t) => (
                      <tr
                        key={`${t.codigo}-${t.placa}`}
                        className={compactTableRowClassName}
                      >
                        <td className={compactTableCellClassName}>{t.codigo}</td>
                        <td className={compactTableCellClassName}>{t.placa}</td>
                        <td className={compactTableCellClassName}>
                          {t.tempoOcupacaoMin} min
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {doca.filaEspera > 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-caption">
              <p className="font-semibold text-destructive">
                Fila de espera: {doca.filaEspera} transportes
              </p>
              <p className="mt-1 text-muted-foreground">
                Congestionamento detectado — considere redistribuir docas adjacentes.
              </p>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row gap-2 border-t border-outline-variant pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => handleMockAction('Liberar doca')}
          >
            Liberar doca
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => handleMockAction('Redistribuir fila')}
          >
            Redistribuir fila
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
