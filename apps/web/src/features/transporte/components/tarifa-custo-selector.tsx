'use client';

import { cn } from '@lilog/ui';

import {
  CUSTO_POR_TIPO,
  formatarMoeda,
  obterCustoDiaria,
} from '@/features/transporte/lib/calcular-custo';
import { PerfilVeiculoBadge } from '@/features/transporte/components/perfil-veiculo-badge';
import type { TipoVeiculo } from '@/features/transporte/types/transporte.schema';
import { TIPO_VEICULO_LABELS } from '@/features/transporte/types/transporte.schema';

const selectClass = cn(
  'w-full rounded-md border border-outline-variant bg-surface-low px-2.5 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type TarifaCustoSelectorProps = {
  value: TipoVeiculo;
  onChange: (tipo: TipoVeiculo) => void;
  perfilEsperado: TipoVeiculo;
  perfilAlocado?: TipoVeiculo;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function TarifaCustoSelector({
  value,
  onChange,
  perfilEsperado,
  perfilAlocado,
  disabled = false,
  compact = false,
  className,
}: TarifaCustoSelectorProps) {
  const divergenteEsperado = value !== perfilEsperado;
  const divergenteAlocado =
    perfilAlocado !== undefined && value !== perfilAlocado;
  const custoTotal = obterCustoDiaria(value);

  if (compact) {
    return (
      <select
        className={cn(
          'rounded-md border border-outline-variant bg-surface-low px-1.5 py-0.5',
          'font-mono text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
          divergenteEsperado || divergenteAlocado
            ? 'border-secondary/50 bg-secondary/5'
            : undefined,
          className,
        )}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TipoVeiculo)}
        aria-label="Tarifa de custo"
        title={`Tarifa: ${TIPO_VEICULO_LABELS[value]} — ${formatarMoeda(custoTotal)}`}
      >
        {CUSTO_POR_TIPO.map((item) => (
          <option key={item.tipo} value={item.tipo}>
            {TIPO_VEICULO_LABELS[item.tipo]} ({formatarMoeda(item.custoDiaria)}/dia)
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border p-4',
        divergenteEsperado || divergenteAlocado
          ? 'border-secondary/40 bg-secondary/5'
          : 'border-outline-variant bg-surface-low/80',
        className,
      )}
    >
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-foreground">
          Tarifa de custo
        </h4>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Defina qual perfil tarifário será usado no custo previsto. Não precisa
          coincidir com o veículo alocado.
        </p>
      </div>

      {(divergenteEsperado || divergenteAlocado) && (
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">Referência:</span>
          <span className="inline-flex items-center gap-1">
            Esp.
            <PerfilVeiculoBadge tipo={perfilEsperado} variante="esperado" />
          </span>
          {perfilAlocado ? (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1">
                Aloc.
                <PerfilVeiculoBadge
                  tipo={perfilAlocado}
                  divergente={perfilAlocado !== perfilEsperado}
                  variante="alocado"
                />
              </span>
            </>
          ) : null}
        </div>
      )}

      <select
        className={selectClass}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as TipoVeiculo)}
        aria-label="Selecionar tarifa de custo"
      >
        {CUSTO_POR_TIPO.map((item) => (
          <option key={item.tipo} value={item.tipo}>
            {TIPO_VEICULO_LABELS[item.tipo]} — {formatarMoeda(item.custoDiaria)}/dia
          </option>
        ))}
      </select>

      <div className="flex items-center justify-between rounded-lg border border-outline-variant/60 bg-glass-bg px-3 py-2 text-xs">
        <span className="text-muted-foreground">
          1 diária × {formatarMoeda(obterCustoDiaria(value))}
        </span>
        <span className="font-mono font-bold text-tertiary">
          {formatarMoeda(custoTotal)}
        </span>
      </div>
    </div>
  );
}
