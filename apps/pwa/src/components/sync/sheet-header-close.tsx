import { SheetClose } from '@lilog/ui';
import { X } from 'lucide-react';

export function SheetHeaderClose() {
  return (
    <SheetClose className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border-2 border-outline bg-surface-bright px-3 text-label-sm font-bold text-on-surface shadow-md opacity-100 ring-0 transition-colors hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2">
      <X className="h-5 w-5 shrink-0 stroke-[2.5]" aria-hidden />
      <span>Fechar</span>
    </SheetClose>
  );
}
