'use client';

import { cn } from '@lilog/ui';

import {
  switchThumbClassName,
  switchTrackClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';

type SwitchToggleProps = {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
};

export function SwitchToggle({
  checked,
  onChange,
  label,
  className,
}: SwitchToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={cn(switchTrackClassName(checked), className)}
    >
      <span className={switchThumbClassName(checked)} />
    </button>
  );
}
