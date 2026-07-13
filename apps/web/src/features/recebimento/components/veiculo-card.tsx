'use client';

import { BadgeCheck, Truck } from 'lucide-react';

import { cn } from '@lilog/ui';

type VeiculoCardProps = {
  placa: string;
  transportadora: string;
  documentacaoOk: boolean;
  quantidadePaletesEsperada?: number | null;
  numeroTermoPalete?: string | null;
};

export function VeiculoCard({
  placa,
  transportadora,
  documentacaoOk,
  quantidadePaletesEsperada = null,
  numeroTermoPalete = null,
}: VeiculoCardProps) {
  return (
    <section
      className="h-full rounded-lg border border-outline-variant/70 bg-glass-bg p-3.5 shadow-sm backdrop-blur-glass"
      aria-labelledby="titulo-infos-veiculo"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="titulo-infos-veiculo"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary"
        >
          <Truck className="size-3.5" aria-hidden />
          Veículo
        </h2>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            documentacaoOk
              ? 'bg-status-active/10 text-status-active'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <BadgeCheck className="size-3 shrink-0" aria-hidden />
          {documentacaoOk ? 'Doc. OK' : 'Pendente'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Placa
          </p>
          <p className="font-mono text-base font-bold tracking-wide text-foreground">
            {placa}
          </p>
        </div>

        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Transportadora
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {transportadora}
          </p>
        </div>
        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Paletes esperados
          </p>
          <p className="text-sm font-semibold text-foreground">
            {quantidadePaletesEsperada ?? '—'}
          </p>
        </div>
        <div className="rounded-md border border-outline-variant/50 bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Termo palete
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {numeroTermoPalete ?? '—'}
          </p>
        </div>
      </div>
    </section>
  );
}
