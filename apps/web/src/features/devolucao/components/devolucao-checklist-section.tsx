'use client';

import { useMemo } from 'react';

import {
  BadgeCheck,
  Camera,
  ClipboardCheck,
  ImageIcon,
  TriangleAlert,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { FotoExpandivel } from '@/features/recebimento/components/foto-expandivel';
import type { DevolucaoChecklistDetalhe } from '@/features/devolucao/types/devolucao-buscar.schema';
import type { ChecklistFoto } from '@/features/devolucao/types/devolucao-checklist.schema';
import { isTemperaturaForaFaixa } from '@/features/devolucao/types/devolucao-detalhes.schema';

const CONDITION_ITEMS = [
  { key: 'limpeza', label: 'Limpeza' },
  { key: 'odor', label: 'Odor' },
  { key: 'estrutura', label: 'Estrutura' },
  { key: 'vedacao', label: 'Vedação' },
] as const;

const TEMPERATURA_ALVO = -18;

type DevolucaoChecklistSectionProps = {
  checklist: DevolucaoChecklistDetalhe | null;
  fotos: readonly ChecklistFoto[];
  fotoTotalInformado: number;
  compact?: boolean;
};

function formatTemp(value: number | null, tempFmt: Intl.NumberFormat): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${tempFmt.format(value)}°C`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function DevolucaoChecklistSection({
  checklist,
  fotos,
  fotoTotalInformado,
  compact = false,
}: DevolucaoChecklistSectionProps) {
  const tempFmt = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [],
  );

  const checklistPreenchido = checklist !== null;
  const cargaSegregada = Boolean(checklist?.conditions.cargaSegregada);
  const tempBauForaFaixa = isTemperaturaForaFaixa(
    checklist?.tempBau ?? null,
    checklist?.tempBau != null ? TEMPERATURA_ALVO : null,
  );
  const tempProdutoForaFaixa = isTemperaturaForaFaixa(
    checklist?.tempProduto ?? null,
    checklist?.tempProduto != null ? TEMPERATURA_ALVO : null,
  );
  const totalFotos = Math.max(fotoTotalInformado, fotos.length);
  const condicoesOk = checklist
    ? CONDITION_ITEMS.filter((item) => checklist.conditions[item.key]).length
    : 0;

  const headerBadge = checklistPreenchido ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-tertiary/10 px-2 py-0.5 text-[9px] font-semibold text-tertiary">
      OK
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
      Pendente
    </span>
  );

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-outline-variant/70 bg-glass-bg shadow-sm backdrop-blur-glass',
        compact ? 'text-[11px]' : '',
      )}
      aria-labelledby="titulo-checklist-devolucao"
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b border-outline-variant/50 bg-muted/10',
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        )}
      >
        <ClipboardCheck
          className="size-3.5 shrink-0 text-primary"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2
              id="titulo-checklist-devolucao"
              className="truncate text-[10px] font-bold uppercase tracking-wider text-primary"
            >
              Checklist
            </h2>
            {headerBadge}
          </div>
          {checklistPreenchido ? (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {formatDateTime(checklist.updatedAt)}
            </p>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Pendente — preencha no PWA ou Registro de Chegada
            </p>
          )}
        </div>
      </div>

      <div className={cn(compact ? 'space-y-2.5 p-2.5' : 'space-y-3 p-3')}>
        {!checklistPreenchido ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Nenhum checklist registrado. Preencha no PWA ou em Registro de
            Chegada para liberar a conferência.
          </p>
        ) : (
          <>
            <dl
              className={cn(
                'grid gap-1.5',
                compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4',
              )}
            >
              {[
                { label: 'Doca', value: checklist.dock },
                {
                  label: 'Paletes',
                  value: String(checklist.paletesRecebidos),
                },
                {
                  label: 'Baú',
                  value: formatTemp(checklist.tempBau, tempFmt),
                  alerta: tempBauForaFaixa,
                },
                {
                  label: 'Produto',
                  value: formatTemp(checklist.tempProduto, tempFmt),
                  alerta: tempProdutoForaFaixa,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded border border-outline-variant/40 bg-muted/10 px-2 py-1.5"
                >
                  <dt className="text-[9px] font-semibold uppercase text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd
                    className={cn(
                      'mt-0.5 truncate text-xs font-semibold tabular-nums',
                      item.alerta ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-1">
              <span className="mr-0.5 text-[9px] text-muted-foreground">
                Condições {condicoesOk}/{CONDITION_ITEMS.length}:
              </span>
              {CONDITION_ITEMS.map((item) => {
                const ok = checklist.conditions[item.key] ?? false;

                return (
                  <span
                    key={item.key}
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium',
                      ok
                        ? 'bg-tertiary/10 text-tertiary'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {ok ? (
                      <BadgeCheck className="size-2.5" aria-hidden />
                    ) : (
                      <TriangleAlert className="size-2.5" aria-hidden />
                    )}
                    {item.label}
                  </span>
                );
              })}
              {cargaSegregada ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                  <TriangleAlert className="size-2.5" aria-hidden />
                  Segregada
                </span>
              ) : null}
            </div>

            {checklist.observacoes ? (
              <p className="rounded border border-outline-variant/40 bg-muted/10 px-2 py-1.5 text-[10px] text-muted-foreground">
                {checklist.observacoes}
              </p>
            ) : null}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="size-3" aria-hidden />
                  Fotos
                  {totalFotos > 0 ? ` (${totalFotos})` : ''}
                </h3>
              </div>

              {fotos.length === 0 ? (
                <div className="flex items-center gap-2 rounded border border-dashed border-outline-variant/50 bg-muted/10 px-2 py-2">
                  <Camera
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {checklist.photoCount > 0
                      ? `${checklist.photoCount} informada(s) — aguardando upload.`
                      : 'Nenhuma foto enviada.'}
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    'grid gap-1.5',
                    compact
                      ? 'grid-cols-3'
                      : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6',
                  )}
                >
                  {fotos.map((foto) => (
                    <FotoExpandivel
                      key={foto.id}
                      id={foto.id}
                      url={foto.url}
                      legenda={foto.legenda}
                      showLegenda
                      className="group relative aspect-[4/3] w-full overflow-hidden rounded border border-outline-variant/60 bg-muted/20 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
