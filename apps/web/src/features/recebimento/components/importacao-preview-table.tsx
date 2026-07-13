'use client';

import { useCallback, useMemo, useState } from 'react';

import { Button, cn } from '@lilog/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { useDisplayConfig } from '@/features/config-operacional/hooks/use-display-config';
import type { RecebimentoXlsxDemanda } from '@/features/recebimento/lib/parse-recebimento-xlsx';
import { itemProdutoSemCadastro } from '@/features/recebimento/lib/validar-produtos-importacao';
import type { ItemPreRecebimentoFormValues } from '@/features/recebimento/types/recebimento-cadastro.schema';

const formatoInt = new Intl.NumberFormat('pt-BR');

type ImportacaoPreviewTableProps = {
  demandas: RecebimentoXlsxDemanda[];
  produtosSemCadastro?: readonly string[];
  onEditarDemanda?: (demanda: RecebimentoXlsxDemanda) => void;
};

function demandaKey(demanda: RecebimentoXlsxDemanda, index: number): string {
  return (
    demanda.cabecalho.numeroOcr ??
    demanda.cabecalho.placa ??
    demanda.cabecalho.numeroTransporte ??
    `demanda-${index}`
  );
}

function formatHorarioPrevisto(value?: string): string {
  if (!value) {
    return '—';
  }

  return value.replace('T', ' · ');
}

function formatValidade(value?: string): string {
  if (!value) {
    return '—';
  }

  return value.replace('T', ' · ');
}

function produtoLabel(item: ItemPreRecebimentoFormValues): string {
  return item.produtoLabel?.trim() || item.produtoId?.trim() || '—';
}

