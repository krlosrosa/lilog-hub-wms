'use client';

import {
  AlertCircle,
  Bolt,
  Filter,
  History,
  Loader2,
  MapPin,
  Package,
  Pin,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/op-wms/components/op-wms-panel-classes';
import { PickingSuggestions } from '@/features/op-wms/components/picking-suggestions';
import { PrioritySelector } from '@/features/op-wms/components/priority-selector';
import { StockOriginTable } from '@/features/op-wms/components/stock-origin-table';
import { useRessuprimento } from '@/features/op-wms/hooks/use-ressuprimento';

const compactInputClassName =
  'rounded-lg border border-outline-variant bg-surface-low px-3 py-2 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function RessuprimentoView() {
  const {
    form,
    priority,
    setPriority,
    setSelectedOrigin,
    setDestination,
    stockOrigins,
    pickingSuggestions,
    estimatedMinutes,
    isSubmitting,
    onSubmit,
    dispatchMission,
  } = useRessuprimento();

  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const selectedOrigin = watch('selectedOriginAddress');
  const destination = watch('destinationAddress');

  return (
    <SidebarMain>
      <main className="relative min-h-dvh blueprint-grid">
        <div className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
          <div className="mx-auto max-w-container space-y-4">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <nav className="mb-1 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <Link href="/op-wms" className="hover:text-primary">
                    Operations
                  </Link>
                  <span aria-hidden>/</span>
                  <span className="truncate font-medium text-foreground">
                    Ressuprimento
                  </span>
                </nav>
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <AlertCircle className="h-4 w-4 shrink-0 fill-primary text-primary" aria-hidden />
                  <span className="text-caption font-bold uppercase tracking-wider text-primary">
                    Emergência
                  </span>
                  <h1 className="w-full text-headline-lg-mobile font-bold text-foreground md:text-headline-lg md:leading-tight">
                    Ressuprimento de Emergência
                  </h1>
                </div>
                <p className="mt-1 line-clamp-2 max-w-2xl text-body-md text-muted-foreground">
                  Ruptura crítica em picking — rota e ativo alocados automaticamente.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <span className="text-caption font-bold text-primary">OPERACIONAL</span>
              </div>
            </header>

            <form onSubmit={onSubmit} className="grid grid-cols-12 gap-3 md:gap-gutter">
              <div className="col-span-12 lg:col-span-8">
                <section className={cn(glassPanelClassName, 'p-4 md:p-5')}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-1.5 text-label-md font-bold text-primary">
                      <Package className="h-4 w-4" aria-hidden />
                      01. SKU e Origem
                    </h2>
                    <div className="flex gap-1.5">
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-caption">
                        <Filter className="mr-1 h-3 w-3" aria-hidden />
                        Lote
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-caption">
                        <History className="mr-1 h-3 w-3" aria-hidden />
                        Recentes
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label htmlFor="skuSearch" className={fieldLabelClassName}>
                        Produto
                      </label>
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
                          aria-hidden
                        />
                        <input
                          id="skuSearch"
                          type="text"
                          className={cn(
                            compactInputClassName,
                            'w-full border-primary/30 pl-9',
                          )}
                          {...register('skuSearch')}
                        />
                      </div>
                      {errors.skuSearch && (
                        <p className="text-caption text-destructive">
                          {errors.skuSearch.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className={fieldLabelClassName}>Estoque (Pulmão)</span>
                      <StockOriginTable
                        compact
                        origins={stockOrigins}
                        selectedAddress={selectedOrigin}
                        onSelect={setSelectedOrigin}
                      />
                      {errors.selectedOriginAddress && (
                        <p className="text-caption text-destructive">
                          {errors.selectedOriginAddress.message}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <div className="col-span-12 lg:col-span-4">
                <section className={cn(glassPanelClassName, 'flex flex-col p-4 md:p-5')}>
                  <h2 className="mb-3 flex items-center gap-1.5 text-label-md font-bold text-primary">
                    <MapPin className="h-4 w-4" aria-hidden />
                    02. Destino e Urgência
                  </h2>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="destinationAddress" className={fieldLabelClassName}>
                          Destino
                        </label>
                        <button
                          type="button"
                          className="flex shrink-0 items-center gap-1 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary hover:bg-primary/20"
                        >
                          <Sparkles className="h-3 w-3" aria-hidden />
                          AUTO
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          id="destinationAddress"
                          type="text"
                          placeholder="PK-04-122-B"
                          className={cn(compactInputClassName, 'w-full pr-9 font-semibold')}
                          {...register('destinationAddress')}
                        />
                        <Pin
                          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50"
                          aria-hidden
                        />
                      </div>
                      {errors.destinationAddress && (
                        <p className="text-caption text-destructive">
                          {errors.destinationAddress.message}
                        </p>
                      )}
                      <PickingSuggestions
                        compact
                        suggestions={pickingSuggestions}
                        selected={destination}
                        onSelect={setDestination}
                      />
                    </div>

                    <div className="space-y-1.5 border-t border-outline-variant/30 pt-3">
                      <span className={fieldLabelClassName}>Prioridade</span>
                      <PrioritySelector compact value={priority} onChange={setPriority} />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-outline-variant pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-caption font-bold text-muted-foreground">
                        Atalho
                      </span>
                      <kbd className="rounded border border-outline-variant bg-surface-variant px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                        Alt+Enter
                      </kbd>
                    </div>
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      size="sm"
                      className="flex h-10 w-full items-center justify-center gap-2 font-bold"
                      onClick={() => void dispatchMission()}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Bolt className="h-4 w-4 fill-primary" aria-hidden />
                      )}
                      Disparar missão
                    </Button>
                    <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground">
                      ~{estimatedMinutes} min estimados
                    </p>
                  </div>
                </section>
              </div>
            </form>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
