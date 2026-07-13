import { QrCode } from 'lucide-react';

type PaleteSessionBannerProps = {
  codigo: string;
};

export function PaleteSessionBanner({ codigo }: PaleteSessionBannerProps) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-2.5 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary-container">
        <QrCode className="h-3.5 w-3.5 text-secondary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-on-surface-variant">Palete ativo</p>
        <p className="truncate font-mono text-xs font-semibold text-on-surface">{codigo}</p>
      </div>
    </div>
  );
}
