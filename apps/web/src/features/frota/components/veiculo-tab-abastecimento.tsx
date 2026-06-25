'use client';

import type { AbastecimentoRegistro } from '@/features/frota/types/frota.schema';

type VeiculoTabAbastecimentoProps = {
  consumoMedioKmL: number;
  consumoDeltaPercent: number;
  historicoPercent: number[];
  abastecimentos: AbastecimentoRegistro[];
};

export function VeiculoTabAbastecimento({
  consumoMedioKmL,
  consumoDeltaPercent,
  historicoPercent,
  abastecimentos,
}: VeiculoTabAbastecimentoProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="rounded-lg border border-b-4 border-b-primary border-outline-variant bg-glass-bg p-6 text-center shadow-inner-glow backdrop-blur-glass">
          <p className="text-label-sm uppercase text-muted-foreground">
            Consumo médio
          </p>
          <p className="mt-2 text-display-lg font-bold text-primary">
            {consumoMedioKmL.toFixed(1)}{' '}
            <span className="text-title-md font-normal">KM/L</span>
          </p>
          <p className="mt-1 text-label-sm text-muted-foreground">
            +{consumoDeltaPercent}% vs mês anterior
          </p>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-outline-variant bg-glass-bg p-6 shadow-inner-glow backdrop-blur-glass lg:col-span-2">
          <p className="mb-4 text-label-sm uppercase text-muted-foreground">
            Histórico de consumo (últimos 10 dias)
          </p>
          <div className="flex h-32 items-end justify-between gap-1">
            {historicoPercent.map((h, i) => (
              <div
                key={`bar-${i}`}
                className="w-full bg-primary transition-opacity hover:opacity-100"
                style={{
                  height: `${h}%`,
                  opacity: 0.2 + (h / 100) * 0.8,
                }}
                role="presentation"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Data
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Litros
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Custo/L
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Posto
              </th>
              <th className="p-4 text-right text-label-sm font-medium text-muted-foreground">
                Eficiência
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {abastecimentos.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-surface-container-low"
              >
                <td className="p-4 text-body-md text-foreground">{row.data}</td>
                <td className="p-4 text-body-md text-foreground">
                  {row.litros}
                </td>
                <td className="p-4 text-body-md text-foreground">
                  {row.custoPorLitro}
                </td>
                <td className="p-4 text-body-md text-foreground">
                  {row.posto}
                </td>
                <td className="p-4 text-right text-primary">{row.eficiencia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
