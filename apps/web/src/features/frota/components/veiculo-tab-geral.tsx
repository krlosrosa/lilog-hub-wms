'use client';

import { Truck } from 'lucide-react';

import type { VeiculoDetalhe } from '@/features/frota/types/frota.schema';

type VeiculoTabGeralProps = {
  veiculo: VeiculoDetalhe;
};

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-label-sm uppercase text-muted-foreground">
        {label}
      </label>
      <p className="text-title-md text-foreground">{value}</p>
    </div>
  );
}

export function VeiculoTabGeral({ veiculo }: VeiculoTabGeralProps) {
  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-x-12 gap-y-8 rounded-lg border border-outline-variant bg-glass-bg p-8 shadow-inner-glow backdrop-blur-glass lg:col-span-2">
        <Campo label="Renavam" value={veiculo.renavam} />
        <Campo label="Chassi" value={veiculo.chassis} />
        <Campo label="Marca / Modelo" value={veiculo.marcaModelo} />
        <Campo
          label="Ano / Fabricação"
          value={`${veiculo.anoFabricacao} / ${veiculo.anoModelo}`}
        />
        <Campo label="Peso bruto total (PBT)" value={veiculo.pesoBrutoKg} />
        <Campo
          label="Capacidade de carga líquida"
          value={veiculo.capacidadeCargaKg}
        />
        <Campo label="Capacidade de cubagem" value={veiculo.cubagem} />
        <Campo label="Tipo de combustível" value={veiculo.combustivel} />
      </div>
      <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest p-4">
        <div className="pointer-events-none absolute inset-0 opacity-20 blueprint-grid" />
        <div className="relative z-10 flex flex-col items-center gap-4 py-8 text-muted-foreground">
          <Truck className="h-24 w-24 text-primary/60" strokeWidth={1} aria-hidden />
          <span className="font-mono text-[10px] text-muted-foreground">
            REF: {veiculo.refTecnica}
          </span>
        </div>
      </div>
    </div>
  );
}
