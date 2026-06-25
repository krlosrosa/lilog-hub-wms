import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Barcode, CheckCircle, Loader2, Package, Plus } from 'lucide-react';

import type { SkuConferenciaPreview } from '../lib/resolve-sku-conferencia';

interface AdicionarProdutoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuInput: string;
  onSkuInputChange: (value: string) => void;
  preview: SkuConferenciaPreview | null;
  error: string | null;
  isValidating: boolean;
  onValidate: () => void;
}

export function AdicionarProdutoSheet({
  open,
  onOpenChange,
  skuInput,
  onSkuInputChange,
  preview,
  error,
  isValidating,
  onValidate,
}: AdicionarProdutoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-outline-variant bg-surface px-margin-mobile pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-lg bg-outline-variant" aria-hidden />

        <SheetHeader className="text-left">
          <SheetTitle className="text-headline-md text-on-surface">Informar produto</SheetTitle>
          <SheetDescription className="text-body-sm text-on-surface-variant">
            Informe o SKU da carga ou de um item novo que ainda não está listado.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="sku-produto">
              SKU / código do produto
            </label>
            <div className="relative">
              <Barcode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
              <input
                id="sku-produto"
                type="text"
                autoComplete="off"
                enterKeyHint="search"
                value={skuInput}
                onChange={(e) => onSkuInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onValidate();
                  }
                }}
                placeholder="Ex: SKU-99012 ou NOVO-001"
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-4 font-mono text-data-mono outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>
            {error && <p className="text-label-sm text-destructive">{error}</p>}
          </div>

          {preview && !error && preview.source === 'carga' && (
            <div className="flex gap-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <Package className="h-6 w-6 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-label-md font-bold text-primary">{preview.item.sku}</p>
                <p className="line-clamp-2 text-body-sm text-on-surface-variant">
                  {preview.item.name}
                </p>
                <p className="mt-1 text-label-sm text-secondary">Item da carga</p>
              </div>
              <CheckCircle className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
            </div>
          )}

          {preview && !error && preview.source === 'novo' && (
            <div className="flex gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-label-md font-bold text-primary">{preview.sku}</p>
                <p className="text-body-sm text-on-surface-variant">
                  Item novo fora da lista da carga
                </p>
                <p className="mt-1 text-label-sm text-on-surface-variant">
                  Será conferido como entrada avulsa
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              disabled={!skuInput.trim() || isValidating}
              onClick={onValidate}
              className="h-12 w-full rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validando...
                </>
              ) : (
                'Validar e conferir'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full rounded-lg"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
