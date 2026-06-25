'use client';

import { useRef } from 'react';

import {
  Database,
  Layers,
  Loader2,
  Printer,
  Scale,
  Search,
  Upload,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
} from '@/components/ui/compact-table-classes';
import { AdicionarBancoDialog } from '@/features/peso-variavel/components/adicionar-banco-dialog';
import { EtiquetaSeparacaoPreview } from '@/features/peso-variavel/components/etiqueta-separacao-preview';
import { EtiquetasPrintArea } from '@/features/peso-variavel/components/etiquetas-print-area';
import {
  LinhaSeparacaoRow,
  linhaSeparacaoHeadCellClassName,
} from '@/features/peso-variavel/components/linha-separacao-row';
import { SeparacaoStatsCards } from '@/features/peso-variavel/components/separacao-stats-cards';
import { usePesoVariavelEtiquetas } from '@/features/peso-variavel/hooks/use-peso-variavel-etiquetas';

const TABLE_HEADERS = [
  { label: '', className: 'w-7' },
  { label: 'Transp.', className: 'w-[52px]' },
  { label: 'Remessa', className: 'w-[72px]' },
  { label: 'Cod.', className: 'w-[56px]' },
  { label: 'Cliente', className: 'min-w-[100px]' },
  { label: 'SKU', className: 'w-[72px]' },
  { label: 'Descrição', className: 'min-w-[120px]' },
  { label: 'Qtd', className: 'w-10 text-right' },
  { label: 'Status', className: 'w-[72px]' },
] as const;

const searchInputClassName =
  'w-full rounded-md border border-outline-variant bg-surface-lowest py-1 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-0 md:w-56';

