'use client';

import Link from 'next/link';

import {
  Ban,
  Filter,
  History,
  Loader2,
  MapPin,
  Printer,
  QrCode,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  glassPanelClassName,
  sectionCardClassName,
} from '@/features/enderecos/components/form-field-classes';
import { LabelPreviewCard } from '@/features/enderecos/components/label-preview';
import { useEnderecosImpressaoEtiqueta } from '@/features/enderecos/hooks/use-enderecos-impressao-etiqueta';
import {
  GALPAO_OPCOES,
  NIVEL_IMPRESSAO_OPCOES,
} from '@/features/enderecos/mocks/enderecos-detail-mock-data';
import { LOTE_STATUS_LABELS } from '@/features/enderecos/types/enderecos-impressao-etiqueta.schema';
import type { LoteEnderecoStatus } from '@/features/enderecos/types/enderecos-impressao-etiqueta.schema';

const loteStatusTone: Record<
  LoteEnderecoStatus,
  { dot: string; badge: string }
> = {
  pronto: {
    dot: 'bg-tertiary',
    badge:
      'border-outline-variant bg-surface-highest text-muted-foreground',
  },
  'em-uso': {
    dot: 'bg-primary',
    badge: 'border-secondary/20 bg-secondary-container/20 text-secondary',
  },
  bloqueado: {
    dot: 'bg-destructive',
    badge: 'border-destructive/20 bg-destructive/10 text-destructive',
  },
};

