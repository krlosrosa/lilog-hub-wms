'use client';

import { Forklift } from 'lucide-react';

import {
  TIPO_EQUIPAMENTO_LABELS,
  type EquipamentoDossie,
} from '@/features/equipamento/types/equipamento.schema';

type DossieTabGeralProps = {
  equipamento: EquipamentoDossie;
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

export function DossieTabGeral({ equipamento }: DossieTabGeralProps) {
  return (
    <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
      <div className="grid grid-cols-2 gap-x-12 gap-y-8 rounded-lg border border-outline-variant bg-glass-bg p-8 shadow-inner-glow backdrop-blur-glass lg:col-span-2">
        <Campo
          label="Tipo"
          value={TIPO_EQUIPAMENTO_LABELS[equipamento.tipo]}
        />
        <Campo label="Marca / Modelo" value={`${equipamento.marca} ${equipamento.modelo}`} />
        <Campo label="Ano" value={String(equipamento.ano)} />
        <Campo label="Capacidade de carga" value={equipamento.capacidadeKg} />
        <Campo label="Centro de carga" value={equipamento.centroCarga} />
        <Campo label="Bateria" value={equipamento.bateria} />
        <Campo label="Peso operacional" value={equipamento.pesoOperacional} />
        <Campo label="Última revisão" value={equipamento.ultimaRevisao} />
        <Campo label="Localização" value={equipamento.localizacao} />
        <Campo label="Centro de distribuição" value={equipamento.centroDistribuicao} />
      </div>
      <div className="relative flex items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest p-4">
        <div className="pointer-events-none absolute inset-0 opacity-20 blueprint-grid" />
        <div className="relative z-10 flex flex-col items-center gap-4 py-8 text-muted-foreground">
          <Forklift
            className="h-24 w-24 text-primary/60"
            strokeWidth={1}
            aria-hidden
          />
          <span className="font-mono text-[10px] text-muted-foreground">
            REF: {equipamento.refTecnica}
          </span>
        </div>
      </div>
    </div>
  );
}
