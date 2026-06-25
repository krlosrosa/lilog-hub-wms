'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  MOCK_ACTIVE_MISSIONS,
  MOCK_PRODUCTIVITY_KPIS,
  MOCK_QUICK_ACTIONS,
  MOCK_SHIFT_STATUS,
  MOCK_WMS_ALERTS,
} from '@/features/op-wms/mocks/op-wms.mock';
import type { ActiveMission } from '@/features/op-wms/types/op-wms.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function useListaDemanda() {
  const [isLoading, setIsLoading] = useState(true);
  const [missions, setMissions] = useState<ActiveMission[]>(() => [
    ...MOCK_ACTIVE_MISSIONS,
  ]);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(
    MOCK_ACTIVE_MISSIONS[0]?.elapsedSeconds ?? 0,
  );

  const kpis = MOCK_PRODUCTIVITY_KPIS;
  const alerts = MOCK_WMS_ALERTS;
  const shiftStatus = MOCK_SHIFT_STATUS;
  const quickActions = MOCK_QUICK_ACTIONS;

  useEffect(() => {
    const loadId = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(loadId);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const activeTimerLabel = formatTimer(activeTimerSeconds);

  const confirmPickup = useCallback(async (missionId: string) => {
    setIsLoading(true);
    await delay(800);
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, status: 'queued' as const } : m,
      ),
    );
    setIsLoading(false);
    const mission = missions.find((m) => m.id === missionId);
    return { success: true as const, title: mission?.title ?? 'Missão' };
  }, [missions]);

  return {
    isLoading,
    kpis,
    alerts,
    shiftStatus,
    quickActions,
    missions,
    activeTimerLabel,
    activeTimerSeconds,
    confirmPickup,
  };
}
