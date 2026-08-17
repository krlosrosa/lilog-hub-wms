'use client';

import { cn } from '@lilog/ui';

type SwitchToggleProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: () => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export function SwitchToggle({
  checked,
  onCheckedChange,
  onChange,
  label,
  disabled = false,
  id,
  className,
}: SwitchToggleProps) {
  const handleClick = () => {
    if (onChange) {
      onChange();
      return;
    }

    onCheckedChange?.(!checked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block size-5 translate-x-0.5 rounded-full bg-background shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}
