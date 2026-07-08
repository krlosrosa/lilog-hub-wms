'use client';

import { useRef } from 'react';

import { Button, cn } from '@lilog/ui';
import { FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';

import { useValorizacaoExcel } from '@/features/debito-transportadora/hooks/use-valorizacao-excel';
import type { DebitoConferenciaItem } from '@/features/debito-transportadora/types/debito.schema';

type DetalheValorizacaoExcelProps = {
  processoId: string;
  unidadeId: string | null;
  itens: readonly DebitoConferenciaItem[];
  onRefetch: () => Promise<void>;
  disabled?: boolean;
};

const HEADERS = [
  { label: 'SKU', className: 'min-w-[100px]' },
  { label: 'Produto', className: 'min-w-[160px]' },
  { label: 'Peso (kg)', className: 'w-24 text-right' },
  { label: 'Valor/KG', className: 'w-24 text-right' },
  { label: 'Valor Débito', className: 'w-28 text-right' },
  { label: 'Status', className: 'w-36' },
] as const;

function formatMoeda(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatPesoKg(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

export function DetalheValorizacaoExcel({
  processoId,
  unidadeId,
  itens,
  onRefetch,
  disabled = false,
}: DetalheValorizacaoExcelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    nomeArquivo,
    preview,
    resumo,
    isParsing,
    isSaving,
    temPreview,
    processarArquivo,
    aplicarValorizacao,
    limpar,
  } = useValorizacaoExcel({
    processoId,
    unidadeId,
    itens,
    onRefetch,
  });

  const bloqueado = disabled || isParsing || isSaving || !unidadeId;

  return (
    <section
      className="overflow-hidden rounded-lg border border-outline-variant/50 bg-glass-bg shadow-inner-glow backdrop-blur-glass"
      aria-labelledby="titulo-valorizacao-excel"
    >
      <div className="flex flex-col gap-2 border-b border-outline-variant bg-surface-low px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="titulo-valorizacao-excel"
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
        >
          <FileSpreadsheet className="size-3.5 text-primary" aria-hidden />
          Valorização via Excel
        </h2>
      </div>

      <div className="border-b border-outline-variant bg-surface-low px-3 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            disabled={bloqueado}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void processarArquivo(file);
              }

              event.target.value = '';
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bloqueado}
            className="gap-2 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            {isParsing ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-3.5" aria-hidden />
            )}
            Selecionar planilha
          </Button>

          {nomeArquivo ? (
            <div className="flex items-center gap-2 rounded-md border border-outline-variant/60 bg-surface px-2 py-1">
              <span className="max-w-[220px] truncate text-[11px] text-foreground">
                {nomeArquivo}
              </span>
              <button
                type="button"
                disabled={bloqueado}
                onClick={limpar}
                aria-label="Remover planilha selecionada"
                className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {temPreview ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                  {HEADERS.map((header) => (
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
                {preview.map((item) => (
                  <tr
                    key={item.itemId}
                    className={cn(
                      'transition-colors hover:bg-surface-highest/50',
                      !item.matched && 'bg-destructive/5',
                    )}
                  >
                    <td className="px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
                      {item.sku}
                    </td>
                    <td className="px-2 py-1.5">
                      <p className="truncate text-[11px] font-semibold text-foreground">
                        {item.produto}
                      </p>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[11px] text-foreground">
                      {item.pesoTotalKg != null
                        ? formatPesoKg(item.pesoTotalKg)
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[11px] text-foreground">
                      {item.valorPorKg != null
                        ? formatMoeda(item.valorPorKg)
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-[11px] font-semibold text-foreground">
                      {item.valorDebito != null
                        ? formatMoeda(item.valorDebito)
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      {item.podeSalvar ? (
                        <span className="inline-flex rounded-md border border-status-active/30 bg-status-active/10 px-1.5 py-0.5 text-[10px] font-semibold text-status-active">
                          Pronto
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-destructive/40 bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                          {item.motivoBloqueio ?? 'Indisponível'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-low px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {resumo.itensSalvaveis}
              </span>{' '}
              de {resumo.totalItens} item(ns) prontos · Total estimado:{' '}
              <span className="font-semibold text-foreground">
                {formatMoeda(resumo.valorTotal)}
              </span>
              {resumo.itensSemCorrespondencia > 0 ? (
                <span className="ml-2 text-destructive">
                  ({resumo.itensSemCorrespondencia} sem correspondência)
                </span>
              ) : null}
            </div>

            <Button
              type="button"
              size="sm"
              disabled={bloqueado || resumo.itensSalvaveis === 0}
              className="gap-2 text-xs"
              onClick={() => void aplicarValorizacao()}
            >
              {isSaving ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              Aplicar valorização
            </Button>
          </div>
        </>
      ) : (
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          Selecione a planilha no formato do modelo (colunas Material e VALOR P/
          KG) para visualizar a prévia antes de salvar.
        </div>
      )}
    </section>
  );
}
