'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';
import { ActiveMissions } from '@/features/op-wms/components/active-missions';
import { AlertsFeed } from '@/features/op-wms/components/alerts-feed';
import { FloatingStatusBar } from '@/features/op-wms/components/floating-status-bar';
import { ProductivityStats } from '@/features/op-wms/components/productivity-stats';
import { QuickActionsHud } from '@/features/op-wms/components/quick-actions-hud';
import { WarehouseMinimap } from '@/features/op-wms/components/warehouse-minimap';
import { useListaDemanda } from '@/features/op-wms/hooks/use-lista-demanda';

export function ListaDemandaView() {
  const router = useRouter();
  const {
    isLoading,
    kpis,
    alerts,
    shiftStatus,
    quickActions,
    missions,
    activeTimerLabel,
    confirmPickup,
  } = useListaDemanda();

  const handleShortcut = useCallback(
    (shortcut: string) => {
      if (shortcut === 'F1') {
        router.push('/op-wms/ressuprimento');
      }
    },
    [router],
  );

  const handleConfirmPickup = async (missionId: string) => {
    const result = await confirmPickup(missionId);
    if (result.success) {
      toast.success(`Coleta confirmada: ${result.title}`);
    }
  };

  return (
    <SidebarMain>
      <main className="relative min-h-dvh blueprint-grid pb-28">
        <div className="px-margin-mobile pb-20 pt-6 md:px-margin-desktop md:pt-8">
          <div className="mx-auto max-w-container">
            <header className="mb-8">
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                WMS Mission Control
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Painel do Operador — Node {shiftStatus.nodeId}
              </p>
            </header>

            {isLoading ? (
              <div
                className="flex min-h-[320px] items-center justify-center"
                role="status"
                aria-label="Carregando painel"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <QuickActionsHud
                  actions={quickActions}
                  onShortcut={handleShortcut}
                />

                <div className="grid grid-cols-12 gap-gutter">
                  <div className="col-span-12 space-y-gutter lg:col-span-8">
                    <ProductivityStats kpis={kpis} />
                    <ActiveMissions
                      missions={missions}
                      activeTimerLabel={activeTimerLabel}
                      isLoading={isLoading}
                      onConfirmPickup={handleConfirmPickup}
                    />
                  </div>

                  <div className="col-span-12 space-y-gutter lg:col-span-4">
                    <AlertsFeed alerts={alerts} />
                    <WarehouseMinimap />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <FloatingStatusBar shiftStatus={shiftStatus} />
      </main>
    </SidebarMain>
  );
}
