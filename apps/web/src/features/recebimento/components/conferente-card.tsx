'use client';

import { Clock, User, UserCheck } from 'lucide-react';

import { cn } from '@lilog/ui';

type ConferenteCardProps = {
  conferenteMatricula: string | null;
  conferenteNome: string | null;
  iniciadaEm: string | null;
  finalizadaEm: string | null;
  quantidadePaletesEsperada: number | null;
  quantidadePaletes: number | null;
};

function formatConferenteLabel(
  matricula: string | null,
  nome: string | null,
): string | null {
  const parts = [matricula?.trim(), nome?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function ConferenteCard({
  conferenteMatricula,
  conferenteNome,
  iniciadaEm,
  finalizadaEm,
  quantidadePaletesEsperada,
  quantidadePaletes,
}: ConferenteCardProps) {
  const emAndamento = Boolean(iniciadaEm) && !finalizadaEm;
  const conferenteLabel = formatConferenteLabel(conferenteMatricula, conferenteNome);

  return (
    <section
      className="h-full rounded-lg border border-outline-variant/70 bg-glass-bg p-3.5 shadow-sm backdrop-blur-glass"
      aria-labelledby="titulo-conferente"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="titulo-conferente"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary"
        >
          <User className="size-3.5" aria-hidden />
          Conferente
        </h2>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            finalizadaEm
              ? 'bg-status-active/10 text-status-active'
              : emAndamento
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {finalizadaEm ? (
            <>
              <UserCheck className="size-3 shrink-0" aria-hidden />
              Finalizada
            </>
          ) : emAndamento ? (
            <>
              <Clock className="size-3 shrink-0" aria-hidden />
              Em andamento
            </>
          ) : (
            'Aguardando'
          )}
        </span>
      </div>

      <div className="mb-2 rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
          Responsável
        </p>
        {conferenteLabel ? (
          <p className="truncate text-sm font-semibold text-foreground">
            {conferenteLabel}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Não atribuído</p>
        )}
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Paletes esperados
          </p>
          <p className="text-sm font-medium text-foreground">
            {quantidadePaletesEsperada ?? '—'}
          </p>
        </div>

        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Paletes recebidos
          </p>
          <p className="text-sm font-medium text-foreground">
            {quantidadePaletes ?? '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Iniciou
          </p>
          <p className="text-sm font-medium text-foreground">
            {iniciadaEm ?? '—'}
          </p>
        </div>

        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Finalizou
          </p>
          <p
            className={cn(
              'text-sm font-medium',
              finalizadaEm ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {finalizadaEm ?? (iniciadaEm ? 'Em andamento' : '—')}
          </p>
        </div>
      </div>
    </section>
  );

}
