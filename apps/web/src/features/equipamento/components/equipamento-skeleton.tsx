'use client';

import { cn } from '@lilog/ui';

type EquipamentoSkeletonProps = {
  className?: string;
};

export function EquipamentoSkeleton({ className }: EquipamentoSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted',
        className,
      )}
      aria-hidden
    />
  );
}
