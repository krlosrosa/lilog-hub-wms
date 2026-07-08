'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { DebitoFiltroStatus } from '../types/debito.types';
import { DebitoStatusBadge } from './debito-status-badge';
import { formatData, formatMoeda } from '../types/debito.types';
import type { ProcessoDebitoListItem } from '../types/debito.types';

const FILTROS: Array<{ id: DebitoFiltroStatus; label: string }> = [
  { id: 'abertos', label: 'Abertos' },
  { id: 'em_analise', label: 'Em análise' },
  { id: 'encerrados', label: 'Encerrados' },
  { id: 'todos', label: 'Todos' },
];

type DebitosTableProps = {
  filtro: DebitoFiltroStatus;
  onFiltroChange: (filtro: DebitoFiltroStatus) => void;
  processos: ProcessoDebitoListItem[];
  isLoading: boolean;
  error: string | null;
};

export function DebitosTable({
  filtro,
  onFiltroChange,
  processos,
  isLoading,
  error,
}: DebitosTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFiltroChange(item.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filtro === item.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Demanda</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Itens</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Carregando débitos…
                  </td>
                </tr>
              ) : processos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    Nenhum débito encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                processos.map((processo) => (
                  <tr
                    key={processo.id}
                    className={cn(
                      'border-b border-border/40 transition-colors hover:bg-muted/30',
                      processo.status === 'aberto' && 'bg-amber-500/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {processo.codigoDemanda}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {processo.unidadeId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DebitoStatusBadge status={processo.status} />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoeda(processo.valorTotal)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {processo.quantidadeItens}
                      <span className="text-xs">
                        {' '}
                        ({processo.quantidadeItensFalta} falta /{' '}
                        {processo.quantidadeItensAvaria} avaria)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatData(processo.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/debitos/${processo.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Ver
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
