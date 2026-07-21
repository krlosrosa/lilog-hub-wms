import { cn } from '@lilog/ui';
import type { LucideIcon } from 'lucide-react';

import { hapticLight } from '@/lib/haptics';

import { notifyPilotDisabled } from '../lib/pilot-disabled';

interface RcPilotIconButtonProps {
  icon: LucideIcon;
  label: string;
  feature: string;
  className?: string;
}

export function RcPilotIconButton({
  icon: Icon,
  label,
  feature,
  className,
}: RcPilotIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        hapticLight();
        notifyPilotDisabled(feature);
      }}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90',
        className,
      )}
    >
      <Icon className="h-4.5 w-4.5" aria-hidden />
    </button>
  );
}
