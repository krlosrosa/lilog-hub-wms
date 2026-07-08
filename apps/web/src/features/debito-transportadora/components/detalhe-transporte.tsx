import { Truck, User } from 'lucide-react';

import { DetalheSection } from '@/features/debito-transportadora/components/detalhe-section';
import type { DebitoDetalhe } from '@/features/debito-transportadora/types/debito.schema';

type DetalheTransporteProps = {
  debito: DebitoDetalhe;
};

export function DetalheTransporte({ debito }: DetalheTransporteProps) {
  return (
    <DetalheSection id="titulo-transporte" title="Transporte" icon={Truck}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center gap-2 rounded-md bg-surface-low px-2.5 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-high">
            <User className="size-3.5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">Motorista</p>
            <p className="truncate text-sm font-semibold text-foreground">
              {debito.motorista}
            </p>
          </div>
        </div>
        <div className="rounded-md bg-surface-low px-2.5 py-2">
          <p className="text-[10px] text-muted-foreground">Placa</p>
          <p className="font-mono text-sm font-semibold text-foreground">
            {debito.placaVeiculo}
          </p>
        </div>
        <div className="rounded-md bg-surface-low px-2.5 py-2">
          <p className="text-[10px] text-muted-foreground">Frota</p>
          <p className="truncate text-sm text-foreground">{debito.tipoFrota}</p>
        </div>
      </div>
    </DetalheSection>
  );
}
