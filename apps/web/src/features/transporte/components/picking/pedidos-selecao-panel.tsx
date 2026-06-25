'use client';

import { cn } from '@lilog/ui';
import { Package, Search } from 'lucide-react';

import {
  PRIORIDADE_LABELS,
  TIPO_PEDIDO_LABELS,
  type FiltrosPedidoPicking,
  type PedidoPicking,
  type ResumoSelecaoPedidos,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

const fieldInputClassName = cn(
  'rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type PedidosSelecaoPanelProps = {
  pedidos: PedidoPicking[];
  filtros: FiltrosPedidoPicking;
  selecionados: Set<string>;
  resumo: ResumoSelecaoPedidos;
  rotas: string[];
  transportadoras: string[];
  clientes: string[];
  centros: string[];
  onFiltrosChange: (filtros: FiltrosPedidoPicking) => void;
  onTogglePedido: (id: string) => void;
  onToggleTodos: (ids: string[]) => void;
};

function PrioridadeBadge({ prioridade }: { prioridade: PedidoPicking['prioridade'] }) {
  const cores = {
    urgente: 'bg-destructive/15 text-destructive',
    alta: 'bg-tertiary/15 text-tertiary',
    normal: 'bg-primary/10 text-primary',
    baixa: 'bg-muted text-muted-foreground',
  };

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
        cores[prioridade],
      )}
    >
      {PRIORIDADE_LABELS[prioridade]}
    </span>
  );
}

export function PedidosSelecaoPanel({
  pedidos,
  filtros,
  selecionados,
  resumo,
  rotas,
  transportadoras,
  clientes,
  centros,
  onFiltrosChange,
  onTogglePedido,
  onToggleTodos,
}: PedidosSelecaoPanelProps) {
  const todosSelecionados =
    pedidos.length > 0 && pedidos.every((p) => selecionados.has(p.id));

  return (
    <section className={cn(panelClassName, 'space-y-4 p-5')}>
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Search className="size-4 text-primary" aria-hidden />
          Seleção de Pedidos
        </h2>
        <span className="text-xs text-muted-foreground">
          {pedidos.length} pedido(s) encontrado(s)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <input
            type="search"
            value={filtros.busca}
            onChange={(e) =>
              onFiltrosChange({ ...filtros, busca: e.target.value })
            }
            placeholder="Buscar por NF, cliente, rota..."
            className={cn(fieldInputClassName, 'w-full pr-10')}
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <select
          value={filtros.rota}
          onChange={(e) =>
            onFiltrosChange({ ...filtros, rota: e.target.value })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todas as rotas</option>
          {rotas.map((rota) => (
            <option key={rota} value={rota}>
              {rota}
            </option>
          ))}
        </select>
        <select
          value={filtros.transportadora}
          onChange={(e) =>
            onFiltrosChange({ ...filtros, transportadora: e.target.value })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todas transportadoras</option>
          {transportadoras.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filtros.cliente}
          onChange={(e) =>
            onFiltrosChange({ ...filtros, cliente: e.target.value })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todos os clientes</option>
          {clientes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filtros.prioridade}
          onChange={(e) =>
            onFiltrosChange({
              ...filtros,
              prioridade: e.target.value as FiltrosPedidoPicking['prioridade'],
            })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todas prioridades</option>
          {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filtros.tipoPedido}
          onChange={(e) =>
            onFiltrosChange({
              ...filtros,
              tipoPedido: e.target.value as FiltrosPedidoPicking['tipoPedido'],
            })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todos os tipos</option>
          {Object.entries(TIPO_PEDIDO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filtros.centroDistribuicao}
          onChange={(e) =>
            onFiltrosChange({
              ...filtros,
              centroDistribuicao: e.target.value,
            })
          }
          className={fieldInputClassName}
        >
          <option value="todos">Todos os CDs</option>
          {centros.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filtros.dataExpedicao}
          onChange={(e) =>
            onFiltrosChange({ ...filtros, dataExpedicao: e.target.value })
          }
          className={fieldInputClassName}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiChip label="Pedidos" value={String(resumo.qtdPedidos)} highlight />
        <KpiChip label="Linhas" value={String(resumo.qtdLinhas)} />
        <KpiChip label="Volumes" value={String(resumo.qtdVolumes)} accent="tertiary" />
        <KpiChip label="Peso (kg)" value={String(resumo.pesoTotal)} accent="secondary" />
        <KpiChip label="Vol (m³)" value={resumo.volumeTotal.toFixed(1)} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-low/60">
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  onChange={() =>
                    onToggleTodos(pedidos.map((p) => p.id))
                  }
                  className="size-3.5 accent-primary"
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-3 py-2 text-left font-semibold">NF</th>
              <th className="px-3 py-2 text-left font-semibold">Cliente</th>
              <th className="px-3 py-2 text-left font-semibold">Rota</th>
              <th className="px-3 py-2 text-left font-semibold">Prioridade</th>
              <th className="px-3 py-2 text-left font-semibold">Tipo</th>
              <th className="px-3 py-2 text-right font-semibold">Linhas</th>
              <th className="px-3 py-2 text-right font-semibold">Peso</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  <Package className="mx-auto mb-2 size-6 opacity-40" />
                  Nenhum pedido encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr
                  key={pedido.id}
                  className={cn(
                    'border-b border-outline-variant/50 transition-colors',
                    selecionados.has(pedido.id) && 'bg-primary/5',
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selecionados.has(pedido.id)}
                      onChange={() => onTogglePedido(pedido.id)}
                      className="size-3.5 accent-primary"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono">{pedido.numeroNF}</td>
                  <td className="px-3 py-2">{pedido.cliente}</td>
                  <td className="px-3 py-2">{pedido.rota}</td>
                  <td className="px-3 py-2">
                    <PrioridadeBadge prioridade={pedido.prioridade} />
                  </td>
                  <td className="px-3 py-2">
                    {TIPO_PEDIDO_LABELS[pedido.tipoPedido]}
                  </td>
                  <td className="px-3 py-2 text-right">{pedido.qtdLinhas}</td>
                  <td className="px-3 py-2 text-right">{pedido.peso}kg</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function KpiChip({
  label,
  value,
  highlight,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: 'tertiary' | 'secondary';
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-low/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-xl font-bold',
          highlight && 'text-primary',
          accent === 'tertiary' && 'text-tertiary',
          accent === 'secondary' && 'text-secondary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
