'use client';

import Link from 'next/link';

import { cn } from '@lilog/ui';
import { ChevronRight, type LucideIcon } from 'lucide-react';

type ConfigSectionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  comingSoon?: boolean;
};

export function ConfigSectionCard({
  title,
  description,
  icon: Icon,
  href,
  comingSoon = false,
}: ConfigSectionCardProps) {
  const content = (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-xl border border-outline-variant bg-glass-bg p-5 shadow-inner-glow backdrop-blur-glass transition-colors',
        comingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'hover:border-primary/40 hover:bg-surface-low/30',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
          <Icon className="size-5" aria-hidden />
        </span>
        {comingSoon ? (
          <span className="rounded-full bg-surface-highest px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Em breve
          </span>
        ) : (
          <ChevronRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        )}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );

  if (comingSoon || !href) {
    return content;
  }

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
