import { cn } from '@lilog/ui';
import { Info, MapPin } from 'lucide-react';

import { DebitoOperacaoNfBadge } from '@/features/debito-transportadora/components/debito-operacao-nf-badge';
import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_SEVERIDADE_LABELS } from '@/features/debito-transportadora/types/debito.schema';

type DetalheInfoGeralProps = {
  debito: DebitoDetalhe;
  onEditar: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function DetalheInfoGeral({ debito, onEditar }: DetalheInfoGeralProps) {
  return (
    <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-headline-md font-medium text-foreground">
          <Info className="size-5 text-primary" aria-hidden />
          Informações Gerais
        </h3>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={onEditar}
        >
          Editar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-12 md:grid-cols-3">
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Data do Incidente
          </p>
          <p className="text-body-md text-foreground">{debito.dataIncidente}</p>
        </div>
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Transportadora
          </p>
          <p className="text-body-md text-foreground">{debito.transportadora}</p>
        </div>
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Pedido
          </p>
          <p className="text-body-md text-primary">{debito.pedido}</p>
        </div>
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Peso Afetado
          </p>
          <p className="text-body-md text-foreground">
            {debito.pesoAfetadoKg.toLocaleString('pt-BR')} kg
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Valor Reclamado
          </p>
          <p className="text-lg font-bold text-tertiary">
            {formatCurrency(debito.valorReclamado)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Severidade
          </p>
          <span
            className={cn(
              'inline-block rounded px-2 py-0.5 text-xs font-bold',
              debito.severidade === 'alta'
                ? 'bg-destructive/30 text-destructive'
                : debito.severidade === 'media'
                  ? 'bg-secondary-container/30 text-secondary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {DEBITO_SEVERIDADE_LABELS[debito.severidade]}
          </span>
        </div>

        <div className="col-span-full space-y-3 border-t border-outline-variant pt-4">
          <p className="text-caption uppercase tracking-wider text-muted-foreground">
            Notas Fiscais ({debito.notasFiscais.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {debito.notasFiscais.map((nf) => (
              <div
                key={nf.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-outline-variant bg-surface-low px-3 py-2"
              >
                <span className="font-mono text-sm font-semibold text-foreground">
                  {nf.numero}
                </span>
                <DebitoOperacaoNfBadge operacao={nf.operacao} />
                {nf.pedido ? (
                  <span className="text-[10px] text-muted-foreground">
                    {nf.pedido}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-full grid grid-cols-1 gap-8 border-t border-outline-variant pt-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-caption uppercase tracking-wider text-muted-foreground">
              Origem
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-body-md text-foreground">{debito.origem}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-caption uppercase tracking-wider text-muted-foreground">
              Destino
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-body-md text-foreground">{debito.destino}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
