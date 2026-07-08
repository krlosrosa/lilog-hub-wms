import { ArrowRightFromLine, MapPin } from 'lucide-react';

interface DemandaSecaoTituloProps {
  titulo: string;
  count: number;
  variant: 'retirar' | 'encostar';
}

export function DemandaSecaoTitulo({ titulo, count, variant }: DemandaSecaoTituloProps) {
  const Icon = variant === 'retirar' ? ArrowRightFromLine : MapPin;

  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${variant === 'retirar' ? 'text-amber-500' : 'text-secondary'}`}
          aria-hidden
        />
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          {titulo}
        </h2>
      </div>
      <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-on-surface-variant">
        {count}
      </span>
    </div>
  );
}
