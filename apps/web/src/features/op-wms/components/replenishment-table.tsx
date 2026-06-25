'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import type { ReplenishmentItem } from '@/features/op-wms/types/op-wms.schema';

type ReplenishmentTableProps = {
  items: ReplenishmentItem[];
  filteredCount: number;
  totalRecords: number;
  page: number;
  totalPages: number;
  generatingIds: Set<string>;
  onGenerateMission: (itemId: string) => void;
  onViewPulmao: (itemId: string) => void;
  onPageChange: (page: number) => void;
};

function StatusIcon({ status }: { status: ReplenishmentItem['status'] }) {
  switch (status) {
    case 'critical':
      return (
        <AlertCircle
          className="h-5 w-5 fill-destructive text-destructive"
          aria-label="Ruptura crítica"
        />
      );
    case 'warning':
      return (
        <AlertTriangle
          className="h-5 w-5 fill-amber-500 text-amber-500"
          aria-label="Abaixo do mínimo"
        />
      );
    case 'in_mission':
      return (
        <RefreshCw
          className="h-5 w-5 text-primary"
          aria-label="Missão em andamento"
        />
      );
    default:
      return (
        <CheckCircle2
          className="h-5 w-5 text-muted-foreground"
          aria-label="Nível adequado"
        />
      );
  }
}

function occupancyBarClass(status: ReplenishmentItem['status']) {
  switch (status) {
    case 'critical':
      return 'bg-destructive';
    case 'warning':
    case 'in_mission':
      return 'bg-amber-500';
    default:
      return 'bg-outline';
  }
}

function occupancyTextClass(status: ReplenishmentItem['status']) {
  switch (status) {
    case 'critical':
      return 'text-destructive';
    case 'warning':
    case 'in_mission':
      return 'text-amber-500';
    default:
      return 'text-muted-foreground';
  }
}

function balanceClass(status: ReplenishmentItem['status']) {
  switch (status) {
    case 'critical':
      return 'font-bold text-destructive';
    case 'warning':
    case 'in_mission':
      return 'text-amber-500';
    default:
      return 'text-foreground';
  }
}

export function ReplenishmentTable({
  items,
  filteredCount,
  totalRecords,
  page,
  totalPages,
  generatingIds,
  onGenerateMission,
  onViewPulmao,
  onPageChange,
}: ReplenishmentTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-lowest uppercase text-muted-foreground">
              <th className="w-12 px-4 py-2 text-caption font-medium">St</th>
              <th className="px-4 py-2 text-caption font-medium">Endereço</th>
              <th className="px-4 py-2 text-caption font-medium">Produto / SKU</th>
              <th className="px-4 py-2 text-right text-caption font-medium">Saldo</th>
              <th className="px-4 py-2 text-right text-caption font-medium">Mínimo</th>
              <th className="px-4 py-2 text-right text-caption font-medium">Máximo</th>
              <th className="px-4 py-2 text-caption font-medium">Ocupação</th>
              <th className="px-4 py-2 text-right text-caption font-medium">Pend.</th>
              <th className="px-4 py-2 text-right text-caption font-medium">Sugerido</th>
              <th className="px-4 py-2 text-center text-caption font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-body-md text-muted-foreground"
                >
                  Nenhum registro encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isGenerating = generatingIds.has(item.id);

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'transition-colors hover:bg-surface-bright/50',
                      item.status === 'in_mission' && 'opacity-80',
                    )}
                  >
                    <td className="px-4 py-2">
                      <StatusIcon status={item.status} />
                    </td>
                    <td className="px-4 py-2 font-mono text-[10px] text-foreground">
                      {item.address}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="whitespace-nowrap text-caption font-medium text-foreground">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {item.sku}
                        </span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2 text-right font-mono text-[10px]',
                        balanceClass(item.status),
                      )}
                    >
                      {item.balance}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[10px] text-foreground">
                      {item.min}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[10px] text-foreground">
                      {item.max}
                    </td>
                    <td className="px-4 py-2">
                      <div className="h-1.5 w-full overflow-hidden rounded bg-surface-highest">
                        <div
                          className={cn('h-full', occupancyBarClass(item.status))}
                          style={{ width: `${item.occupancyPercent}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'font-mono text-[10px]',
                          occupancyTextClass(item.status),
                        )}
                      >
                        {item.occupancyPercent}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[10px] text-foreground">
                      {item.pending}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2 text-right font-mono text-[10px]',
                        item.suggestedLabel
                          ? 'italic text-primary'
                          : item.suggested > 0
                            ? 'font-bold text-primary'
                            : 'text-muted-foreground',
                      )}
                    >
                      {item.suggestedLabel ?? (item.suggested > 0 ? `+${item.suggested}` : '+0')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-2">
                        {item.status === 'in_mission' && item.missionId ? (
                          <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">
                            Missão #{item.missionId}
                          </span>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!item.canGenerateMission || isGenerating}
                              className="h-7 px-2 text-caption"
                              onClick={() => void onGenerateMission(item.id)}
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" aria-hidden />
                                  Enviando...
                                </>
                              ) : (
                                'Gerar Missão'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-caption"
                              onClick={() => onViewPulmao(item.id)}
                            >
                              Ver Pulmão
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant bg-surface-low p-3 text-caption">
        <div className="text-muted-foreground">
          Exibindo {items.length} de {filteredCount.toLocaleString('pt-BR')} filtrados (
          {totalRecords.toLocaleString('pt-BR')} registros)
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="Primeira página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground">{page}</span>
          {page < totalPages && (
            <span className="px-2 py-0.5 text-muted-foreground">{page + 1}</span>
          )}
          {page + 1 < totalPages && (
            <span className="px-2 py-0.5 text-muted-foreground">{page + 2}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
