'use client';

import { cn } from '@lilog/ui';

import { EquilibrioIndicador } from '@/features/distribuicao-demandas/components/equilibrio-indicador';
import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type {
  Doca,
  Operador,
  TransporteExpedicao,
  Workload,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export type WorkloadResumoPanelProps = {
  transportes: TransporteExpedicao[];
  workloads: Workload[];
  docas: Doca[];
  operadores: Operador[];
  workloadPreviewId: string | null;
  onSelectWorkload: (workloadId: string) => void;
  className?: string;
};

function formatKg(value: number) {
  return `${value.toLocaleString('pt-BR')} kg`;
}

export function WorkloadResumoPanel({
  transportes,
  workloads,
  docas,
  operadores,
  workloadPreviewId,
  onSelectWorkload,
  className,
}: WorkloadResumoPanelProps) {
  const workload =
    workloads.find((w) => w.id === workloadPreviewId) ?? workloads[0] ?? null;

  const doca = docas.find((d) => d.id === workload?.docaId);
  const separadores = operadores.filter((o) =>
    workload?.separadorIds.includes(o.id),
  );
  const conferentes = operadores.filter((o) =>
    workload?.conferenteIds.includes(o.id),
  );
  const transportesNoWorkload = transportes.filter((t) =>
    workload?.transporteIds.includes(t.id),
  );

  return (
    <section
      className={cn(
        distribuicaoPanelClassName,
        'flex flex-col overflow-hidden',
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
        <div>
          <h2 className={distribuicaoSectionTitleClassName}>
            D — Resumo do workload
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Clique em um workload na simulação ou escolha abaixo
          </p>
        </div>
        {workloads.length > 0 ? (
          <select
            value={workload?.id ?? ''}
            onChange={(e) => onSelectWorkload(e.target.value)}
            className="min-w-[180px] rounded-md border border-outline-variant bg-surface-low px-3 py-2 text-sm"
          >
            {workloads.map((w) => {
              const docaWl = docas.find((d) => d.id === w.docaId);
              return (
                <option key={w.id} value={w.id}>
                  Doca {docaWl?.codigo ?? '—'} · WL {w.indice}/{workloads.length}
                </option>
              );
            })}
          </select>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {!workload ? (
          <p className="text-sm text-muted-foreground">
            Nenhum workload disponível. Configure docas e clique em Simular.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-lg font-semibold tracking-tight">
                  Workload {workload.indice}/{workloads.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Doca {doca?.codigo ?? '—'}
                  {doca?.ocupada ? ' · ocupada' : ' · disponível'}
                </p>
              </div>
              <EquilibrioIndicador
                status={workload.statusEquilibrio}
                desvioPercentual={workload.desvioPercentual}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {[
                { label: 'Transportes', value: String(workload.metricas.transportes) },
                { label: 'Mapas', value: String(workload.metricas.mapas) },
                { label: 'Peso', value: formatKg(workload.metricas.pesoKg) },
                { label: 'Caixas', value: String(workload.metricas.caixas) },
                { label: 'Paletes', value: String(workload.metricas.paletes) },
                { label: 'Carros', value: String(workload.metricas.carros) },
                { label: 'Score', value: String(workload.score) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-outline-variant/60 bg-surface-high/40 px-4 py-3"
                >
                  <p className={distribuicaoLabelClassName}>{item.label}</p>
                  <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-outline-variant/60 bg-surface-low/50 p-4">
                <p className={distribuicaoLabelClassName}>Equipe alocada</p>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Separadores:</span>{' '}
                    {separadores.length > 0
                      ? separadores.map((s) => s.nome).join(', ')
                      : '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Conferentes:</span>{' '}
                    {conferentes.length > 0
                      ? conferentes.map((c) => c.nome).join(', ')
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant/60 bg-surface-low/50 p-4">
                <p className={distribuicaoLabelClassName}>Totais do workload</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm tabular-nums">
                  <span className="text-muted-foreground">Empresas</span>
                  <span>
                    {[
                      ...new Set(
                        transportesNoWorkload.flatMap((t) =>
                          t.empresa === 'Multi'
                            ? t.mapas.map((m) => m.empresa)
                            : [t.empresa],
                        ),
                      ),
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </span>
                  <span className="text-muted-foreground">Saída mais cedo</span>
                  <span>
                    {transportesNoWorkload.length > 0
                      ? transportesNoWorkload
                          .map((t) => t.horarioSaida)
                          .sort()[0]
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className={cn(distribuicaoLabelClassName, 'mb-3')}>
                Transportes alocados ({transportesNoWorkload.length})
              </p>

              {transportesNoWorkload.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum transporte neste workload. Arraste transportes do pool
                  acima.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant bg-surface-high/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-semibold">Transporte</th>
                        <th className="px-4 py-3 font-semibold">Placa</th>
                        <th className="px-4 py-3 font-semibold">Empresa</th>
                        <th className="px-4 py-3 font-semibold">Mapas</th>
                        <th className="px-4 py-3 font-semibold">Peso</th>
                        <th className="px-4 py-3 font-semibold">Caixas</th>
                        <th className="px-4 py-3 font-semibold">Paletes</th>
                        <th className="px-4 py-3 font-semibold">Saída</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transportesNoWorkload.map((transporte) => (
                        <tr
                          key={transporte.id}
                          className="border-b border-outline-variant/40 last:border-0"
                        >
                          <td className="px-4 py-3 font-mono font-medium">
                            {transporte.codigo}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {transporte.placa}
                          </td>
                          <td className="px-4 py-3">{transporte.empresa}</td>
                          <td className="px-4 py-3 tabular-nums">
                            {transporte.totalMapas}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatKg(transporte.pesoTotalKg)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {transporte.caixas}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {transporte.totalPaletes}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {transporte.horarioSaida}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-surface-high/30 font-medium">
                        <td className="px-4 py-3" colSpan={3}>
                          Total
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {transportesNoWorkload.reduce(
                            (s, t) => s + t.totalMapas,
                            0,
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatKg(
                            transportesNoWorkload.reduce(
                              (s, t) => s + t.pesoTotalKg,
                              0,
                            ),
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {transportesNoWorkload.reduce((s, t) => s + t.caixas, 0)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {transportesNoWorkload.reduce(
                            (s, t) => s + t.totalPaletes,
                            0,
                          )}
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** @deprecated Use WorkloadResumoPanel */
export const PreviewImpressaoPanel = WorkloadResumoPanel;
