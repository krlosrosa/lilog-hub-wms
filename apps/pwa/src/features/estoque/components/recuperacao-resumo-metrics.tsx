import { BarChart3 } from 'lucide-react';

import type { RecuperacaoResumo } from '../types/recuperacao.schema';

interface RecuperacaoResumoMetricsProps {
  resumo: RecuperacaoResumo;
}

export function RecuperacaoResumoMetrics({
  resumo,
}: RecuperacaoResumoMetricsProps) {
  return (
    <div className="rounded-xl border border-outline-variant bg-card p-6 shadow-sm md:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-secondary" aria-hidden />
        <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
          Métricas da Demanda
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        <div className="flex flex-col">
          <span className="text-body-sm text-on-surface-variant">
            Total de Itens (SKUs)
          </span>
          <span className="text-headline-md font-semibold text-on-surface">
            {resumo.totalSkus} SKUs
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-body-sm text-on-surface-variant">
            Total de Unidades
          </span>
          <span className="text-headline-md font-semibold text-on-surface">
            {resumo.totalUnidades} unidades
          </span>
        </div>
        <div className="flex flex-col col-span-2">
          <span className="text-body-sm text-on-surface-variant">
            Total Recuperado
          </span>
          <span className="text-headline-md font-bold text-secondary">
            {resumo.totalRecuperado} unidades
          </span>
        </div>
        <div className="col-span-2 flex flex-col">
          <span className="text-body-sm text-on-surface-variant">
            Eficiência Global
          </span>
          <span className="text-headline-md font-semibold text-on-surface">
            {resumo.eficienciaPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
