import { cn } from '@lilog/ui';

import {
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  distribuicaoLabelClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type { TransporteExpedicao } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

const PRIORIDADE_LABEL: Record<TransporteExpedicao['prioridade'], string> = {
  critica: 'Crítica',
  alta: 'Alta',
  normal: 'Normal',
  baixa: 'Baixa',
};

const STATUS_LABEL: Record<TransporteExpedicao['status'], string> = {
  pendente: 'Pendente',
  em_distribuicao: 'Em distribuição',
  distribuido: 'Distribuído',
  em_separacao: 'Em separação',
};

export type TransporteExpandidoDetalheProps = {
  transporte: TransporteExpedicao;
};

export function TransporteExpandidoDetalhe({
  transporte,
}: TransporteExpandidoDetalheProps) {
  return (
    <div className="space-y-4 bg-surface-low/50 px-4 py-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className={distribuicaoLabelClassName}>Mapas de separação</p>
          <p className="font-mono text-sm tabular-nums">{transporte.totalMapas}</p>
        </div>
        <div>
          <p className={distribuicaoLabelClassName}>SKUs totais</p>
          <p className="font-mono text-sm tabular-nums">{transporte.totalSkus}</p>
        </div>
        <div>
          <p className={distribuicaoLabelClassName}>Saída prevista</p>
          <p className="font-mono text-sm">{transporte.horarioSaida}</p>
        </div>
        <div>
          <p className={distribuicaoLabelClassName}>Docas sugeridas</p>
          <p className="font-mono text-sm">{transporte.docasSugeridas.join(', ')}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant/50">
        <table className={compactTableClassName}>
          <thead>
            <tr className={compactTableHeadRowClassName}>
              <th className={compactTableHeadCellClassName()}>Mapa</th>
              <th className={compactTableHeadCellClassName()}>Empresa</th>
              <th className={compactTableHeadCellClassName()}>Categoria</th>
              <th className={compactTableHeadCellClassName()}>Peso</th>
              <th className={compactTableHeadCellClassName()}>Caixas</th>
              <th className={compactTableHeadCellClassName()}>Carros</th>
              <th className={compactTableHeadCellClassName()}>Pedidos</th>
              <th className={compactTableHeadCellClassName()}>SKUs</th>
            </tr>
          </thead>
          <tbody>
            {transporte.mapas.map((mapa) => (
              <tr key={mapa.id} className={compactTableRowClassName}>
                <td className={cn(compactTableCellClassName, 'font-mono')}>
                  {mapa.numero}
                </td>
                <td className={compactTableCellClassName}>{mapa.empresa}</td>
                <td className={compactTableCellClassName}>{mapa.categoria}</td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {mapa.pesoTotalKg.toLocaleString('pt-BR')} kg
                </td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {mapa.caixas}
                </td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {mapa.carros}
                </td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {mapa.pedidos.length}
                </td>
                <td className={cn(compactTableCellClassName, 'tabular-nums')}>
                  {mapa.totalSkus}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { PRIORIDADE_LABEL, STATUS_LABEL };
