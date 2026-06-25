import { cn } from '@lilog/ui';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { FeatureToast } from '../types';

export function FeatureToastPortal({ toast }: { toast: FeatureToast | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+16px)] z-[60] flex justify-center px-margin-mobile transition-opacity duration-300',
        toast ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-body-sm font-medium shadow-lg',
          toast?.variant === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-secondary-container text-on-secondary-container',
        )}
      >
        {toast?.message ?? ''}
      </div>
    </div>,
    document.body,
  );
}
