import { QrCode } from 'lucide-react';

type PaleteSessionBannerProps = {
  codigo: string;
};

export function PaleteSessionBanner({ codigo }: PaleteSessionBannerProps) {
  return (
    <article className="mb-4 rounded-xl border border-secondary/30 bg-secondary/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary-container">
          <QrCode className="h-5 w-5 text-secondary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Palete ativo
          </p>
          <p className="truncate font-mono text-headline-md font-semibold text-on-surface">
            {codigo}
          </p>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            Os lotes conferidos nesta tela serão vinculados a este palete. Use
            &quot;Fechar palete&quot; ao terminar para informar o próximo.
          </p>
        </div>
      </div>
    </article>
  );
}
