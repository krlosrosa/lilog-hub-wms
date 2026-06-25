import { cn } from '@lilog/ui';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

export interface AvariaSelectOption {
  value: string;
  label: string;
}

interface AvariaSelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly AvariaSelectOption[];
  error?: string;
  placeholder?: string;
}

export function AvariaSelectField({
  label,
  options,
  error,
  placeholder = 'Selecione...',
  className,
  id,
  ...props
}: AvariaSelectFieldProps) {
  return (
    <div className="flex flex-col gap-sm">
      <label className="text-label-md font-semibold text-on-surface" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn(
            'h-12 w-full appearance-none rounded-lg border border-outline bg-surface-bright px-md pr-10 text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary',
            error && 'border-destructive focus:border-destructive focus:ring-destructive',
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-md top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
          aria-hidden
        />
      </div>
      {error && <p className="text-label-sm text-destructive">{error}</p>}
    </div>
  );
}
