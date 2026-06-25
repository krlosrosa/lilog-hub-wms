'use client';

import { Button, cn } from '@lilog/ui';
import { Download, Loader2, Package, Scissors } from 'lucide-react';

import type {
  DebitoMapaSeparacao,
  DebitoRegistroCorte,
  DebitoRegistroCorteStatus,
} from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_REGISTRO_CORTE_STATUS_LABELS } from '@/features/debito-transportadora/types/debito.schema';

const TABLE_HEADERS = [
  { label: 'Código', className: 'min-w-[90px]' },
  { label: 'Data / Hora', className: 'hidden md:table-cell min-w-[120px]' },
  { label: 'Rota', className: 'min-w-[80px]' },
  { label: 'Doca', className: 'w-14' },
  { label: 'Vol.', className: 'w-12 text-center' },
  { label: 'Peso', className: 'w-14 text-center' },
  { label: 'Separador', className: 'hidden lg:table-cell' },
  { label: 'Status', className: 'w-20 text-center' },
] as const;

const COMPACT_STATUS_LABELS: Record<DebitoRegistroCorteStatus, string> = {
  concluido: 'Concl.',
  em_andamento: 'Andam.',
  cancelado: 'Cancel.',
};

type DetalheRegistrosCorteProps = {
  registros: readonly DebitoRegistroCorte[];
  mapaSeparacao: DebitoMapaSeparacao;
  baixandoMapa: boolean;
  onBaixarMapa: () => void;
};

const STATUS_STYLES: Record<DebitoRegistroCorteStatus, string> = {
  concluido:
    'border-status-active/30 bg-status-active/10 text-status-active',
  em_andamento: 'border-primary/30 bg-primary/10 text-primary',
  cancelado: 'border-muted bg-muted/30 text-muted-foreground',
};

export function DetalheRegistrosCorte({
  registros,
  mapaSeparacao,
  baixandoMapa,
  onBaixarMapa,
}: DetalheRegistrosCorteProps) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass"
      aria-labelledby="titulo-registros-corte"
    >
      <div className="flex flex-col gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2
            id="titulo-registros-corte"
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
          >
            <Scissors className="size-3.5 text-primary" aria-hidden />
            Registros de Corte
          </h2>
          <p className="mt-0.5 max-w-xl text-[11px] text-muted-foreground">
            Histórico de cortes e separações vinculados ao transporte.
          </p>
        </div>

        <div className="flex min-w-[14rem] flex-col gap-2 rounded-lg border border-outline-variant bg-surface p-2.5 lg:min-w-[16rem]">
          <div className="flex items-start gap-2">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Package className="size-3.5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mapa de Separação
              </p>
              <p className="font-mono text-[11px] font-semibold text-foreground">
                {mapaSeparacao.codigo}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {mapaSeparacao.geradoEm} · {mapaSeparacao.totalItens} itens ·{' '}
                {mapaSeparacao.totalVolumes} vol.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-[11px]"
            disabled={baixandoMapa}
            onClick={onBaixarMapa}
          >
            {baixandoMapa ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Gerando PDF…
              </>
            ) : (
              <>
                <Download className="size-3" aria-hidden />
                Baixar mapa (PDF)
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header.label}
                  scope="col"
                  className={cn(
                    'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                    header.className,
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {registros.length ? (
              registros.map((registro) => (
                <tr
                  key={registro.id}
                  className="transition-colors hover:bg-surface-highest/50"
                >
                  <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-foreground">
                    {registro.codigo}
                  </td>
                  <td className="hidden px-2 py-1.5 text-[10px] text-muted-foreground md:table-cell">
                    {registro.dataHora}
                  </td>
                  <td className="max-w-[100px] truncate px-2 py-1.5 text-[11px] text-foreground">
                    {registro.rota}
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-foreground">
                    {registro.doca}
                  </td>
                  <td className="px-2 py-1.5 text-center text-[11px] font-semibold tabular-nums text-foreground">
                    {registro.totalVolumes}
                  </td>
                  <td className="px-2 py-1.5 text-center text-[11px] font-semibold tabular-nums text-foreground">
                    {registro.pesoKg.toLocaleString('pt-BR')}
                  </td>
                  <td className="hidden px-2 py-1.5 text-[11px] text-foreground lg:table-cell">
                    {registro.separador}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={cn(
                        'inline-flex rounded border px-1.5 py-0 text-[9px] font-semibold',
                        STATUS_STYLES[registro.status],
                      )}
                      title={DEBITO_REGISTRO_CORTE_STATUS_LABELS[registro.status]}
                    >
                      {COMPACT_STATUS_LABELS[registro.status]}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={TABLE_HEADERS.length}
                  className="px-2 py-12 text-center text-xs text-muted-foreground"
                >
                  Nenhum registro de corte vinculado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