export function ImportacaoPreviewTable({
  demandas,
  produtosSemCadastro = [],
  onEditarDemanda,
}: ImportacaoPreviewTableProps) {
  const { formatQtdValue } = useDisplayConfig();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const produtosSemCadastroSet = useMemo(
    () => new Set(produtosSemCadastro),
    [produtosSemCadastro],
  );

  const allKeys = useMemo(
    () => demandas.map((demanda, index) => demandaKey(demanda, index)),
    [demandas],
  );

  const toggleRow = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedKeys(new Set(allKeys));
  }, [allKeys]);

  const collapseAll = useCallback(() => {
    setExpandedKeys(new Set());
  }, []);

  const allExpanded = expandedKeys.size === demandas.length && demandas.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Clique na linha para ver os itens de cada OCR
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? 'Recolher todos' : 'Expandir todos'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-outline-variant/80">
        <div className="overflow-x-auto">
          <table className={compactTableClassName}>
            <thead>
              <tr className={compactTableHeadRowClassName}>
                <th className={compactTableHeadCellClassName('w-7')} scope="col">
                  <span className="sr-only">Expandir</span>
                </th>
                <th className={compactTableHeadCellClassName('min-w-[5rem]')} scope="col">
                  OCR
                </th>
                <th className={compactTableHeadCellClassName()} scope="col">
                  Placa
                </th>
                <th className={compactTableHeadCellClassName('hidden sm:table-cell')} scope="col">
                  Transportadora
                </th>
                <th className={compactTableHeadCellClassName('hidden md:table-cell')} scope="col">
                  Chegada
                </th>
                <th className={compactTableHeadCellClassName('w-12 text-right')} scope="col">
                  Itens
                </th>
                {onEditarDemanda ? (
                  <th className={compactTableHeadCellClassName('w-16 text-right')} scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className={compactTableBodyClassName}>
              {demandas.flatMap((demanda, index) => {
                const key = demandaKey(demanda, index);
                const isExpanded = expandedKeys.has(key);
                const { cabecalho, itens } = demanda;
                const possuiItemSemCadastro = itens.some((item) =>
                  itemProdutoSemCadastro(item, produtosSemCadastroSet),
                );

                const mainRow = (
                  <tr
                    key={key}
                    className={cn(
                      compactTableRowClassName,
                      'cursor-pointer',
                      isExpanded && 'bg-muted/30',
                      possuiItemSemCadastro && 'border-l-2 border-l-destructive/60',
                    )}
                    onClick={() => toggleRow(key)}
                    aria-expanded={isExpanded}
                  >
                    <td className={compactTableCellClassName}>
                      {isExpanded ? (
                        <ChevronDown className="size-3.5 text-primary" aria-hidden />
                      ) : (
                        <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
                      )}
                    </td>
                    <td className={`${compactTableCellClassName} font-medium`}>
                      <span className="inline-flex items-center gap-1.5">
                        {cabecalho.numeroOcr ?? '—'}
                        {possuiItemSemCadastro ? (
                          <span className="rounded bg-destructive/10 px-1 py-0 text-[9px] font-semibold uppercase text-destructive">
                            Pendente
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className={`${compactTableCellClassName} whitespace-nowrap`}>
                      {cabecalho.placa ?? '—'}
                    </td>
                    <td
                      className={`${compactTableCellClassName} hidden max-w-[8rem] truncate sm:table-cell`}
                      title={cabecalho.transportadoraNome}
                    >
                      {cabecalho.transportadoraNome ?? '—'}
                    </td>
                    <td
                      className={`${compactTableCellClassName} hidden whitespace-nowrap text-muted-foreground md:table-cell`}
                    >
                      {formatHorarioPrevisto(cabecalho.horarioPrevisto)}
                    </td>
                    <td className={`${compactTableCellClassName} text-right tabular-nums`}>
                      {formatoInt.format(itens.length)}
                    </td>
                    {onEditarDemanda ? (
                      <td className={`${compactTableCellClassName} text-right`}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[11px] text-primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditarDemanda(demanda);
                          }}
                        >
                          Editar
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                );

                if (!isExpanded) {
                  return [mainRow];
                }

                const detailRow = (
                  <tr key={`${key}-detail`} className="bg-muted/10">
                    <td colSpan={onEditarDemanda ? 7 : 6} className="p-0">
                      <div className="border-t border-outline-variant/40 px-2 py-2 pl-8">
                        {itens.length === 0 ? (
                          <p className="py-2 text-[11px] text-muted-foreground">
                            Nenhum item nesta demanda.
                          </p>
                        ) : (
                          <table className="w-full text-left text-[11px]">
                            <thead>
                              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                <th className="px-2 py-1 font-semibold">Produto</th>
                                <th className="px-2 py-1 text-right font-semibold">Qtd.</th>
                                <th className="px-2 py-1 font-semibold">Un.</th>
                                <th className="hidden px-2 py-1 font-semibold sm:table-cell">
                                  Lote
                                </th>
                                <th className="hidden px-2 py-1 text-right font-semibold md:table-cell">
                                  Peso
                                </th>
                                <th className="hidden px-2 py-1 font-semibold lg:table-cell">
                                  Validade
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/30">
                              {itens.map((item, itemIndex) => {
                                const semCadastro = itemProdutoSemCadastro(
                                  item,
                                  produtosSemCadastroSet,
                                );

                                return (
                                <tr
                                  key={`${key}-item-${itemIndex}`}
                                  className={cn(
                                    'text-foreground',
                                    semCadastro && 'bg-destructive/5',
                                  )}
                                >
                                  <td
                                    className={cn(
                                      'max-w-[12rem] truncate px-2 py-1.5 font-medium',
                                      semCadastro && 'text-destructive',
                                    )}
                                    title={produtoLabel(item)}
                                  >
                                    {produtoLabel(item)}
                                    {semCadastro ? (
                                      <span className="mt-0.5 block text-[9px] font-normal uppercase text-destructive/80">
                                        Sem cadastro
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="px-2 py-1.5 text-right tabular-nums">
                                    {formatQtdValue(
                                      item.quantidadeEsperada,
                                      item.unidadeMedida,
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5 text-muted-foreground">
                                    {item.unidadeMedida}
                                  </td>
                                  <td className="hidden px-2 py-1.5 sm:table-cell">
                                    {item.loteEsperado?.trim() || '—'}
                                  </td>
                                  <td className="hidden px-2 py-1.5 text-right tabular-nums md:table-cell">
                                    {item.pesoEsperado?.trim() || '—'}
                                  </td>
                                  <td className="hidden px-2 py-1.5 text-muted-foreground lg:table-cell">
                                    {formatValidade(item.validadeEsperada)}
                                  </td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                );

                return [mainRow, detailRow];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