export function PesoVariavelEtiquetasView() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    linhas,
    linhasTotal,
    selectedIds,
    isLoading,
    isGenerating,
    isPrinting,
    isUploading,
    isAdicionarModalOpen,
    isSalvandoBanco,
    ultimoArquivo,
    etiquetasGeradas,
    previewEtiqueta,
    previewIndex,
    previewTotal,
    busca,
    setBusca,
    totalEtiquetasSelecionadas,
    linhasSelecionadasCount,
    resumo,
    resumoBanco,
    todasFiltradasSelecionadas,
    algumasFiltradasSelecionadas,
    toggleLinha,
    toggleTodas,
    gerarEtiquetas,
    imprimirEtiquetas,
    uploadArquivos,
    abrirModalAdicionar,
    fecharModalAdicionar,
    confirmarAdicionarBanco,
    previewAnterior,
    previewProxima,
  } = usePesoVariavelEtiquetas();

  const gerarLabel =
    totalEtiquetasSelecionadas === 0
      ? 'Gerar'
      : `Gerar ${totalEtiquetasSelecionadas}`;

  const imprimirLabel =
    previewTotal === 0 ? 'Imprimir' : `Imprimir ${previewTotal}`;

  return (
    <SidebarMain>
      <EtiquetasPrintArea etiquetas={etiquetasGeradas} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.xlsx,.xls"
        multiple
        className="sr-only"
        aria-hidden
        onChange={(e) => {
          void uploadArquivos(e.target.files);
          e.target.value = '';
        }}
      />

      <AdicionarBancoDialog
        open={isAdicionarModalOpen}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalAdicionar();
        }}
        totalLinhas={resumoBanco.totalLinhas}
        totalCaixas={resumoBanco.totalCaixas}
        isSalvando={isSalvandoBanco}
        onConfirmar={() => void confirmarAdicionarBanco()}
      />

      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Scale className="size-4" aria-hidden />
                <span className="text-caption">Expedição · Peso Variável</span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Etiquetas de Separação — Queijo Variável
              </h1>
              <p className="mt-1 max-w-2xl text-body-sm text-muted-foreground">
                Selecione linhas, gere e imprima uma etiqueta por caixa.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-3 text-xs"
                disabled={isUploading || isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-3.5" aria-hidden />
                )}
                {isUploading ? 'Importando…' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-3 text-xs"
                disabled={
                  isLoading ||
                  isSalvandoBanco ||
                  linhasSelecionadasCount === 0
                }
                onClick={abrirModalAdicionar}
              >
                <Database className="size-3.5" aria-hidden />
                {linhasSelecionadasCount === 0
                  ? 'Adicionar'
                  : `Adicionar (${linhasSelecionadasCount})`}
              </Button>
              <Button
                type="button"
                className="h-8 gap-1.5 px-3 text-xs"
                disabled={
                  isGenerating || isLoading || totalEtiquetasSelecionadas === 0
                }
                onClick={() => void gerarEtiquetas()}
              >
                {isGenerating ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Layers className="size-3.5" aria-hidden />
                )}
                {isGenerating ? 'Gerando…' : gerarLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-3 text-xs"
                disabled={
                  isPrinting || isLoading || previewTotal === 0
                }
                onClick={() => void imprimirEtiquetas()}
              >
                {isPrinting ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Printer className="size-3.5" aria-hidden />
                )}
                {isPrinting ? 'Imprimindo…' : imprimirLabel}
              </Button>
            </div>
          </header>

          <SeparacaoStatsCards stats={resumo} className="mb-gutter" />

          <div className="grid grid-cols-12 gap-gutter">
            <div className="col-span-12 space-y-gutter lg:col-span-8">
              <section className="overflow-hidden rounded-lg border border-outline-variant bg-card shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-high px-3 py-2">
                  <div>
                    <h2 className="text-xs font-medium text-primary">
                      Linhas de Separação
                    </h2>
                    {linhasSelecionadasCount > 0 ? (
                      <p className="text-[10px] text-muted-foreground">
                        {linhasSelecionadasCount} linha
                        {linhasSelecionadasCount !== 1 ? 's' : ''} ·{' '}
                        {totalEtiquetasSelecionadas} etiqueta
                        {totalEtiquetasSelecionadas !== 1 ? 's' : ''}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        Marque as linhas desejadas
                        {ultimoArquivo ? ` · Último arquivo: ${ultimoArquivo}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <Search
                      className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="search"
                      placeholder="Buscar…"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className={searchInputClassName}
                      aria-label="Buscar linhas de separação"
                    />
                  </div>
                </div>

                {isLoading ? (
                  <div
                    className="flex min-h-[200px] items-center justify-center"
                    role="status"
                    aria-label="Carregando linhas de separação"
                  >
                    <Loader2 className="size-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className={cn(compactTableClassName, 'text-[10px]')}>
                      <thead>
                        <tr className="sticky top-0 z-10 bg-surface-highest/80 backdrop-blur-sm">
                          {TABLE_HEADERS.map((header, index) => (
                            <th
                              key={header.label || 'checkbox'}
                              scope="col"
                              className={cn(
                                linhaSeparacaoHeadCellClassName,
                                header.className,
                              )}
                            >
                              {index === 0 ? (
                                <input
                                  type="checkbox"
                                  checked={todasFiltradasSelecionadas}
                                  ref={(el) => {
                                    if (el) {
                                      el.indeterminate =
                                        algumasFiltradasSelecionadas;
                                    }
                                  }}
                                  onChange={toggleTodas}
                                  aria-label="Selecionar todas as linhas visíveis"
                                  className="size-3 rounded border-outline-variant text-primary focus-visible:ring-2 focus-visible:ring-ring"
                                />
                              ) : (
                                header.label
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={compactTableBodyClassName}>
                        {linhas.length === 0 ? (
                          <tr>
                            <td
                              colSpan={TABLE_HEADERS.length}
                              className={cn(
                                compactTableEmptyCellClassName,
                                'py-8 text-[11px]',
                              )}
                            >
                              {linhasTotal === 0
                                ? 'Nenhuma linha de separação disponível.'
                                : 'Nenhum resultado para a busca informada.'}
                            </td>
                          </tr>
                        ) : (
                          linhas.map((linha) => (
                            <LinhaSeparacaoRow
                              key={linha.id}
                              linha={linha}
                              selecionada={selectedIds.has(linha.id)}
                              onToggle={toggleLinha}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="col-span-12 lg:col-span-4">
              <EtiquetaSeparacaoPreview
                etiqueta={previewEtiqueta}
                previewIndex={previewIndex}
                previewTotal={previewTotal}
                isPrinting={isPrinting}
                onAnterior={previewAnterior}
                onProxima={previewProxima}
                onImprimir={imprimirEtiquetas}
              />
            </div>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
