import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Barcode, Loader2 } from 'lucide-react';

interface AdicionarProdutoSheetV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skuInput: string;
  onSkuInputChange: (value: string) => void;
  error: string | null;
  isValidating: boolean;
  onConferir: () => void;
}

export function AdicionarProdutoSheetV2({
  open,
  onOpenChange,
  skuInput,
  onSkuInputChange,
  error,
  isValidating,
  onConferir,
}: AdicionarProdutoSheetV2Props) {
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
            Informe o SKU da carga ou de um produto cadastrado no catálogo.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="sku-produto-v2">
              SKU / código do produto
            </label>
            <div className="relative">
              <Barcode className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
              <input
                id="sku-produto-v2"
                type="text"
                autoComplete="off"
                enterKeyHint="go"
                value={skuInput}
                onChange={(e) => onSkuInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConferir();
                  }
                }}
                placeholder="Ex: 600240283"
                className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright pl-12 pr-4 font-mono text-data-mono outline-none focus:border-secondary focus:ring-2 focus:ring-secondary"
              />
            </div>
            {error && <p className="text-label-sm text-destructive">{error}</p>}
          </div>

          <Button
            type="button"
            disabled={!skuInput.trim() || isValidating}
            onClick={onConferir}
            className="h-12 w-full rounded-lg bg-primary text-primary-foreground"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Conferindo...
              </>
            ) : (
              'Conferir'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
