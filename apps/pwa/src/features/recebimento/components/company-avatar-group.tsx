import { cn } from '@lilog/ui';

import type { CompanyCode } from '../types/recebimento.schema';

const COMPANY_AVATAR: Record<
  CompanyCode,
  { label: string; initial: string; bg: string; text: string }
> = {
  ITB: {
    label: 'Itambé',
    initial: 'I',
    bg: 'bg-primary',
    text: 'text-primary-foreground',
  },
  DPA: {
    label: 'DPA',
    initial: 'D',
    bg: 'bg-secondary',
    text: 'text-secondary-foreground',
  },
  LDB: {
    label: 'Lactalis',
    initial: 'L',
    bg: 'bg-warning',
    text: 'text-primary-foreground',
  },
};

const SIZE_BY_COUNT: Record<'default' | 'compact', Record<number, string>> = {
  default: {
    1: 'h-9 w-9 text-sm',
    2: 'h-8 w-8 text-xs',
    3: 'h-7 w-7 text-[11px]',
  },
  compact: {
    1: 'h-6 w-6 text-[11px]',
    2: 'h-6 w-6 text-[10px]',
    3: 'h-5 w-5 text-[9px]',
  },
};

const OVERLAP_BY_COUNT: Record<number, string> = {
  1: '',
  2: '-space-x-2',
  3: '-space-x-1.5',
};

interface CompanyAvatarGroupProps {
  companies: CompanyCode[];
  className?: string;
  size?: 'default' | 'compact';
}

const FALLBACK_AVATAR = {
  label: 'Unidade',
  initial: 'U',
  bg: 'bg-muted',
  text: 'text-muted-foreground',
};

export function CompanyAvatarGroup({
  companies,
  className,
  size = 'default',
}: CompanyAvatarGroupProps) {
  const unique = [...new Set(companies)]
    .filter((code): code is CompanyCode => code in COMPANY_AVATAR)
    .slice(0, 3);
  const count = unique.length;
  const sizeClass = SIZE_BY_COUNT[size][count] ?? SIZE_BY_COUNT[size][1];
  const overlapClass = OVERLAP_BY_COUNT[count] ?? '';

  if (count === 0) return null;

  return (
    <div
      className={cn('flex shrink-0 items-center', className)}
      aria-label={unique
        .map((c) => `${(COMPANY_AVATAR[c] ?? FALLBACK_AVATAR).label} (${c})`)
        .join(', ')}
    >
      <div className={cn('flex items-center', overlapClass)}>
        {unique.map((code, index) => {
          const config = COMPANY_AVATAR[code] ?? FALLBACK_AVATAR;
          return (
            <div
              key={code}
              className={cn(
                'relative flex shrink-0 items-center justify-center rounded-full font-semibold uppercase shadow-sm',
                'ring-2 ring-surface',
                sizeClass,
                config.bg,
                config.text,
                index > 0 && 'z-10'
              )}
              style={{ zIndex: count - index }}
              title={`${code} — ${config.label}`}
            >
              {config.initial}
            </div>
          );
        })}
      </div>
    </div>
  );
}
