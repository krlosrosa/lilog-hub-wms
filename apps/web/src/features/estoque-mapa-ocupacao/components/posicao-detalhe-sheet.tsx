'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Check,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  Package,
  Ruler,
  Scale,
  X,
} from 'lucide-react';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';

import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  CurvaAbcBadge,
  EnderecoStatusBadge,
} from '@/features/enderecos/components/endereco-status-badge';
import {
  ENDERECO_TIPO_LABELS,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { HistoricoProdutoSheet } from '@/features/estoque/components/historico-produto-sheet';
import { EstoqueStatusBadge } from '@/features/estoque/components/estoque-status-badge';
import { SaldoCell } from '@/features/estoque/components/saldo-cell';
import type { HistoricoProdutoSelecionado } from '@/features/estoque/types/estoque-gestao.schema';
import type { SaldoEnderecoComProdutoApi } from '@/features/estoque/types/estoque.api';
import { fetchPosicaoDetalhe } from '@/features/estoque-mapa-ocupacao/lib/posicao-detalhe-api';
import type { PosicaoSelecionada } from '@/features/estoque-mapa-ocupacao/types';

type PosicaoDetalheSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posicao: PosicaoSelecionada | null;
  unidadeId?: string;
};

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const df = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function calcVolumeM3(
  larguraMm: number,
  alturaMm: number,
  profundidadeMm: number,
): number {
  return (larguraMm * alturaMm * profundidadeMm) / 1_000_000_000;
}

function ocupacaoToneClass(percent: number): string {
  if (percent >= 90) return 'bg-destructive';
  if (percent >= 70) return 'bg-amber-500';
  return 'bg-primary';
}

