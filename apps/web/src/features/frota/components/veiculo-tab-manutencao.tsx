'use client';

import { Button } from '@lilog/ui';
import { Wrench } from 'lucide-react';

import type { ManutencaoRegistro } from '@/features/frota/types/frota.schema';

type VeiculoTabManutencaoProps = {
  registros: ManutencaoRegistro[];
  onRegistrar?: () => void;
};

export function VeiculoTabManutencao({
  registros,
  onRegistrar,
}: VeiculoTabManutencaoProps) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-title-md font-medium text-primary">
          Histórico de serviços
        </h3>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          onClick={onRegistrar}
        >
          <Wrench className="h-4 w-4" aria-hidden />
          Registrar manutenção
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
        <table className="w-full border-collapse text-left">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Data
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Tipo
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Odômetro (km)
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Custo
              </th>
              <th className="p-4 text-label-sm font-medium text-muted-foreground">
                Oficina
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {registros.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-surface-container-low"
              >
                <td className="p-4 text-body-md text-foreground">{row.data}</td>
                <td className="p-4 text-body-md text-foreground">{row.tipo}</td>
                <td className="p-4 text-body-md text-foreground">
                  {row.odometroKm.toLocaleString('pt-BR')}
                </td>
                <td className="p-4 text-body-md text-foreground">
                  {row.custo}
                </td>
                <td className="p-4 text-body-md text-foreground">
                  {row.oficina}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
