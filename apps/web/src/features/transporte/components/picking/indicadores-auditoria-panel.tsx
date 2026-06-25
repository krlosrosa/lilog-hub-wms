'use client';

import { cn } from '@lilog/ui';
import { BarChart3, History } from 'lucide-react';

import {
  ESTRATEGIA_LABELS,
  TIPO_AUDITORIA_LABELS,
  type IndicadoresOperacionais,
  type RegistroAuditoria,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

type IndicadoresAuditoriaPanelProps = {
  indicadores: IndicadoresOperacionais;
  auditoria: RegistroAuditoria[];
};

export function IndicadoresAuditoriaPanel({
  indicadores,
  auditoria,
}: IndicadoresAuditoriaPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className={cn(panelClassName, 'space-y-4 p-5')}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart3 className="size-4 text-primary" aria-hidden />
          Indicadores Operacionais
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <IndicadorChip
            label="Mapas gerados (período)"
            value={String(indicadores.mapasGeradosPeriodo)}
          />
          <IndicadorChip
            label="Linhas / mapa"
            value={indicadores.linhasSeparadasPorMapa.toFixed(1)}
          />
          <IndicadorChip
            label="Tempo médio (min)"
            value={String(indicadores.tempoMedioExecucaoMin)}
          />
          <IndicadorChip
            label="Produtividade operador"
            value={`${indicadores.produtividadeOperador} lin/h`}
          />
          <IndicadorChip
            label="Taxa conclusão"
            value={`${indicadores.taxaConclusao}%`}
            highlight
          />
          <IndicadorChip
            label="Taxa divergências"
            value={`${indicadores.taxaDivergencias}%`}
          />
          <IndicadorChip
            label="Distância média / mapa"
            value={`${indicadores.distanciaMediaPorMapa}m`}
          />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Produtividade por estratégia
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(indicadores.produtividadePorEstrategia).map(
              ([estrategia, valor]) => (
                <span
                  key={estrategia}
                  className="rounded bg-surface-high px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                >
                  {ESTRATEGIA_LABELS[estrategia as keyof typeof ESTRATEGIA_LABELS]}:{' '}
                  {valor} lin/h
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={cn(panelClassName, 'space-y-4 p-5')}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="size-4 text-primary" aria-hidden />
          Auditoria
        </h2>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {auditoria.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum registro de auditoria ainda.
            </p>
          ) : (
            auditoria.map((registro) => (
              <div
                key={registro.id}
                className="rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    {registro.descricao}
                  </p>
                  <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {TIPO_AUDITORIA_LABELS[registro.tipo]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {registro.usuario} ·{' '}
                  {new Date(registro.dataHora).toLocaleString('pt-BR')}
                </p>
                {registro.detalhes && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {registro.detalhes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function IndicadorChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-low/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-lg font-bold',
          highlight ? 'text-tertiary' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}