export function PosicaoDetalheSheet({
  open,
  onOpenChange,
  posicao,
  unidadeId,
}: PosicaoDetalheSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Awaited<
    ReturnType<typeof fetchPosicaoDetalhe>
  > | null>(null);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [produtoHistorico, setProdutoHistorico] =
    useState<HistoricoProdutoSelecionado | null>(null);

  const carregar = useCallback(async () => {
    if (!open || !posicao || !unidadeId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await fetchPosicaoDetalhe(unidadeId, posicao.enderecoId);
      setDetalhe(data);
    } catch (error) {
      setDetalhe(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os detalhes da posição',
      );
    } finally {
      setIsLoading(false);
    }
  }, [open, posicao, unidadeId]);

  useEffect(() => {
    if (!open) {
      setDetalhe(null);
      setLoadError(null);
      return;
    }

    void carregar();
  }, [carregar, open]);

  const endereco = detalhe?.endereco;
  const saldos = detalhe?.saldos ?? [];

  const resumoSaldos = useMemo(() => {
    return saldos.reduce(
      (acc, item) => ({
        total: acc.total + item.quantidade,
        fisico:
          acc.fisico + (item.natureza === 'fisico' ? item.quantidade : 0),
        debito:
          acc.debito + (item.natureza === 'debito' ? item.quantidade : 0),
        bloqueado:
          acc.bloqueado + (item.status === 'bloqueado' ? item.quantidade : 0),
        liberado:
          acc.liberado + (item.status === 'liberado' ? item.quantidade : 0),
      }),
      { total: 0, fisico: 0, debito: 0, bloqueado: 0, liberado: 0 },
    );
  }, [saldos]);

  const ocupacaoPercent = endereco
    ? Math.round(Number(endereco.ocupacaoPercent))
    : 0;

  const volumeTeoricoM3 = endereco
    ? calcVolumeM3(
        endereco.larguraMm,
        endereco.alturaMm,
        endereco.profundidadeMm,
      )
    : 0;

  const abrirHistorico = (item: SaldoEnderecoComProdutoApi) => {
    setProdutoHistorico({
      produtoId: item.produtoId,
      produtoSku: item.produtoSku,
      produtoDescricao: item.produtoNome,
      lote: item.lote,
      depositoId: item.depositoId,
      enderecoId: item.enderecoId,
      enderecoMascarado: item.enderecoMascarado ?? posicao?.enderecoMascarado,
    });
    setHistoricoAberto(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        >
          <div className="flex shrink-0 flex-col gap-3 border-b border-outline-variant px-5 pb-4 pt-5">
            <SheetHeader className="space-y-0 text-left">
              <SheetTitle className="text-sm font-semibold text-muted-foreground">
                Detalhe da Posição
              </SheetTitle>
              <SheetDescription className="sr-only">
                Informações da posição selecionada no mapa de ocupação
              </SheetDescription>
            </SheetHeader>

            {posicao ? (
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <MapPin className="size-4 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-lg font-bold tracking-tight text-foreground">
                    {posicao.enderecoMascarado}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {posicao.zona ? (
                      <MetaBadge>{posicao.zona}</MetaBadge>
                    ) : null}
                    {posicao.tipo ? (
                      <MetaBadge>{ENDERECO_TIPO_LABELS[posicao.tipo]}</MetaBadge>
                    ) : null}
                    {posicao.status ? (
                      <EnderecoStatusBadge status={posicao.status} compact />
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecione uma posição no mapa.
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                <p className="text-xs">Carregando detalhes...</p>
              </div>
            ) : loadError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {loadError}
              </div>
            ) : endereco ? (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <InfoCard label="Status">
                    <EnderecoStatusBadge status={endereco.status} />
                  </InfoCard>
                  <InfoCard label="Tipo">
                    <span className="text-xs font-medium text-foreground">
                      {ENDERECO_TIPO_LABELS[endereco.tipo]}
                    </span>
                  </InfoCard>
                  <InfoCard label="Estrutura" className="col-span-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {endereco.zona}-{endereco.rua}-{endereco.posicao}-
                      {endereco.nivel}
                    </span>
                  </InfoCard>
                </div>

                <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                  <div className="flex items-center justify-between gap-3 border-b border-outline-variant/60 px-4 py-2.5">
                    <SectionLabel>Capacidade</SectionLabel>
                    <CurvaAbcBadge curva={endereco.curvaAbc} compact />
                  </div>

                  <div className="space-y-3.5 px-4 py-3">
                    <div>
                      <div className="mb-1.5 flex items-end justify-between gap-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          Ocupação
                        </span>
                        <span
                          className={cn(
                            'font-mono text-xl font-bold tabular-nums leading-none tracking-tight',
                            ocupacaoPercent >= 90
                              ? 'text-destructive'
                              : ocupacaoPercent >= 70
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-primary',
                          )}
                        >
                          {ocupacaoPercent}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            ocupacaoToneClass(ocupacaoPercent),
                          )}
                          style={{ width: `${Math.min(100, ocupacaoPercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Metric
                        icon={<Scale className="size-3.5" />}
                        label="Carga máx."
                        value={`${nf.format(Number(endereco.cargaMaxKg))} kg`}
                      />
                      <Metric
                        icon={<Ruler className="size-3.5" />}
                        label="Volume teórico"
                        value={`${volumeTeoricoM3.toFixed(2)} m³`}
                      />
                      <Metric
                        icon={<Package className="size-3.5" />}
                        label="Dimensões"
                        value={`${endereco.larguraMm}×${endereco.alturaMm}×${endereco.profundidadeMm} mm`}
                      />
                      <Metric
                        icon={<Scale className="size-3.5" />}
                        label="Quantidade total"
                        value={`${nf.format(resumoSaldos.total)} un.`}
                      />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant bg-surface-high px-4 py-3">
                  <SectionLabel className="mb-2.5">Regras logísticas</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    <RuleChip active={endereco.vinculoSkuFixo} label="SKU fixo" />
                    <RuleChip active={endereco.regraLoteUnico} label="Lote único" />
                    <RuleChip
                      active={endereco.permiteMisturaValidade}
                      label="Mistura validade"
                    />
                    <RuleChip
                      active={endereco.permiteFracionado}
                      label="Fracionado"
                    />
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <SectionLabel>Produtos armazenados</SectionLabel>
                    {saldos.length > 0 ? (
                      <span className="rounded-full bg-surface-high px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {detalhe?.totalSaldos ?? saldos.length}{' '}
                        {(detalhe?.totalSaldos ?? saldos.length) === 1
                          ? 'registro'
                          : 'registros'}
                      </span>
                    ) : null}
                  </div>

                  {saldos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-outline-variant bg-surface-high/50 px-5 py-10 text-center">
                      <div className="flex size-11 items-center justify-center rounded-xl border border-outline-variant bg-surface-low">
                        <Package
                          className="size-5 text-muted-foreground/70"
                          aria-hidden
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Posição livre
                        </p>
                        <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                          Nenhum produto armazenado nesta posição no momento.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
                        <MiniSaldo label="Físico" value={resumoSaldos.fisico} />
                        <MiniSaldo
                          label="Liberado"
                          value={resumoSaldos.liberado}
                          tone="positive"
                          divided
                        />
                        <MiniSaldo
                          label="Bloq."
                          value={resumoSaldos.bloqueado}
                          tone="critical"
                          divided
                        />
                        <MiniSaldo
                          label="Débito"
                          value={resumoSaldos.debito}
                          tone="warning"
                          divided
                        />
                      </div>

                      <div className="overflow-x-auto border border-outline-variant">
                        <table className={compactTableClassName}>
                          <thead>
                            <tr className={compactTableHeadRowClassName}>
                              <th className={compactTableHeadCellClassName()}>
                                Produto
                              </th>
                              <th className={compactTableHeadCellClassName()}>
                                Lote
                              </th>
                              <th className={compactTableHeadCellClassName()}>
                                Qtd.
                              </th>
                              <th className={compactTableHeadCellClassName()}>
                                Status
                              </th>
                              <th className={compactTableHeadCellClassName()} />
                            </tr>
                          </thead>
                          <tbody className={compactTableBodyClassName}>
                            {saldos.map((item) => (
                              <tr key={item.id}>
                                <td className={compactTableCellClassName}>
                                  <div className="min-w-[130px]">
                                    <p className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                                      {item.produtoNome || '—'}
                                    </p>
                                    <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                                      {item.produtoSku || item.produtoId}
                                    </p>
                                  </div>
                                </td>
                                <td className={compactTableCellClassName}>
                                  <div>
                                    <p className="font-mono text-[11px]">
                                      {item.lote || '—'}
                                    </p>
                                    {item.validade ? (
                                      <p className="text-[10px] text-muted-foreground">
                                        {df.format(new Date(item.validade))}
                                      </p>
                                    ) : null}
                                    {item.numeroSerie ? (
                                      <p className="text-[10px] text-muted-foreground">
                                        Série {item.numeroSerie}
                                      </p>
                                    ) : null}
                                  </div>
                                </td>
                                <td className={compactTableCellClassName}>
                                  <span className="font-mono text-[11px] font-semibold tabular-nums">
                                    <SaldoCell value={item.quantidade} />
                                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                      {item.unidadeMedida}
                                    </span>
                                  </span>
                                </td>
                                <td className={compactTableCellClassName}>
                                  <EstoqueStatusBadge
                                    variant="status"
                                    value={item.status}
                                    compact
                                  />
                                </td>
                                <td className={compactTableCellClassName}>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="size-7 p-0"
                                    onClick={() => abrirHistorico(item)}
                                    aria-label={`Ver histórico de ${item.produtoNome}`}
                                  >
                                    <History className="size-3.5" aria-hidden />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              </>
            ) : null}
          </div>

          {endereco ? (
            <SheetFooter className="shrink-0 border-t border-outline-variant bg-surface-high/50 px-5 py-3">
              <Button type="button" variant="outline" className="w-full gap-2" asChild>
                <Link href={`/enderecos/${endereco.id}`}>
                  <ExternalLink className="size-4" aria-hidden />
                  Abrir cadastro do endereço
                </Link>
              </Button>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>

      <HistoricoProdutoSheet
        open={historicoAberto}
        onOpenChange={setHistoricoAberto}
        produto={produtoHistorico}
      />
    </>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-outline-variant bg-surface-low px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function InfoCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-high px-3 py-2.5',
        className,
      )}
    >
      <SectionLabel className="mb-1.5">{label}</SectionLabel>
      {children}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-low/50 px-2.5 py-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function RuleChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-outline-variant bg-surface-low text-muted-foreground',
      )}
    >
      {active ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <X className="size-3 shrink-0 opacity-50" aria-hidden />
      )}
      {label}
    </span>
  );
}

function MiniSaldo({
  label,
  value,
  tone = 'default',
  divided = false,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
  divided?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-2 py-2.5',
        divided && 'border-l border-outline-variant/60',
      )}
    >
      <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <SaldoCell value={value} tone={tone} className="text-sm font-bold" />
    </div>
  );
}
