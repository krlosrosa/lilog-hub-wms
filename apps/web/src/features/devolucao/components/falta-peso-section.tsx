'use client';

import { Button, cn } from '@lilog/ui';
import { CheckCircle2, Scale, XCircle } from 'lucide-react';

import type { FaltaPesoDetalhe } from '@/features/devolucao/types/devolucao-falta-peso.schema';
import { FALTA_PESO_STATUS_LABELS } from '@/features/devolucao/types/devolucao-falta-peso.schema';

type FaltaPesoSectionProps = {
  faltasPeso: FaltaPesoDetalhe[];
  isLoading?: boolean;
  onValidar: (faltaPesoId: string) => void | Promise<void>;
  onRejeitar: (faltaPesoId: string) => void | Promise<void>;
};

function formatKg(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

const STATUS_BADGE: Record<
  FaltaPesoDetalhe['status'],
  string
> = {
  pendente: 'border-secondary/30 bg-secondary/10 text-secondary',
  validada: 'border-tertiary/30 bg-tertiary/10 text-tertiary',
  rejeitada: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export function FaltaPesoSection({
  faltasPeso,
  isLoading = false,
  onValidar,
  onRejeitar,
}: FaltaPesoSectionProps) {
  if (faltasPeso.length === 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <div className="flex items-center gap-2 border-b border-outline-variant px-3 py-2.5">
        <Scale className="size-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">
          Faltas de peso
        </h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {faltasPeso.length}
        </span>
      </div>

      <div className="divide-y divide-outline-variant/60">
        {faltasPeso.map((falta) => (
          <article key={falta.id} className="space-y-2 px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">
                  {falta.sku}
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {falta.descricaoProduto ?? falta.sku}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  STATUS_BADGE[falta.status],
                )}
              >
                {FALTA_PESO_STATUS_LABELS[falta.status]}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                Esperado:{' '}
                <strong className="tabular-nums text-foreground">
                  {formatKg(falta.pesoEsperadoKg)} kg
                </strong>
              </span>
              <span>
                Devolvido:{' '}
                <strong className="tabular-nums text-foreground">
                  {formatKg(falta.pesoDevolvidoKg)} kg
                </strong>
              </span>
              <span>
                Falta:{' '}
                <strong className="tabular-nums text-secondary">
                  {formatKg(falta.pesoFaltanteKg)} kg
                </strong>
              </span>
            </div>

            {falta.motivo ? (
              <p className="text-xs text-foreground/80">{falta.motivo}</p>
            ) : null}

            <p className="text-[10px] text-muted-foreground">
              Registrado em {formatDateTime(falta.registradoEm)}
              {falta.validadoEm
                ? ` · Validado em ${formatDateTime(falta.validadoEm)}`
                : null}
            </p>

            {falta.status === 'pendente' ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => void onValidar(falta.id)}
                  className="h-7 gap-1 border-tertiary/30 text-tertiary hover:bg-tertiary/10"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Validar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => void onRejeitar(falta.id)}
                  className="h-7 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="size-3.5" aria-hidden />
                  Rejeitar
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
