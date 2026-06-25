import { cn } from '@lilog/ui';

type PaleteIconProps = {
  className?: string;
};

/** Ícone de palete (visão superior) — distinto de caixa/pacote. */
export function PaleteIcon({ className }: PaleteIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="8" rx="0.5" />
      <path d="M3 11h18" />
      <path d="M9 7v8" />
      <path d="M15 7v8" />
      <path d="M6 15v3" />
      <path d="M12 15v3" />
      <path d="M18 15v3" />
    </svg>
  );
}
