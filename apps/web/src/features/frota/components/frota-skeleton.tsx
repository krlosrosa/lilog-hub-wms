'use client';

import { cn } from '@lilog/ui';

type FrotaSkeletonProps = {
  className?: string;
};

export function FrotaSkeleton({ className }: FrotaSkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      aria-hidden
    />
  );
}
