'use client';

import { Inbox, Keyboard, Lock } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { ActiveMission } from '@/features/op-wms/types/op-wms.schema';

const ICON_MAP = {
  move_to_inbox: Inbox,
  keyboard_tab: Keyboard,
  forklift: Inbox,
} as const;

type ActiveMissionsProps = {
  missions: ActiveMission[];
  activeTimerLabel: string;
  isLoading?: boolean;
  onConfirmPickup?: (missionId: string) => void;
};

export function ActiveMissions({
  missions,
  activeTimerLabel,
  isLoading,
  onConfirmPickup,
}: ActiveMissionsProps) {
  const active = missions.find((m) => m.status === 'active');
  const queued = missions.filter((m) => m.status !== 'active');

  return (
    <div className={cn(glassPanelClassName, 'col-span-full rounded-2xl p-6 lg:col-span-3')}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-title-md font-semibold text-foreground">Missões Ativas</h3>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-label-sm text-primary">
          {queued.length + (active ? 1 : 0)} Tarefas Pendentes
        </span>
      </div>

      <div className="space-y-4">
        {active && (
          <div className="relative rounded-xl border border-primary bg-primary/5 p-4 shadow-[0_0_15px_hsl(var(--primary)/0.15)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant bg-card">
                  <Inbox className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h4 className="text-body-md font-bold text-foreground">{active.title}</h4>
                  <p className="text-label-sm text-muted-foreground">
                    Posição:{' '}
                    <span className="font-mono text-primary">{active.position}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-headline-lg-mobile text-primary">
                  {activeTimerLabel}
                </div>
                <p className="text-caption text-muted-foreground">
                  EST:{' '}
                  {Math.floor(active.estimatedSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(active.estimatedSeconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex -space-x-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-secondary text-[8px] font-bold text-secondary-foreground">
                  SKU
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-tertiary text-[8px] font-bold text-tertiary-foreground">
                  DRV
                </div>
              </div>
              <p className="text-caption text-muted-foreground">{active.itemDescription}</p>
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                disabled={isLoading}
                onClick={() => onConfirmPickup?.(active.id)}
              >
                Confirmar Coleta
              </Button>
            </div>
          </div>
        )}

        {queued.map((mission) => {
          const Icon = ICON_MAP[mission.icon];
          return (
            <div
              key={mission.id}
              className={cn(
                'rounded-xl border border-outline-variant bg-surface-low p-4 transition-opacity',
                mission.status === 'locked' && 'opacity-60 hover:opacity-100',
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-card">
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                  </div>
                  <div>
                    <h4 className="text-body-md font-bold text-muted-foreground">
                      {mission.title}
                    </h4>
                    {mission.priority && (
                      <p className="text-caption">
                        Prioridade:{' '}
                        <span className="text-destructive font-medium capitalize">
                          {mission.priority}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                {mission.status === 'locked' && (
                  <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
