'use client';

import { CheckCircle2, Circle, Pencil, Tag } from 'lucide-react';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import type { WarehousePosition } from '@/features/layout-cd/types/layout-cd.schema';

type InspectorLevel = {
  level: number;
  occupied: boolean;
  palletId: string | null;
  weightLabel: string;
};

type AssetInspectorSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: WarehousePosition | null;
  levels: InspectorLevel[];
  onModify: () => void;
  onGenerateLabel: () => void;
};

export function AssetInspectorSheet({
  open,
  onOpenChange,
  position,
  levels,
  onModify,
  onGenerateLabel,
}: AssetInspectorSheetProps) {
  const isDriveIn = position?.type === 'drive-in';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-[360px] flex-col gap-0 p-0 sm:max-w-[360px]"
      >
        <SheetHeader className="border-b border-outline-variant bg-surface-high px-6 py-6 text-left">
          <SheetTitle className="text-primary">Asset Properties</SheetTitle>
        </SheetHeader>

        {position ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="rounded border border-outline-variant bg-surface-low p-4">
                <label className="mb-1 block font-mono text-xs uppercase text-muted-foreground">
                  {position.typeLabel}
                </label>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isDriveIn ? 'text-secondary' : 'text-primary',
                  )}
                >
                  {position.displayCode ?? position.posId}
                </div>
                {position.label ? (
                  <p className="mt-1 text-sm text-muted-foreground">{position.label}</p>
                ) : null}
                <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                  {position.posId}
                </p>
              </div>

              <div className="space-y-3">
                <label className="font-mono text-xs uppercase text-muted-foreground">
                  Vertical Occupancy
                </label>
                <div className="space-y-2">
                  {levels.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="flex items-center justify-between rounded border border-outline-variant bg-surface-highest p-3 transition-colors hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center border border-outline-variant bg-background text-xs font-bold">
                          N{lvl.level}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {lvl.occupied ? lvl.palletId : 'Vago'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {lvl.weightLabel}
                          </p>
                        </div>
                      </div>
                      {lvl.occupied ? (
                        <CheckCircle2 className="h-4 w-4 text-status-active" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/20" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase text-muted-foreground">
                  Technical Specs
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <SpecCard
                    label="Max Load"
                    value={`${position.maxLoadKg.toLocaleString('pt-BR')} kg`}
                  />
                  <SpecCard
                    label="Clearance"
                    value={`${position.clearanceMm} mm`}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-high p-4">
                <p className="mb-3 font-mono text-xs uppercase text-muted-foreground">
                  Recent Operations
                </p>
                <div className="space-y-3 text-[11px]">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'w-1 shrink-0',
                        isDriveIn ? 'bg-secondary' : 'bg-primary',
                      )}
                    />
                    <div>
                      <p className="font-bold text-foreground">Inbound Transfer</p>
                      <p className="text-muted-foreground">
                        12 mins ago • User: A. Costa
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 shrink-0 bg-outline-variant" />
                    <div>
                      <p className="font-bold text-foreground">Maintenance Check</p>
                      <p className="text-muted-foreground">Yesterday • Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="shrink-0 gap-2 border-t border-outline-variant bg-surface-high p-6 sm:flex-col">
              <Button className="w-full gap-2" onClick={onModify}>
                <Pencil className="h-4 w-4" />
                Modify Asset
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onGenerateLabel}
              >
                <Tag className="h-4 w-4" />
                Generate ZPL Label
              </Button>
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-outline-variant bg-surface-low p-3">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
