'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';
import { MoreVertical } from 'lucide-react';

import { DebitoStatusBadge } from '@/features/debito-transportadora/components/debito-status-badge';
import type {
  DebitoOcorrencia,
  DebitoTipo,
} from '@/features/debito-transportadora/types/debito.schema';
import { DEBITO_TIPO_LABELS } from '@/features/debito-transportadora/types/debito.schema';

const TABLE_HEADERS = [
  { label: '', className: 'w-8' },
  { label: 'Protocolo', className: 'min-w-[120px]' },
  { label: 'Transportadora', className: 'min-w-[100px]' },
  { label: 'NF', className: 'hidden md:table-cell' },
  { label: 'Tipo', className: 'w-16' },
  { label: 'Valor (R$)', className: 'w-24 text-right' },
  { label: 'Status', className: 'min-w-[90px]' },
  { label: 'Aging', className: 'w-14 text-right' },
  { label: '', className: 'w-8 text-center' },
] as const;

type DebitoTableProps = {
  items: DebitoOcorrencia[];
  selectedIds: Set<string>;
  podeSelecionar: (item: DebitoOcorrencia) => boolean;
  onToggleSelect: (item: DebitoOcorrencia) => void;
  onToggleSelectAll: (items: DebitoOcorrencia[]) => void;
};

function formatValor(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TipoBadge({ tipo }: { tipo: DebitoTipo }) {
  const isAvaria = tipo === 'avaria';
  const isMisto = tipo === 'misto';

  return (
    <span
      className={cn(
        'rounded border px-1.5 py-0 text-[9px] font-semibold uppercase',
        isAvaria
          ? 'border-destructive/20 bg-destructive/10 text-destructive'
          : isMisto
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-secondary/20 bg-secondary-container/10 text-secondary',
      )}
    >
      {DEBITO_TIPO_LABELS[tipo]}
    </span>
  );
}

export function DebitoTable({
  items,
  selectedIds,
  podeSelecionar,
  onToggleSelect,
  onToggleSelectAll,
}: DebitoTableProps) {
  const router = useRouter();

  const elegiveis = items.filter(podeSelecionar);
  const todosElegiveisSelecionados =
    elegiveis.length > 0 && elegiveis.every((item) => selectedIds.has(item.id));
  const algunsSelecionados =
    elegiveis.some((item) => selectedIds.has(item.id)) &&
    !todosElegiveisSelecionados;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
            {TABLE_HEADERS.map((header, index) => (
              <th
                key={header.label || `col-${index}`}
                className={cn(
                  'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                  header.className,
                )}
              >
                {index === 0 ? (
                  <input
                    type="checkbox"
                    checked={todosElegiveisSelecionados}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = algunsSelecionados;
                      }
                    }}
                    disabled={elegiveis.length === 0}
                    onChange={() => onToggleSelectAll(items)}
                    aria-label="Selecionar todas as ocorrências aprovadas da página"
                    className="size-3.5 cursor-pointer rounded border-outline-variant accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  header.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {items.length ? (
            items.map((item) => {
              const selecionavel = podeSelecionar(item);
              const selecionado = selectedIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={cn(
                    'group cursor-pointer transition-colors hover:bg-surface-highest/50',
                    selecionado && 'bg-primary/5',
                  )}
                  onClick={() =>
                    router.push(`/debito-transportadora/${item.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/debito-transportadora/${item.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Ver detalhes de ${item.protocolo}`}
                >
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={selecionado}
                      disabled={!selecionavel}
                      title={
                        selecionavel
                          ? 'Incluir em documento de cobrança'
                          : 'Apenas ocorrências aprovadas podem ser incluídas em um documento'
                      }
                      onChange={() => onToggleSelect(item)}
                      onClick={(event) => event.stopPropagation()}
                      aria-label={`Selecionar ${item.protocolo}`}
                      className="size-3.5 cursor-pointer rounded border-outline-variant accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-foreground">
                    {item.protocolo}
                  </td>
                  <td className="max-w-[140px] truncate px-2 py-1.5 font-medium text-foreground">
                    {item.transportadora}
                  </td>
                  <td className="hidden px-2 py-1.5 font-mono text-[11px] text-muted-foreground md:table-cell">
                    {item.nfOrigem}
                  </td>
                  <td className="px-2 py-1.5">
                    <TipoBadge tipo={item.tipo} />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-foreground">
                    {formatValor(item.valor)}
                  </td>
                  <td className="px-2 py-1.5">
                    <DebitoStatusBadge status={item.status} compact />
                  </td>
                  <td
                    className={cn(
                      'px-2 py-1.5 text-right tabular-nums text-[11px]',
                      item.agingDias >= 30
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {item.agingDias}d
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-primary"
                      aria-label={`Mais ações para ${item.protocolo}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="mx-auto size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className="px-2 py-12 text-center text-xs text-muted-foreground"
              >
                Nenhuma ocorrência encontrada para os filtros aplicados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
