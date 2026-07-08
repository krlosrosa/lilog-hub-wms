'use client';

import { Fragment, useState } from 'react';

import { Button, cn } from '@lilog/ui';
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Lightbulb,
  Scale,
  Tag,
} from 'lucide-react';

import type { CncItem } from '@/features/cnc/types/cnc.schema';
import {
  CNC_ITEM_TIPO_LABELS,
  CNC_RESPONSAVEL_LABELS,
  CNC_SUBTIPO_LABELS,
} from '@/features/cnc/types/cnc.schema';
import {
  formatCncQuantidade,
  getAnaliseSugerida,
  SUBTIPO_CONFIG,
} from '@/features/cnc/lib/cnc-detalhe-utils';
import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import type { FotoEvidencia } from '@/features/recebimento/types/recebimento-detalhe.schema';

type CncAnomaliaRowProps = {
  item: CncItem;
  index: number;
  colSpan: number;
  defaultExpanded?: boolean;
  fotos?: FotoEvidencia[];
};

function DetalheCampo({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function CncAnomaliaRow({
  item,
  index,
  colSpan,
  defaultExpanded = false,
  fotos = [],
}: CncAnomaliaRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const subtipoConfig = item.subtipoOcorrencia
    ? SUBTIPO_CONFIG[item.subtipoOcorrencia]
    : null;
  const analiseSugerida = getAnaliseSugerida(item);
  const hasDivergencia =
    item.quantidadeDivergente !== null && item.quantidadeDivergente !== 0;
  const hasExtraDetails =
    Boolean(
      item.loteEsperado ||
        item.loteRecebido ||
        item.validadeEsperada ||
        item.validadeRecebida ||
        item.pesoEsperado ||
        item.pesoRecebido ||
        item.descricaoDetalhe ||
        item.naturezaAvaria ||
        item.causaAvaria ||
        item.tipoAvaria ||
        analiseSugerida ||
        fotos.length > 0,
    );

  return (
    <Fragment>
      <tr
        className={cn(
          'group transition-colors hover:bg-surface-highest/50',
          expanded && 'bg-surface-highest/30',
          item.tipo === 'avaria' && 'bg-destructive/[0.03]',
        )}
      >
        <td className="px-2 py-2 text-center">
          <span
            className={cn(
              'inline-flex size-6 items-center justify-center rounded-md border text-[10px] font-bold tabular-nums',
              subtipoConfig
                ? cn(subtipoConfig.border, subtipoConfig.bg, subtipoConfig.accent)
                : item.tipo === 'avaria'
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-secondary/30 bg-secondary/10 text-secondary',
            )}
          >
            {index + 1}
          </span>
        </td>

        <td className="px-2 py-2">
          <span
            className={cn(
              'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
              item.tipo === 'avaria'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-secondary/30 bg-secondary/10 text-secondary',
            )}
          >
            {CNC_ITEM_TIPO_LABELS[item.tipo]}
          </span>
        </td>

        <td className="hidden px-2 py-2 sm:table-cell">
          {item.subtipoOcorrencia ? (
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                subtipoConfig
                  ? cn(subtipoConfig.bg, subtipoConfig.accent)
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {CNC_SUBTIPO_LABELS[item.subtipoOcorrencia]}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        <td className="min-w-[160px] px-2 py-2">
          <p className="font-mono text-[11px] font-semibold text-primary">
            {item.sku ?? item.produtoId ?? '—'}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-foreground">
            {item.descricaoProduto ?? 'Sem descrição cadastrada'}
          </p>
        </td>

        <td className="px-2 py-2 text-right tabular-nums text-[11px] text-muted-foreground">
          {formatCncQuantidade(item.quantidadeEsperada, item.unidadeMedida)}
        </td>

        <td className="px-2 py-2 text-right tabular-nums text-[11px] text-foreground">
          {formatCncQuantidade(item.quantidadeRecebida, item.unidadeMedida)}
        </td>

        <td
          className={cn(
            'px-2 py-2 text-right tabular-nums text-[11px] font-semibold',
            hasDivergencia ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {formatCncQuantidade(item.quantidadeDivergente, item.unidadeMedida)}
        </td>

        <td className="hidden max-w-[120px] truncate px-2 py-2 text-[11px] text-foreground md:table-cell">
          {item.responsavelSugerido
            ? CNC_RESPONSAVEL_LABELS[item.responsavelSugerido]
            : '—'}
        </td>

        <td className="hidden px-2 py-2 text-center lg:table-cell">
          {fotos.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              <ImageIcon className="size-3" aria-hidden />
              {fotos.length}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        <td className="px-2 py-2 text-center">
          {hasExtraDetails ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? `Recolher detalhes da anomalia ${index + 1}`
                  : `Expandir detalhes da anomalia ${index + 1}`
              }
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <ChevronUp className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
            </Button>
          ) : null}
        </td>
      </tr>

      {expanded && hasExtraDetails ? (
        <tr className="bg-surface-low/40">
          <td colSpan={colSpan} className="border-t border-outline-variant/40 px-4 py-4">
            <div className="space-y-4">
              {(item.loteEsperado ||
                item.loteRecebido ||
                item.pesoEsperado ||
                item.pesoRecebido) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(item.loteEsperado || item.loteRecebido) && (
                    <div className="rounded-lg border border-outline-variant/50 bg-surface-low/60 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Tag className="size-3" aria-hidden />
                        Lote
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Esperado
                          </p>
                          <p className="font-medium text-foreground">
                            {item.loteEsperado ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Recebido
                          </p>
                          <p
                            className={cn(
                              'font-medium',
                              item.loteEsperado &&
                                item.loteRecebido &&
                                item.loteEsperado !== item.loteRecebido
                                ? 'text-destructive'
                                : 'text-foreground',
                            )}
                          >
                            {item.loteRecebido ?? '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(item.pesoEsperado || item.pesoRecebido) && (
                    <div className="rounded-lg border border-outline-variant/50 bg-surface-low/60 p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <Scale className="size-3" aria-hidden />
                        Peso
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Esperado
                          </p>
                          <p className="font-medium text-foreground">
                            {item.pesoEsperado?.toLocaleString('pt-BR') ?? '—'} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground">
                            Recebido
                          </p>
                          <p className="font-medium text-foreground">
                            {item.pesoRecebido?.toLocaleString('pt-BR') ?? '—'} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetalheCampo label="Detalhe" value={item.descricaoDetalhe} />
                <DetalheCampo
                  label="Natureza da avaria"
                  value={item.naturezaAvaria}
                />
                <DetalheCampo label="Causa da avaria" value={item.causaAvaria} />
                <DetalheCampo label="Tipo de avaria" value={item.tipoAvaria} />
              </div>

              {item.tipo === 'avaria' &&
              (item.quantidadeCaixas || item.quantidadeUnidades) ? (
                <p className="text-xs text-muted-foreground">
                  Composição:{' '}
                  {item.quantidadeCaixas
                    ? `${item.quantidadeCaixas} caixa(s)`
                    : null}
                  {item.quantidadeCaixas && item.quantidadeUnidades ? ' · ' : null}
                  {item.quantidadeUnidades
                    ? `${item.quantidadeUnidades} unidade(s)`
                    : null}
                </p>
              ) : null}

              {fotos.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Fotos da avaria ({fotos.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fotos.map((foto) => (
                      <FotoExpandivel
                        key={foto.id}
                        id={foto.id}
                        url={foto.url}
                        legenda={foto.legenda}
                        className="group relative size-20 overflow-hidden rounded-md border border-outline-variant/60 bg-muted/25 transition-colors hover:border-destructive/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-24"
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {analiseSugerida ? (
                <div className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <Lightbulb
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Orientação para análise
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-foreground/90">
                      {analiseSugerida}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
