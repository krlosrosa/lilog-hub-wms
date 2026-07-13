'use client';

import { useState } from 'react';

import { cn } from '@lilog/ui';
import { AlertOctagon, ChevronDown, User } from 'lucide-react';

import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import type { ImpedimentoDetalhe } from '@/features/recebimento/types/recebimento-detalhe.schema';

type ImpedimentoCardProps = {
  impedimento: ImpedimentoDetalhe;
};

export function ImpedimentoCard({ impedimento }: ImpedimentoCardProps) {
  const [expandido, setExpandido] = useState(false);

  const registradoPor =
    impedimento.registradoPorNome ??
    (impedimento.registradoPorMatricula
      ? `Mat. ${impedimento.registradoPorMatricula}`
      : null);

  return (
    <section
      className={cn(
        'rounded-lg border border-outline-variant/70 bg-surface-low/40 shadow-sm',
      )}
      aria-labelledby="titulo-anomalia-registrada"
    >
      <button
        type="button"
        onClick={() => setExpandido((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 p-3.5 text-left transition-colors hover:bg-surface-low/60"
        aria-expanded={expandido}
        aria-controls="conteudo-anomalia-registrada"
      >
        <div className="min-w-0 flex-1">
          <h2
            id="titulo-anomalia-registrada"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            <AlertOctagon className="size-3.5 shrink-0" aria-hidden />
            Anomalia registrada
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Registro histórico da operação · {impedimento.registradoEm}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {impedimento.tipoLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              expandido && 'rotate-180',
            )}
            aria-hidden
          />
        </div>
      </button>

      {expandido ? (
        <div
          id="conteudo-anomalia-registrada"
          className="border-t border-outline-variant/60 px-3.5 pb-3.5 pt-3"
        >
          <p className="text-sm leading-relaxed text-foreground">
            {impedimento.descricao}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            {registradoPor ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-3" aria-hidden />
                {registradoPor}
                {impedimento.registradoPorNome && impedimento.registradoPorMatricula
                  ? ` · Mat. ${impedimento.registradoPorMatricula}`
                  : null}
              </span>
            ) : null}
            <span>Registrado em {impedimento.registradoEm}</span>
          </div>

          {impedimento.fotos.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {impedimento.fotos.map((foto) => (
                <FotoExpandivel
                  key={foto.id}
                  id={foto.id}
                  url={foto.url}
                  legenda={foto.legenda}
                  showLegenda
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-dashed border-outline-variant bg-surface-low/50 px-3 py-2 text-xs text-muted-foreground">
              {impedimento.photoCount > 0
                ? `${impedimento.photoCount} foto(s) aguardando sincronização`
                : 'Nenhuma foto da anomalia disponível'}
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
