'use client';

import Link from 'next/link';

import { SidebarMain } from '@/components/layout/sidebar';
import { AssetInspectorSheet } from '@/features/layout-cd/components/asset-inspector-sheet';
import { TechToolbar } from '@/features/layout-cd/components/tech-toolbar';
import { WarehouseCanvas } from '@/features/layout-cd/components/warehouse-canvas';
import { useArmazem } from '@/features/layout-cd/hooks/use-armazem';

export function ArmazemLayoutView() {
  const {
    aisles,
    transversalBands,
    driveInLanes,
    fromBuilder,
    itemCount,
    inspectorOpen,
    selectedPosition,
    selectPosition,
    closeInspector,
    zoomPercent,
    zoomIn,
    zoomOut,
    inspectorLevels,
    modifyAsset,
    generateLabel,
  } = useArmazem();

  return (
    <SidebarMain className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface px-8">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-surface-tint">Mapa do Armazém</h1>
          <span className="font-mono text-xs text-muted-foreground">
            {fromBuilder
              ? `Layout publicado · ${itemCount} itens`
              : 'Warehouse A-12 · demonstração'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {fromBuilder ? (
            <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold text-primary">
              DO CONSTRUTOR
            </span>
          ) : null}
          <Link
            href="/layout-cd/construtor"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Layout Builder
          </Link>
        </div>
      </header>

      <TechToolbar onZoomIn={zoomIn} onZoomOut={zoomOut} />

      <WarehouseCanvas
        aisles={aisles}
        transversalBands={transversalBands}
        driveInLanes={driveInLanes}
        selectedPosId={selectedPosition?.posId ?? null}
        onSelectPosition={selectPosition}
        zoomPercent={zoomPercent}
      />

      <AssetInspectorSheet
        open={inspectorOpen}
        onOpenChange={(open) => {
          if (!open) closeInspector();
        }}
        position={selectedPosition}
        levels={inspectorLevels}
        onModify={() => void modifyAsset()}
        onGenerateLabel={() => void generateLabel()}
      />
    </SidebarMain>
  );
}
