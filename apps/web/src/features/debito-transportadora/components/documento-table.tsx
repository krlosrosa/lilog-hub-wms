'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@lilog/ui';
import { ChevronRight } from 'lucide-react';

import { DocumentoStatusBadge } from '@/features/debito-transportadora/components/documento-status-badge';
import type { DocumentoCobrancaListItem } from '@/features/debito-transportadora/types/documento-cobranca.schema';

const TABLE_HEADERS = [
  { label: 'Número', className: 'min-w-[120px]' },
  { label: 'Transportadora', className: 'min-w-[100px]' },
  { label: 'Processos', className: 'w-16 text-center' },
  { label: 'Itens', className: 'w-14 text-center hidden sm:table-cell' },
  { label: 'Valor (R$)', className: 'w-24 text-right' },
  { label: 'Status', className: 'min-w-[90px]' },
  { label: 'Criado em', className: 'hidden md:table-cell min-w-[100px]' },
  { label: '', className: 'w-8 text-center' },
] as const;

type DocumentoTableProps = {
  items: DocumentoCobrancaListItem[];
};

function formatValor(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DocumentoTable({ items }: DocumentoTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header.label || 'actions'}
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
          {items.length ? (
            items.map((item) => (
              <tr
                key={item.id}
                className="group cursor-pointer transition-colors hover:bg-surface-highest/50"
                onClick={() =>
                  router.push(`/debito-transportadora/cobrancas/${item.id}`)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/debito-transportadora/cobrancas/${item.id}`);
                  }
                }}
                tabIndex={0}
                role="link"
                aria-label={`Ver documento ${item.numeroDocumento}`}
              >
                <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-foreground">
                  {item.numeroDocumento}
                </td>
                <td className="max-w-[140px] truncate px-2 py-1.5 font-medium text-foreground">
                  {item.transportadora}
                </td>
                <td className="px-2 py-1.5 text-center tabular-nums text-muted-foreground">
                  {item.quantidadeProcessos}
                </td>
                <td className="hidden px-2 py-1.5 text-center tabular-nums text-muted-foreground sm:table-cell">
                  {item.quantidadeItens}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-foreground">
                  {formatValor(item.valorTotal)}
                </td>
                <td className="px-2 py-1.5">
                  <DocumentoStatusBadge status={item.status} compact />
                </td>
                <td className="hidden px-2 py-1.5 text-[11px] text-muted-foreground md:table-cell">
                  {item.createdAt}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <ChevronRight
                    className="mx-auto size-3.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100"
                    aria-hidden
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={TABLE_HEADERS.length}
                className="px-2 py-12 text-center text-xs text-muted-foreground"
              >
                Nenhum documento de cobrança encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
