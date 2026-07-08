'use client';

import {
  Ban,
  Boxes,
  ClipboardList,
  MapPin,
  Percent,
} from 'lucide-react';

import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import type { EnderecoKpi } from '@/features/enderecos/types/enderecos-gestao.schema';

type OcupacaoKpiHeaderProps = {
  kpi: EnderecoKpi | null;
};

const nf = new Intl.NumberFormat('pt-BR');

export function OcupacaoKpiHeader({ kpi }: OcupacaoKpiHeaderProps) {
  if (!kpi) {
    return (
      <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl border border-outline-variant bg-surface-high"
          />
        ))}
      </div>
    );
  }

  const disponiveis = kpi.enderecosDisponiveis ?? 0;
  const ocupados = kpi.enderecosOcupados ?? 0;
  const taxaOcupacao = kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent;

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-5">
      <EnderecoKpiCard
        icon={<MapPin className="size-4 text-primary" aria-hidden />}
        label="Total de posições"
        value={nf.format(kpi.totalEnderecos)}
        footer={
          <span className="text-[10px] text-muted-foreground">
            {kpi.totalEnderecosTrendPercent >= 0 ? '+' : ''}
            {kpi.totalEnderecosTrendPercent}% vs. período anterior
          </span>
        }
      />
      <EnderecoKpiCard
        icon={<Boxes className="size-4 text-status-active" aria-hidden />}
        label="Disponíveis"
        value={nf.format(disponiveis)}
        variant="tertiary"
      />
      <EnderecoKpiCard
        icon={<Boxes className="size-4 text-primary" aria-hidden />}
        label="Ocupadas"
        value={nf.format(ocupados)}
      />
      <EnderecoKpiCard
        icon={<Ban className="size-4 text-destructive" aria-hidden />}
        label="Bloqueadas"
        value={nf.format(kpi.posicoesBloqueadas)}
        variant="critical"
      />
      <EnderecoKpiCard
        icon={<Percent className="size-4 text-tertiary" aria-hidden />}
        label="Ocupação global"
        value={`${Math.round(taxaOcupacao)}%`}
        progressPercent={taxaOcupacao}
        progressClassName="bg-primary"
        footer={
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ClipboardList className="size-3" aria-hidden />
            {kpi.crossDockingAtivos} cross-docking ativos
          </span>
        }
      />
    </div>
  );
}
