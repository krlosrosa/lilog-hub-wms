import { Images } from 'lucide-react';

interface RecuperacaoPhotoComparisonProps {
  fotoAntesUrl?: string;
  fotoDepoisUrl?: string;
}

export function RecuperacaoPhotoComparison({
  fotoAntesUrl,
  fotoDepoisUrl,
}: RecuperacaoPhotoComparisonProps) {
  return (
    <section className="mb-8 rounded-xl border border-outline-variant bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Images className="h-5 w-5 text-secondary" aria-hidden />
        <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
          Registro Visual
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-container-highest">
            {fotoAntesUrl ? (
              <img
                src={fotoAntesUrl}
                alt="Estado inicial do lote"
                className="h-full w-full object-cover opacity-80 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-on-surface-variant">
                Sem foto
              </div>
            )}
            <div className="absolute left-3 top-3 rounded-full bg-primary/80 px-3 py-1 text-label-sm font-bold uppercase tracking-widest text-primary-foreground backdrop-blur-md">
              Antes
            </div>
          </div>
          <p className="text-center text-body-sm text-on-surface-variant">
            Estado inicial do lote recebido
          </p>
        </div>
        <div className="space-y-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-container-highest">
            {fotoDepoisUrl ? (
              <img
                src={fotoDepoisUrl}
                alt="Estado final do lote"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-on-surface-variant">
                Sem foto
              </div>
            )}
            <div className="absolute left-3 top-3 rounded-full bg-secondary px-3 py-1 text-label-sm font-bold uppercase tracking-widest text-on-secondary shadow-lg">
              Depois
            </div>
          </div>
          <p className="text-center text-body-sm text-on-surface-variant">
            Lote reprocessado e higienizado
          </p>
        </div>
      </div>
    </section>
  );
}