export function EnderecosImpressaoEtiquetaView() {
  const {
    form,
    isLoading,
    isGenerating,
    lote,
    loteTotal,
    resumo,
    previewEndereco,
    previewIndex,
    previewTotal,
    filtroLote,
    setFiltroLote,
    toggleNivel,
    adicionarAoLote,
    removerDoLote,
    limparLote,
    gerarLote,
    previewAnterior,
    previewProxima,
    verHistorico,
    auditoriaEmMassa,
    bloqueioInventario,
  } = useEnderecosImpressaoEtiqueta();

  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const niveisSelecionados = watch('niveis');

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Impressão de Etiquetas e Manutenção
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Seleção técnica de endereços para processamento térmico em
                lote.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={verHistorico}
              >
                <History className="size-4" aria-hidden />
                Ver Histórico
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={isGenerating}
                onClick={() => void gerarLote()}
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Printer className="size-4" aria-hidden />
                )}
                {isGenerating ? 'Processando…' : 'Gerar Lote Agora'}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-12 space-y-gutter lg:col-span-4">
              <div className={cn(glassPanelClassName, 'p-6')}>
                <div className="mb-6 flex items-center gap-2">
                  <MapPin className="size-5 text-tertiary" aria-hidden />
                  <h2 className="text-lg font-semibold text-foreground">
                    Seleção de Área
                  </h2>
                </div>
                <form
                  onSubmit={(e) => void adicionarAoLote(e)}
                  className="space-y-4"
                >
                  <div>
                    <label className={fieldLabelClassName} htmlFor="galpao">
                      Galpão / Site
                    </label>
                    <select
                      id="galpao"
                      className={cn(fieldInputClassName, 'mt-2')}
                      {...register('galpao')}
                    >
                      {GALPAO_OPCOES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabelClassName} htmlFor="ruaIni">
                        Rua Inicial
                      </label>
                      <input
                        id="ruaIni"
                        placeholder="Ex: A-01"
                        className={cn(fieldInputClassName, 'mt-2')}
                        {...register('ruaInicial')}
                      />
                      {errors.ruaInicial && (
                        <p className={fieldErrorClassName}>
                          {errors.ruaInicial.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={fieldLabelClassName} htmlFor="ruaFim">
                        Rua Final
                      </label>
                      <input
                        id="ruaFim"
                        placeholder="Ex: B-12"
                        className={cn(fieldInputClassName, 'mt-2')}
                        {...register('ruaFinal')}
                      />
                      {errors.ruaFinal && (
                        <p className={fieldErrorClassName}>
                          {errors.ruaFinal.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={fieldLabelClassName}>Níveis</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {NIVEL_IMPRESSAO_OPCOES.map((nivel) => (
                        <button
                          key={nivel}
                          type="button"
                          onClick={() => toggleNivel(nivel)}
                          className={cn(
                            'rounded px-4 py-2 text-xs font-bold transition-colors',
                            niveisSelecionados.includes(nivel)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-highest text-muted-foreground',
                          )}
                        >
                          {nivel}
                        </button>
                      ))}
                    </div>
                    {errors.niveis && (
                      <p className={fieldErrorClassName}>
                        {errors.niveis.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="mt-4 w-full gap-2 border-tertiary/30 bg-tertiary-container/20 text-tertiary hover:bg-tertiary-container/30"
                    disabled={isLoading}
                  >
                    <Filter className="size-4" aria-hidden />
                    Adicionar ao Lote
                  </Button>
                </form>
              </div>

              <div className={cn(glassPanelClassName, 'overflow-hidden p-6')}>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Visualização Real
                  </h2>
                  <span className="rounded bg-surface-highest px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                    ZPL 203 DPI
                  </span>
                </div>
                <LabelPreviewCard
                  variant="thermal"
                  preview={{
                    enderecoCurto: previewEndereco,
                    enderecoCompleto: previewEndereco,
                    unidade: 'WMS ALPHA-01',
                    dimensoesLabel: '',
                    formato: '',
                  }}
                />
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={previewAnterior}
                    disabled={previewIndex <= 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={previewProxima}
                    disabled={previewIndex >= previewTotal - 1}
                  >
                    Próxima ({previewIndex + 1}/{Math.max(previewTotal, 1)})
                  </Button>
                </div>
              </div>
            </div>

            <div className="col-span-12 space-y-gutter lg:col-span-8">
              <div
                className={cn(
                  glassPanelClassName,
                  'flex min-h-[600px] flex-col overflow-hidden',
                )}
              >
                <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-low/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Lote Atual de Endereços
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {loteTotal} itens selecionados para processamento
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <input
                        type="search"
                        placeholder="Filtrar lote..."
                        value={filtroLote}
                        onChange={(e) => setFiltroLote(e.target.value)}
                        className="w-48 rounded-full border-none bg-surface-lowest py-1.5 pl-9 pr-4 text-xs text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      onClick={() => void limparLote()}
                      disabled={isLoading || loteTotal === 0}
                      aria-label="Limpar lote"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  <table className={compactTableClassName}>
                    <thead>
                      <tr className={compactTableHeadRowClassName}>
                        {[
                          { label: 'Endereço', className: 'min-w-[120px]' },
                          { label: 'Tipo', className: 'w-20' },
                          { label: 'Status', className: 'w-20' },
                          { label: '', className: 'w-8 text-right' },
                        ].map((h) => (
                          <th
                            key={h.label || 'actions'}
                            className={compactTableHeadCellClassName(h.className)}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={compactTableBodyClassName}>
                      {lote.map((item) => {
                        const tone = loteStatusTone[item.status];
                        return (
                          <tr key={item.id} className={compactTableRowClassName}>
                            <td className={compactTableCellClassName}>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn('size-1.5 rounded-full', tone.dot)}
                                />
                                <span className="font-mono text-[11px] font-semibold text-foreground">
                                  {item.endereco}
                                </span>
                              </div>
                            </td>
                            <td className={cn(compactTableCellClassName, 'text-[10px] text-muted-foreground')}>
                              {item.tipo}
                            </td>
                            <td className={compactTableCellClassName}>
                              <span
                                className={cn(
                                  'rounded-full border px-1.5 py-0 text-[9px] font-bold',
                                  tone.badge,
                                )}
                              >
                                {LOTE_STATUS_LABELS[item.status]}
                              </span>
                            </td>
                            <td className={cn(compactTableCellClassName, 'text-right')}>
                              <button
                                type="button"
                                onClick={() => removerDoLote(item.id)}
                                className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                                aria-label={`Remover ${item.endereco}`}
                              >
                                <X className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col justify-between gap-4 border-t border-outline-variant bg-surface-low p-4 sm:flex-row sm:items-center">
                  <div className="flex gap-4">
                    <div className="border-r border-outline-variant px-4 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Total Etiquetas
                      </p>
                      <p className="text-lg font-black text-primary">
                        {resumo.totalEtiquetas}
                      </p>
                    </div>
                    <div className="px-4 text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Estreia Média
                      </p>
                      <p className="text-lg font-black text-foreground">
                        {resumo.estreiaMediaSegundos}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          resumo.impressoraOnline
                            ? 'bg-tertiary'
                            : 'bg-destructive',
                        )}
                      />
                      Impressora{' '}
                      {resumo.impressoraOnline ? 'Online' : 'Offline'}
                    </span>
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-highest">
                      <div
                        className="h-full rounded-full bg-tertiary"
                        style={{ width: `${resumo.filaPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-gutter md:grid-cols-2">
                <button
                  type="button"
                  onClick={auditoriaEmMassa}
                  className={cn(
                    sectionCardClassName,
                    'group cursor-pointer text-left hover:border-primary/50',
                  )}
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-surface-highest text-primary transition-transform group-hover:scale-110">
                    <QrCode className="size-5" aria-hidden />
                  </div>
                  <h3 className="mb-1 font-bold text-foreground">
                    Auditoria em Massa
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Inicia rotina de conferência para todos os itens deste lote
                    via coletor.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={bloqueioInventario}
                  className={cn(
                    sectionCardClassName,
                    'group cursor-pointer text-left hover:border-secondary/50',
                  )}
                >
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-surface-highest text-secondary transition-transform group-hover:scale-110">
                    <Ban className="size-5" aria-hidden />
                  </div>
                  <h3 className="mb-1 font-bold text-foreground">
                    Bloqueio de Inventário
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Suspende movimentações nos endereços selecionados
                    temporariamente.
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="link" asChild className="px-0">
              <Link href="/enderecos">← Voltar para gestão</Link>
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
