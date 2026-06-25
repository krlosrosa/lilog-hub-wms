'use client';

import type { FC } from 'react';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/utils';

import { Button } from './button';

export interface ThemeToggleProps {
  /** Additional classes for the trigger button */
  className?: string;
}

/**
 * Cycles between light and dark via `next-themes` (`attribute="class"`).
 * Must be rendered under a `ThemeProvider` from `next-themes`.
 */
export const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(className)}
        aria-label="Toggle theme"
        disabled
      >
        <span className="pointer-events-none text-label-md opacity-40" aria-hidden>
          ☾
        </span>
      </Button>
    );
  }

  const label = resolvedTheme === 'dark' ? 'Use light theme' : 'Use dark theme';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(className)}
      aria-label={label}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? (
        <span className="text-label-md tabular-nums" aria-hidden>
          ☀
        </span>
      ) : (
        <span className="text-label-md tabular-nums" aria-hidden>
          ☾
        </span>
      )}
    </Button>
  );
};
