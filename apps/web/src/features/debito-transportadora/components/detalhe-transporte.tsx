import { Truck, User } from 'lucide-react';

import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';

type DetalheTransporteProps = {
  debito: DebitoDetalhe;
};

export function DetalheTransporte({ debito }: DetalheTransporteProps) {
  return (
    <article className="rounded-xl border border-outline-variant/50 bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass">
      <h3 className="mb-6 flex items-center gap-2 text-headline-md font-medium text-foreground">
        <Truck className="size-5 text-primary" aria-hidden />
        Dados do Transporte
      </h3>

      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg bg-surface-low p-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-surface-high">
            <User className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <p className="text-caption text-muted-foreground">Motorista</p>
            <p className="text-body-md font-semibold text-foreground">
              {debito.motorista}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-low p-3">
            <p className="text-caption text-muted-foreground">Placa do Veículo</p>
            <p className="font-mono text-body-md text-foreground">
              {debito.placaVeiculo}
            </p>
          </div>
          <div className="rounded-lg bg-surface-low p-3">
            <p className="text-caption text-muted-foreground">Tipo de Frota</p>
            <p className="text-body-md text-foreground">{debito.tipoFrota}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-outline-variant p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Status do Monitoramento
            </span>
            <span className="text-xs font-bold text-tertiary">
              {debito.monitoramentoAtivo ? 'ATIVO' : 'INATIVO'}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-highest">
            <div
              className="h-full bg-tertiary"
              style={{ width: `${debito.monitoramentoProgresso}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{debito.ultimoSinal}</p>
        </div>
      </div>
    </article>
  );
}
