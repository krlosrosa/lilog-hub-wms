'use client';

import {
  CircleUser,
  HelpCircle,
  Settings,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { HierarchyPropertiesDialog } from '@/features/layout-cd/components/hierarchy-properties-dialog';
import { LayoutHierarchyPanel } from '@/features/layout-cd/components/layout-hierarchy-panel';
import { LayoutPreviewPanel } from '@/features/layout-cd/components/layout-preview-panel';
import { PartsLibraryToolbar } from '@/features/layout-cd/components/parts-library-toolbar';
import { RackConfigDialog } from '@/features/layout-cd/components/rack-config-dialog';
import { useConstrutor } from '@/features/layout-cd/hooks/use-construtor';

export function ConstrutorView() {
  const {
    hierarchy,
    selection,
    expandedStreetIds,
    expandedCabecaIds,
    expandedStructureIds,
    activePartType,
    addContextHint,
    handlePartChipClick,
    selectNode,
    selectPositionFromPreview,
    toggleStreetExpanded,
    toggleCabecaExpanded,
    toggleStructureExpanded,
    expandAllHierarchy,
    collapseAllHierarchy,
    collapseSelection,
    hierarchyPanelCollapsed,
    toggleHierarchyPanelCollapsed,
    addStreet,
    addStructureToSelection,
    addComponentToSelection,
    addCabecaInicio,
    addCabecaFim,
    removeSelected,
    zoomPercent,
    zoomIn,
    zoomOut,
    streetForm,
    cabecaForm,
    structureForm,
    componentForm,
    configForm,
    configDialogOpen,
    setConfigDialogOpen,
    propertiesDialogOpen,
    handlePropertiesDialogChange,
    openConfigDialog,
    openPropertiesDialog,
    resetProperties,
    confirmProperties,
    closeConfigDialog,
    previewArmazem,
    publishLayout,
    isPublishing,
    updateItemConfig,
    floorPressurePercent,
  } = useConstrutor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        if (selection) removeSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [removeSelected, selection]);

  return (
    <SidebarMain className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-card px-8">
        <div className="flex items-center gap-6">
          <Link href="/layout-cd" className="text-lg font-bold text-primary">
            WMS Builder
          </Link>
          <p className="font-mono text-xs text-muted-foreground">
            Monte o layout pela hierarquia · pré-visualização ao vivo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={previewArmazem}
          >
            Ver armazém
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openPropertiesDialog}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Propriedades
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={isPublishing}
            onClick={() => void publishLayout()}
          >
            <Upload className="h-4 w-4" />
            {isPublishing ? 'Publicando…' : 'Publish Layout'}
          </Button>
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            <CircleUser className="h-5 w-5" />
          </button>
        </div>
      </header>

      <PartsLibraryToolbar
        activePartType={activePartType}
        contextHint={addContextHint}
        onSelectPart={handlePartChipClick}
      />

      <div className="flex min-h-0 flex-1">
        <LayoutHierarchyPanel
          hierarchy={hierarchy}
          selection={selection}
          activePartType={activePartType}
          expandedStreetIds={expandedStreetIds}
          expandedCabecaIds={expandedCabecaIds}
          expandedStructureIds={expandedStructureIds}
          onSelect={selectNode}
          onToggleStreet={toggleStreetExpanded}
          onToggleCabeca={toggleCabecaExpanded}
          onToggleStructure={toggleStructureExpanded}
          onExpandAll={expandAllHierarchy}
          onCollapseAll={collapseAllHierarchy}
          onCollapseSelection={collapseSelection}
          panelCollapsed={hierarchyPanelCollapsed}
          onTogglePanelCollapsed={toggleHierarchyPanelCollapsed}
          onAddStreet={addStreet}
          onAddStructure={addStructureToSelection}
          onAddComponent={addComponentToSelection}
          onAddCabecaInicio={addCabecaInicio}
          onAddCabecaFim={addCabecaFim}
        />

        <LayoutPreviewPanel
          hierarchy={hierarchy}
          selection={selection}
          zoomPercent={zoomPercent}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSelectPosition={selectPositionFromPreview}
          className="min-h-0 flex-1"
        />
      </div>

      <HierarchyPropertiesDialog
        open={propertiesDialogOpen}
        onOpenChange={handlePropertiesDialogChange}
        selection={selection}
        hierarchy={hierarchy}
        streetForm={streetForm}
        cabecaForm={cabecaForm}
        structureForm={structureForm}
        componentForm={componentForm}
        floorPressurePercent={floorPressurePercent}
        onReset={resetProperties}
        onApply={confirmProperties}
        onRemove={removeSelected}
        onOpenConfig={() => {
          handlePropertiesDialogChange(false);
          openConfigDialog();
        }}
      />

      <RackConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        form={configForm}
        onSave={(data) => void updateItemConfig(data)}
        onCancel={closeConfigDialog}
      />
    </SidebarMain>
  );
}
