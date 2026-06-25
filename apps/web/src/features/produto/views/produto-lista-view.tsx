'use client';

import { useCallback, useRef, useState } from 'react';

import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@lilog/ui';
import { Loader2, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  compactTableBodyClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { ProdutoFiltrosAvancadosSheet } from '@/features/produto/components/produto-filtros-avancados-sheet';
import { ProdutoRow } from '@/features/produto/components/produto-row';
import { ProdutoStatsCards } from '@/features/produto/components/produto-stats-cards';
import { ProdutoUtilityBar } from '@/features/produto/components/produto-utility-bar';
import { importarProdutosMassa } from '@/features/produto/lib/produto-api';
import { useProdutoLista } from '@/features/produto/hooks/use-produto-lista';

import type { ErroImportacaoProduto } from '@/features/produto/types/produto.api';
import type { ProdutoListaItem } from '@/features/produto/types/produto-lista.schema';

const TABLE_HEADERS = [
  { label: 'SKU', className: 'w-24' },
  { label: 'Descrição', className: 'min-w-[140px]' },
  { label: 'EAN', className: 'hidden md:table-cell w-28' },
  { label: 'Categoria', className: 'w-24' },
  { label: 'Empresa', className: 'hidden lg:table-cell min-w-[80px]' },
  { label: '', className: 'w-8 text-right' },
] as const;

export function ProdutoListaView() {
  const {
    filtroCategoria,
    setFiltroCategoria,
    filtrosAvancados,
    filtrosAvancadosAtivos,
    setFiltrosAvancados,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados,
    stats,
    pageSize,
    setPageSize,
    removerProduto,
    carregando,
  } = useProdutoLista();

  const [produtoParaExcluir, setProdutoParaExcluir] =
    useState<ProdutoListaItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [importando, setImportando] = useState(false);
  const [errosImportacao, setErrosImportacao] = useState<ErroImportacaoProduto[]>([]);
  const [filtrosSheetAberto, setFiltrosSheetAberto] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const iniciarExclusao = useCallback((p: ProdutoListaItem) => {
    setProdutoParaExcluir(p);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    const alvo = produtoParaExcluir;

    if (!alvo) {
      return;
    }

    setExcluindo(true);

    try {
      await removerProduto(alvo.id);
      setProdutoParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  }, [produtoParaExcluir, removerProduto]);

  const handleImportarArquivo = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const arquivo = e.target.files?.[0];
      if (!arquivo) return;

      e.target.value = '';
      setImportando(true);
      setErrosImportacao([]);

      try {
        const resultado = await importarProdutosMassa(arquivo);

        if (resultado.erros.length > 0) {
          setErrosImportacao(resultado.erros);
        }

        if (resultado.importados > 0) {
          toast.success(
            `${resultado.importados} produto(s) importado(s)${resultado.duplicados > 0 ? `, ${resultado.duplicados} duplicado(s) ignorado(s)` : ''}${resultado.erros.length > 0 ? `. ${resultado.erros.length} linha(s) com erro — veja o relatório abaixo.` : '.'}`,
            { duration: 6000 },
          );
        } else if (resultado.erros.length > 0) {
          toast.warning(
            `Nenhum produto importado. ${resultado.erros.length} linha(s) com erro de validação.`,
            { duration: 6000 },
          );
        } else {
          toast.info('Nenhum produto novo encontrado no arquivo.', { duration: 4000 });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao importar arquivo';
        toast.error(msg, { duration: 6000 });
      } finally {
        setImportando(false);
      }
    },
    [],
  );

  const dialogAberto = produtoParaExcluir !== null;
  const errosDialogAberto = errosImportacao.length > 0;

  return (
    <SidebarMain>
      <AlertDialog
        open={errosDialogAberto}
        onOpenChange={(aberto) => {
          if (!aberto) setErrosImportacao([]);
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Relatório de erros da importação
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {errosImportacao.length} linha(s) foram ignoradas por conter dados inválidos.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-outline-variant">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-low">
                <tr className="border-b border-outline-variant text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Linha</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Campo</th>
                  <th className="px-3 py-2 font-medium">Problema</th>
                </tr>
              </thead>
              <tbody>
                {errosImportacao.map((erro, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-outline-variant/50 last:border-0 hover:bg-surface-low/40"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {erro.linha}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs font-medium text-foreground">
                      {erro.sku || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                      {erro.campo}
                    </td>
                    <td className="px-3 py-2 text-xs text-foreground">
                      {erro.mensagem}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialogAberto}
        onOpenChange={(aberto) => {
          if (!aberto && !excluindo) {
            setProdutoParaExcluir(null);
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir produto da lista?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {produtoParaExcluir ? (
                <>
                  O produto será removido permanentemente do catálogo.{' '}
                  <span className="font-mono font-medium text-foreground">
                    {produtoParaExcluir.sku}
                  </span>{' '}
                  — {produtoParaExcluir.descricao}.
                </>
              ) : (
                ''
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={excluindo}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={excluindo}
              onClick={() => void confirmarExclusao()}
            >
              {excluindo ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Excluindo…
                </>
              ) : (
                'Excluir da lista'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Produtos
              </h1>
              <p className="text-xs text-muted-foreground">
                Catálogo de dados mestres e especificações.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => void handleImportarArquivo(e)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={importando}
                onClick={() => importInputRef.current?.click()}
              >
                {importando ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    <span className="hidden sm:inline">Importando…</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5 shrink-0" aria-hidden />
                    <span className="hidden sm:inline">Importar XLSX</span>
                    <span className="sm:hidden">Importar</span>
                  </>
                )}
              </Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/produtos/novo">
                  <Plus className="size-3.5 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Adicionar produto</span>
                  <span className="sm:hidden">Novo</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <ProdutoStatsCards
              totalSkus={stats.totalSkus}
              categoriasAtivas={stats.categoriasAtivas}
              aguardandoEan={stats.aguardandoEan}
            />

            <div className="overflow-hidden rounded-lg border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="border-b border-outline-variant/60 px-2.5 py-2">
                <ProdutoUtilityBar
                  embedded
                  compact
                  filtroCategoria={filtroCategoria}
                  onFiltroChange={setFiltroCategoria}
                  busca={busca}
                  onBuscaChange={setBusca}
                  onFiltrosAvancados={() => setFiltrosSheetAberto(true)}
                  filtrosAvancadosAtivos={filtrosAvancadosAtivos}
                />
              </div>

              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {TABLE_HEADERS.map((header) => (
                        <th
                          key={header.label || 'actions'}
                          className={compactTableHeadCellClassName(header.className)}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className={compactTableBodyClassName}>
                    {carregando ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden
                            />
                            Carregando produtos…
                          </span>
                        </td>
                      </tr>
                    ) : itemsPagina.length > 0 ? (
                      itemsPagina.map((p) => (
                        <ProdutoRow
                          key={p.id}
                          produto={p}
                          onExcluir={iniciarExclusao}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={compactTableEmptyCellClassName}
                        >
                          Nenhum produto encontrado para os filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                pagina={pagina}
                totalPaginas={totalPaginas}
                onChangePagina={setPagina}
                totalFiltrados={totalFiltrados}
                itemsInicio={itemsInicio}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                resourceLabelPlural="produtos"
                compact
              />
            </div>
          </div>
        </div>
      </main>

      <ProdutoFiltrosAvancadosSheet
        open={filtrosSheetAberto}
        onOpenChange={setFiltrosSheetAberto}
        filtros={filtrosAvancados}
        onAplicar={setFiltrosAvancados}
      />
    </SidebarMain>
  );
}
