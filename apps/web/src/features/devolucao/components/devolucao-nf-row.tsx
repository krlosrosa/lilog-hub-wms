'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock,
  Route,
  X,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { NfItemStatusBadge } from '@/features/devolucao/components/devolucao-status-badge';
import type { NfRow } from '@/features/devolucao/types/devolucao-checkin.schema';
import {
  MOTIVOS_DEVOLUCAO,
  NF_TIPO_LABELS,
} from '@/features/devolucao/types/devolucao-checkin.schema';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const qtyInputClassName =
  'w-16 rounded border border-outline-variant bg-background px-1.5 py-1 text-center font-mono text-caption tabular-nums focus:outline-none focus:ring-2 focus:ring-primary';

export const NF_TABLE_COLSPAN = 8;

type DevolucaoNfRowProps = {
  nf: NfRow;
  isExpanded: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  onResolver?: () => void;
  onRemover?: () => void;
  onUpdateItemQtdDevolucao?: (itemId: string, value: number) => void;
  onUpdateMotivo?: (motivo: string) => void;
  onValidar?: () => void;
};

function NfStatusIcon({ status }: { status: NfRow['status'] }) {
  if (status === 'validado') {
    return <CheckCircle2 className="size-4 text-tertiary" aria-hidden />;
  }
  if (status === 'divergente') {
    return <CircleAlert className="size-4 text-destructive" aria-hidden />;
  }
  return <Clock className="size-4 text-muted-foreground opacity-30" aria-hidden />;
}

export function DevolucaoNfRow({
  nf,
  isExpanded,
  isLoading = false,
  onToggle,
  onResolver,
  onRemover,
  onUpdateItemQtdDevolucao,
  onUpdateMotivo,
  onValidar,
}: DevolucaoNfRowProps) {
  const progressPercent =
    nf.itensTotal > 0
      ? Math.round((nf.itensValidados / nf.itensTotal) * 100)
      : 0;
  const progressColor =
    nf.status === 'divergente'
      ? 'bg-destructive'
      : nf.status === 'validado'
        ? 'bg-tertiary'
        : 'bg-secondary';
  const isValidado = nf.status === 'validado';

  return (
    <>
      <tr className="transition-colors hover:bg-muted/30">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground transition-colors hover:text-primary"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Recolher NF' : 'Expandir NF'}
            disabled={nf.itens.length === 0}
          >
            {nf.itens.length > 0 ? (
              isExpanded ? (
                <ChevronUp className="size-5" />
              ) : (
                <ChevronDown className="size-5" />
              )
            ) : (
              <span className="inline-block size-5" aria-hidden />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-foreground">{nf.numero}</span>
              <NfStatusIcon status={nf.status} />
            </div>
            {nf.viagemOrigemLabel && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                <Route className="size-3" aria-hidden />
                {nf.viagemOrigemLabel}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-label-md">{nf.cliente}</td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
              nf.tipoDevolucao === 'parcial'
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {NF_TIPO_LABELS[nf.tipoDevolucao]}
          </span>
        </td>
        <td className="px-4 py-3">
          {onUpdateMotivo && !isValidado ? (
            <select
              value={nf.motivo}
              onChange={(e) => onUpdateMotivo(e.target.value)}
              className="w-full min-w-[140px] rounded border border-outline-variant bg-background px-2 py-1.5 text-caption focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Motivo do retorno da NF ${nf.numero}`}
            >
              <option value="">Selecione...</option>
              {MOTIVOS_DEVOLUCAO.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={cn(
                'text-caption',
                nf.status === 'divergente' && 'text-destructive',
              )}
            >
              {nf.motivo || '—'}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-[11px] font-mono',
                nf.status === 'divergente'
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {nf.itensValidados} de {nf.itensTotal} itens
            </span>
            <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className={cn('h-full rounded-full', progressColor)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-caption">
          {currency.format(nf.valorTotal)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            {nf.viagemOrigemId && onRemover && !isValidado && (
              <button
                type="button"
                onClick={onRemover}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remover NF de outra viagem"
              >
                <X className="size-4" />
              </button>
            )}
            {isValidado ? (
              <span className="text-caption font-bold text-tertiary">
                VALIDADO
              </span>
            ) : (
              <Button
                type="button"
                size="sm"
                className="h-7 text-[11px] font-bold"
                disabled={isLoading || !nf.motivo.trim()}
                onClick={onValidar}
              >
                Validar
              </Button>
            )}
          </div>
        </td>
      </tr>

      {isExpanded && nf.itens.length > 0 && (
        <tr className="bg-muted/20">
          <td colSpan={NF_TABLE_COLSPAN} className="p-0">
            <div className="border-l-4 border-primary p-6">
              <h4 className="mb-4 flex items-center gap-2 text-label-md font-bold text-primary">
                Detalhamento dos Itens da NF
              </h4>
              <table className="w-full border-collapse text-caption">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium uppercase">
                      SKU / Produto
                    </th>
                    <th className="px-4 py-2 text-center font-medium uppercase">
                      Qtd NF
                    </th>
                    <th className="px-4 py-2 text-center font-medium uppercase">
                      Qtd Dev.
                    </th>
                    <th className="px-4 py-2 text-center font-medium uppercase">
                      Qtd Conf.
                    </th>
                    <th className="px-4 py-2 text-right font-medium uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {nf.itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.produto}</span>
                          <span className="text-[10px] opacity-50">
                            SKU: {item.sku}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.qtdNf} un
                      </td>
                      <td className="px-4 py-3 text-center">
                        {onUpdateItemQtdDevolucao && !isValidado ? (
                          <input
                            type="number"
                            min={0}
                            max={item.qtdNf}
                            value={item.qtdDevolucao}
                            onChange={(e) =>
                              onUpdateItemQtdDevolucao(
                                item.id,
                                Number(e.target.value),
                              )
                            }
                            className={qtyInputClassName}
                            aria-label={`Quantidade devolvida de ${item.produto}`}
                          />
                        ) : (
                          <span className="font-mono">{item.qtdDevolucao} un</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        {item.qtdConferida} un
                      </td>
                      <td className="px-4 py-3 text-right">
                        <NfItemStatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}

      {isExpanded && nf.divergenciaCritica && nf.mensagemDivergencia && (
        <tr className="bg-muted/20">
          <td colSpan={NF_TABLE_COLSPAN} className="p-0">
            <div className="border-l-4 border-destructive p-6">
              <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <AlertTriangle
                  className="size-5 shrink-0 text-destructive"
                  aria-hidden
                />
                <div className="flex-1">
                  <p className="text-caption font-bold text-destructive">
                    Divergência Crítica
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {nf.mensagemDivergencia}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 text-[10px] font-bold"
                  onClick={onResolver}
                >
                  Resolver
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
