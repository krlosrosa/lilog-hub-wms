'use client';

import { MapPin, PackageSearch } from 'lucide-react';

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
import { Pagination } from '@/features/filiais/components/pagination';

import { ItemArmazenagemStatusBadge } from './demanda-status-badge';
import type { ItemArmazenagemPainelRow } from '../hooks/use-armazenagem-painel';

const HEADERS = [
  { label: 'Demanda', className: 'w-[72px]' },
  { label: 'Receb.', className: 'w-[72px]' },
  { label: 'Palete', className: 'min-w-[88px] max-w-[110px]' },
  { label: 'SKU', className: 'min-w-[88px] max-w-[100px]' },
  { label: 'Produto', className: 'min-w-[120px] max-w-[180px]' },
  { label: 'Qtd', className: 'w-14 text-center' },
  { label: 'Status', className: 'w-[88px]' },
  { label: 'Endereço', className: 'min-w-[100px]' },
  { label: '', className: 'w-[88px]' },
] as const;

type ArmazenagemItensTableProps = {
  itens: ItemArmazenagemPainelRow[];
  pagina: number;
  totalPaginas: number;
  total: number;
  itemsInicio: number;
  pageSize: number;
  somenteLeitura?: boolean;
  onChangePagina: (pagina: number) => void;
  onSelecionarEndereco: (item: ItemArmazenagemPainelRow) => void;
};

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

export function ArmazenagemItensTable({
  itens,
  pagina,
  totalPaginas,
  total,
  itemsInicio,
  pageSize,
  somenteLeitura = false,
  onChangePagina,
  onSelecionarEndereco,
}: ArmazenagemItensTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant/70 bg-glass-bg shadow-sm backdrop-blur-glass">
      <div className="overflow-x-auto">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              {HEADERS.map((header) => (
                <th
                  key={header.label || 'actions'}
                  className={compactTableHeadCellClassName(header.className)}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={compactTableBodyClassName}>
            {itens.length === 0 ? (
              <tr>
                <td className={compactTableEmptyCellClassName} colSpan={HEADERS.length}>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <PackageSearch
                      className="size-8 text-muted-foreground/50"
                      aria-hidden
                    />
                    <span>Nenhum item encontrado.</span>
                  </div>
                </td>
              </tr>
            ) : (
              itens.map((item) => {
                const podeEditar =
                  !somenteLeitura &&
                  item.status !== 'armazenado' &&
                  item.demandaStatus !== 'concluida' &&
                  item.demandaStatus !== 'cancelada';

                return (
                  <tr key={item.id} className={compactTableRowClassName}>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'font-mono text-[10px] text-muted-foreground',
                      )}
                      title={item.demandaId}
                    >
                      {shortId(item.demandaId)}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'font-mono text-[10px] text-muted-foreground',
                      )}
                      title={item.recebimentoId}
                    >
                      {shortId(item.recebimentoId)}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'truncate font-mono font-medium',
                      )}
                      title={item.unitizadorCodigo ?? undefined}
                    >
                      {item.unitizadorCodigo ?? '—'}
                    </td>
                    <td
                      className={cn(
                        compactTableCellClassName,
                        'truncate font-mono font-medium',
                      )}
                      title={item.produtoSku ?? item.produtoId}
                    >
                      {item.produtoSku ?? shortId(item.produtoId)}
                    </td>
                    <td
                      className={cn(compactTableCellClassName, 'max-w-[180px] truncate')}
                      title={item.produtoNome}
                    >
                      {item.produtoNome ?? '—'}
                    </td>
                    <td className={cn(compactTableCellClassName, 'text-center tabular-nums')}>
                      {item.quantidade}
                      <span className="ml-0.5 text-[10px] text-muted-foreground">
                        {item.unidadeMedida}
                      </span>
                    </td>
                    <td className={compactTableCellClassName}>
                      <ItemArmazenagemStatusBadge status={item.status} />
                    </td>
                    <td className={compactTableCellClassName}>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-mono text-[11px]',
                          item.enderecoSugeridoLabel
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                        title={item.enderecoSugeridoLabel ?? 'Não definido'}
                      >
                        <MapPin className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">
                          {item.enderecoSugeridoLabel ?? '—'}
                        </span>
                      </span>
                    </td>
                    <td className={compactTableCellClassName}>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.enderecoSugeridoId ? 'outline' : 'default'}
                        className="h-7 px-2 text-[11px]"
                        disabled={!podeEditar}
                        onClick={() => onSelecionarEndereco(item)}
                      >
                        {item.enderecoSugeridoId ? 'Alterar' : 'Alocar'}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="border-t border-outline-variant/50 px-3 py-2">
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            totalFiltrados={total}
            itemsInicio={itemsInicio}
            pageSize={pageSize}
            onChangePagina={onChangePagina}
            resourceLabelPlural="itens"
          />
        </div>
      )}
    </section>
  );
}
