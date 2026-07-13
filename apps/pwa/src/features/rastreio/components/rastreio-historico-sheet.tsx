import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import { RastreioTimeline } from '@/features/rastreio/components/rastreio-timeline';
import {
  resolveTimelineIndex,
  type RastreioStatus,
} from '@/features/rastreio/types/rastreio.schema';

interface RastreioHistoricoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: RastreioStatus;
}

export function RastreioHistoricoSheet({
  open,
  onOpenChange,
  status,
}: RastreioHistoricoSheetProps) {
  const timelineIndex = resolveTimelineIndex(status.situacao);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-3xl border-outline-variant/60 px-5 pb-8 pt-2"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant/80" />
        <SheetHeader className="mb-5 text-left">
          <SheetTitle className="text-headline-sm font-semibold text-on-background">
            Histórico do processo
          </SheetTitle>
          <SheetDescription className="text-sm text-on-surface-variant">
            Acompanhe cada etapa do recebimento da sua carga.
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto pr-1">
          <RastreioTimeline status={status} timelineIndex={timelineIndex} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
