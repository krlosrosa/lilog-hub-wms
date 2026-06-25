import { cn } from '@lilog/ui';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

import { getVisiblePages } from '@/lib/pagination-utils';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type PaginationProps = {
  pagina: number;
  totalPaginas: number;
  onChangePagina: (pagina: number) => void;
  totalFiltrados: number;
  itemsInicio: number;
  pageSize: number;
  /** Ex.: `produtos`, `unidades`. */
  resourceLabelPlural?: string;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
  compact?: boolean;
};

export function Pagination({
  pagina,
  totalPaginas,
  onChangePagina,
  totalFiltrados,
  itemsInicio,
  pageSize,
  resourceLabelPlural = 'unidades',
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  compact = false,
}: PaginationProps) {
  const offset = itemsInicio;
  const inicio = totalFiltrados === 0 ? 0 : offset + 1;
  const itemsFim = Math.min(offset + pageSize, totalFiltrados);
  const visiblePages = getVisiblePages(pagina, totalPaginas);

  const navButtonClass =
    'inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-outline-variant text-muted-foreground transition-colors hover:bg-surface-highest hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

  const pageButtonClass = (active: boolean) =>
    cn(
      'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-medium transition-colors',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'border border-outline-variant text-muted-foreground hover:bg-surface-highest hover:text-foreground',
    );

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-outline-variant sm:flex-row sm:items-center sm:justify-between',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {totalFiltrados === 0 ? (
            <>Nenhum {resourceLabelPlural.slice(0, -1) || 'item'}</>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {inicio}–{itemsFim}
              </span>{' '}
              de{' '}
              <span className="font-medium text-foreground">{totalFiltrados}</span>{' '}
              {resourceLabelPlural}
            </>
          )}
        </span>

        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-1.5">
            <span className="hidden sm:inline">Por página</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Itens por página"
              className="h-7 rounded-md border border-outline-variant bg-surface-low px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {totalPaginas > 1 ? (
        <>
          <nav
            className="hidden items-center gap-1 sm:flex"
            aria-label="Paginação"
          >
            <button
              type="button"
              onClick={() => onChangePagina(1)}
              disabled={pagina <= 1}
              aria-label="Primeira página"
              className={navButtonClass}
            >
              <ChevronFirst className="size-3.5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => onChangePagina(pagina - 1)}
              disabled={pagina <= 1}
              aria-label="Página anterior"
              className={navButtonClass}
            >
              <ChevronLeft className="size-3.5" aria-hidden />
            </button>

            {visiblePages.map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex size-7 items-center justify-center text-muted-foreground"
                  aria-hidden
                >
                  <MoreHorizontal className="size-3.5" />
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onChangePagina(item)}
                  aria-label={`Ir para página ${item}`}
                  aria-current={item === pagina ? 'page' : undefined}
                  className={pageButtonClass(item === pagina)}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => onChangePagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              aria-label="Próxima página"
              className={navButtonClass}
            >
              <ChevronRight className="size-3.5" aria-hidden />
            </button>

            <button
              type="button"
              onClick={() => onChangePagina(totalPaginas)}
              disabled={pagina >= totalPaginas}
              aria-label="Última página"
              className={navButtonClass}
            >
              <ChevronLast className="size-3.5" aria-hidden />
            </button>
          </nav>

          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => onChangePagina(pagina - 1)}
              disabled={pagina <= 1}
              aria-label="Página anterior"
              className={cn(navButtonClass, 'size-8')}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>

            <span className="text-xs text-muted-foreground">
              Página{' '}
              <span className="font-medium text-foreground">{pagina}</span> de{' '}
              <span className="font-medium text-foreground">{totalPaginas}</span>
            </span>

            <button
              type="button"
              onClick={() => onChangePagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              aria-label="Próxima página"
              className={cn(navButtonClass, 'size-8')}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
