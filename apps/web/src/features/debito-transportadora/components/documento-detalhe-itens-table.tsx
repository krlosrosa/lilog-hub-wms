'use client';

import Link from 'next/link';

import { cn } from '@lilog/ui';

import { DOCUMENTO_TIPO_LABELS } from '@/features/debito-transportadora/types/documento-cobranca.schema';
import type { DocumentoCobrancaItem } from '@/features/debito-transportadora/types/documento-cobranca.schema';

type DocumentoDetalheItensTableProps = {
  itens: DocumentoCobrancaItem[];
};

function formatValor(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarProtocolo(codigo: string) {
  return codigo.startsWith('#') ? codigo : `#${codigo}`;
}

export function DocumentoDetalheItensTable({
  itens,
}: DocumentoDetalheItensTableProps) {
  const agrupados = itens.reduce<
    Map<
      string,
      {
        processoDebitoId: string;
        codigoDemanda: string;
        itens: DocumentoCobrancaItem[];
        subtotal: number;
      }
    >
  >((acc, item) => {
    const existente = acc.get(item.processoDebitoId);

    if (existente) {
      existente.itens.push(item);
      existente.subtotal += item.valorDebito;
      return acc;
    }

    acc.set(item.processoDebitoId, {
      processoDebitoId: item.processoDebitoId,
      codigoDemanda: item.codigoDemanda,
      itens: [item],
      subtotal: item.valorDebito,
    });

    return acc;
  }, new Map());

  const grupos = [...agrupados.values()];

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass">
      <div className="border-b border-outline-variant bg-surface-low px-4 py-3">
        <h3 className="text-label-md font-semibold text-foreground">
          Ocorrências incluídas
        </h3>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {grupos.length} processo(s) · {itens.length} item(ns)
        </p>
      </div>

      <div className="divide-y divide-outline-variant/30">
        {grupos.length ? (
          grupos.map((grupo) => (
            <div key={grupo.processoDebitoId} className="px-4 py-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/debito-transportadora/${grupo.processoDebitoId}`}
                  className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                  {formatarProtocolo(grupo.codigoDemanda)}
                </Link>
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  R$ {formatValor(grupo.subtotal)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="pb-1 pr-2 font-medium">SKU</th>
                      <th className="pb-1 pr-2 font-medium">Tipo</th>
                      <th className="pb-1 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-0.5 pr-2 font-mono text-foreground">
                          {item.sku ?? '—'}
                        </td>
                        <td className="py-0.5 pr-2">
                          <span
                            className={cn(
                              'rounded border px-1 py-0 text-[9px] font-semibold uppercase',
                              item.tipo === 'avaria'
                                ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                : item.tipo === 'falta'
                                  ? 'border-secondary/20 bg-secondary-container/10 text-secondary'
                                  : 'border-primary/20 bg-primary/10 text-primary',
                            )}
                          >
                            {DOCUMENTO_TIPO_LABELS[item.tipo]}
                          </span>
                        </td>
                        <td className="py-0.5 text-right tabular-nums text-foreground">
                          {formatValor(item.valorDebito)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Nenhum item vinculado a este documento.
          </p>
        )}
      </div>
    </article>
  );
}
