import type { ProcessoDebitoEvidencia } from '../types/debito.types';
import { formatData } from '../types/debito.types';

type DebitoEvidenciasTabProps = {
  evidencias: ProcessoDebitoEvidencia[];
};

export function DebitoEvidenciasTab({ evidencias }: DebitoEvidenciasTabProps) {
  if (evidencias.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Nenhuma evidência registrada pelo centro de distribuição.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {evidencias.map((evidencia) => (
        <article
          key={evidencia.id}
          className="overflow-hidden rounded-lg border border-border/60 bg-card"
        >
          <div className="border-b border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground">{evidencia.tipo}</p>
            {evidencia.natureza ? <p className="truncate">{evidencia.natureza}</p> : null}
            <p>{formatData(evidencia.createdAt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-0.5 p-0.5">
            {evidencia.photoUrls.length > 0 ? (
              evidencia.photoUrls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-md bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Evidência de avaria"
                    className="aspect-square w-full object-cover transition-opacity hover:opacity-90"
                  />
                </a>
              ))
            ) : (
              <p className="col-span-2 px-2 py-3 text-center text-xs text-muted-foreground">
                Sem imagens disponíveis
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
