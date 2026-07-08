import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from '@lilog/ui';
import {
  AlertCircle,
  Loader2,
  MapPin,
  Package,
  PackageSearch,
  RefreshCw,
} from 'lucide-react';
import { useCallback } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { useItensArmazenagemAbertos } from '../hooks/use-itens-armazenagem-abertos';
import type { ArmazenagemItemAberto } from '../hooks/use-itens-armazenagem-abertos';

interface ArmazenagemDemandasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABEL: Record<ArmazenagemItemAberto['status'], string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  divergente: 'Divergente',
};

function ItemAbertoSheetRow({ item }: { item: ArmazenagemItemAberto }) {
  return (
    <article
      className={cn(
        'rounded-lg border border-outline-variant bg-surface-bright p-3',
        item.priority === 'urgente' && 'border-l-[3px] border-l-destructive',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container">
          <Package className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-mono text-label-md font-bold text-primary">
              {item.codigo}
            </p>
            <span
              className={cn(
                'shrink-0 rounded-md px-1.5 py-px text-[10px] font-semibold uppercase',
                item.priority === 'urgente'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-surface-container-high text-on-surface-variant',
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </div>
          <p className="truncate text-body-sm text-on-surface">{item.produtoNome}</p>
          {item.produtoSku && item.produtoSku !== item.codigo && (
            <p className="truncate font-mono text-[11px] text-on-surface-variant">
              SKU {item.produtoSku}
            </p>
          )}
          <p className="flex items-center gap-1 truncate text-body-sm text-on-surface-variant">
            <MapPin className="h-3 w-3 shrink-0 text-secondary" aria-hidden />
            <span className="truncate">{item.enderecoSugerido}</span>
          </p>
          <p className="text-[10px] text-on-surface-variant">
            Demanda {item.demandaRef}
            {item.sequencia > 0 ? ` · Palete ${item.sequencia}` : ''}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ArmazenagemDemandasSheet({
  open,
  onOpenChange,
}: ArmazenagemDemandasSheetProps) {
  const { itens, isLoading, isRefreshing, error, isEmpty, refresh } =
    useItensArmazenagemAbertos(open);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const urgentes = itens.filter((item) => item.priority === 'urgente').length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[85vh] flex-col rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="shrink-0 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-headline-md text-on-surface">
                Itens em aberto
              </SheetTitle>
              <SheetDescription className="text-body-sm text-on-surface-variant">
                {isLoading
                  ? 'Carregando...'
                  : `${itens.length} palete${itens.length === 1 ? '' : 's'} pendente${itens.length === 1 ? '' : 's'} de armazenagem`}
              </SheetDescription>
            </div>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefresh}
              aria-label="Atualizar itens"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation active:scale-90 disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </SheetHeader>

        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg bg-surface-container"
              />
            ))
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
              <p className="text-body-sm text-on-surface-variant">{error}</p>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
              <p className="text-body-md font-medium text-on-surface">
                Nenhum item em aberto
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Bipe a etiqueta do palete para iniciar a armazenagem.
              </p>
            </div>
          ) : (
            itens.map((item) => <ItemAbertoSheetRow key={item.id} item={item} />)
          )}
        </div>

        {!isLoading && !isEmpty && urgentes > 0 && (
          <p className="shrink-0 pt-2 text-center text-[11px] text-on-surface-variant">
            {urgentes} item{urgentes === 1 ? '' : 's'} urgente{urgentes === 1 ? '' : 's'} ·
            continue bipando os paletes
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
