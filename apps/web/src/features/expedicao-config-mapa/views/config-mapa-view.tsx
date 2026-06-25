'use client';

import { Button, cn } from '@lilog/ui';
import { Loader2, Map, PlayCircle, Settings2 } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { GroupingRulesPanel } from '@/features/expedicao-config-mapa/components/grouping-rules-panel';
import { ImpressaoConfigPanel } from '@/features/expedicao-config-mapa/components/impressao-config-panel';
import { MapaSeparacaoPreviewPanel } from '@/features/expedicao-config-mapa/components/mapa-separacao-preview-panel';
import {
  panelBodyClassName,
  panelClassName,
  panelHeaderClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import { PalletizationPanel } from '@/features/expedicao-config-mapa/components/palletization-panel';
import { TransportListPanel } from '@/features/expedicao-config-mapa/components/transport-card';
import { useConfigMapa } from '@/features/expedicao-config-mapa/hooks/use-config-mapa';

export function ConfigMapaView() {
  const {
    transports,
    filteredTransports,
    transportFilter,
    setTransportFilter,
    groupingRules,
    toggleRuleEnabled,
    toggleRuleCollapsed,
    addSegregateItem,
    removeSegregateItem,
    addGroup,
    removeGroup,
    updateGroupName,
    toggleGroupCollapsed,
    addGroupItem,
    removeGroupItem,
    palletization,
    setPalletizationEnabled,
    setPalletizationType,
    setPercentual,
    setLinhas,
    setQuantidadeUnidades,
    printConfig,
    setTipoImpressao,
    setConferenciaSegueSeparacao,
    setCampoClassificacaoConferencia,
    mapPreviews,
    isGenerating,
    onGenerate,
    onCancel,
  } = useConfigMapa();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-3">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Map className="size-3.5" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Expedição
                </span>
              </div>
              <h1 className="text-headline-md font-semibold tracking-tight text-foreground">
                Estratégia de Separação
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Configure regras e visualize o mapa antes de gerar.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={isGenerating}
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={isGenerating}
                onClick={onGenerate}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <PlayCircle className="size-3.5" aria-hidden />
                )}
                Gerar mapas
                <span className="rounded-full bg-on-primary/20 px-1.5 py-px text-[9px] font-bold">
                  {mapPreviews.length}
                </span>
              </Button>
            </div>
          </header>

          <TransportListPanel
            transports={filteredTransports}
            totalCount={transports.length}
            filter={transportFilter}
            onFilterChange={setTransportFilter}
          />

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <section className={cn(panelClassName, 'xl:col-span-5')}>
              <div className={panelHeaderClassName}>
                <div className="flex items-center gap-2">
                  <Settings2 className="size-3.5 text-primary" aria-hidden />
                  <h2 className="text-xs font-semibold text-foreground">
                    Configuração
                  </h2>
                </div>
              </div>

              <div
                className={cn(
                  panelBodyClassName,
                  'max-h-[calc(100vh-14rem)] space-y-0 overflow-y-auto',
                )}
              >
                <PalletizationPanel
                  config={palletization}
                  onEnabledChange={setPalletizationEnabled}
                  onTypeChange={setPalletizationType}
                  onPercentualChange={setPercentual}
                  onLinhasChange={setLinhas}
                  onQuantidadeUnidadesChange={setQuantidadeUnidades}
                />
                <ImpressaoConfigPanel
                  config={printConfig}
                  onTipoImpressaoChange={setTipoImpressao}
                  onConferenciaSegueSeparacaoChange={setConferenciaSegueSeparacao}
                  onCampoClassificacaoChange={setCampoClassificacaoConferencia}
                />
                <GroupingRulesPanel
                  groupingRules={groupingRules}
                  onToggleRuleEnabled={toggleRuleEnabled}
                  onToggleRuleCollapsed={toggleRuleCollapsed}
                  onAddSegregateItem={addSegregateItem}
                  onRemoveSegregateItem={removeSegregateItem}
                  onAddGroup={addGroup}
                  onRemoveGroup={removeGroup}
                  onUpdateGroupName={updateGroupName}
                  onToggleGroupCollapsed={toggleGroupCollapsed}
                  onAddGroupItem={addGroupItem}
                  onRemoveGroupItem={removeGroupItem}
                />
              </div>
            </section>

            <aside className="xl:col-span-7">
              <MapaSeparacaoPreviewPanel mapas={mapPreviews} />
            </aside>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
