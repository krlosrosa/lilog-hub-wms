'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  AlertTriangle,
  Ban,
  ClipboardList,
  FileDown,
  LayoutGrid,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Printer,
  Search,
  Shuffle,
  TrendingUp,
  Unlock,
  Upload,
} from 'lucide-react';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import { EnderecoActionDialogs } from '@/features/enderecos/components/endereco-action-dialogs';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
import { EnderecosImportacaoDialog } from '@/features/enderecos/components/enderecos-importacao-dialog';
import {
  CurvaAbcBadge,
  EnderecoStatusBadge,
} from '@/features/enderecos/components/endereco-status-badge';
import {
  fieldInputClassName,
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/enderecos/components/form-field-classes';
import { useEnderecosGestao } from '@/features/enderecos/hooks/use-enderecos-gestao';
import { downloadEnderecoTemplate } from '@/features/enderecos/lib/endereco-api';
import {
  NIVEIS_OPCOES,
  STATUS_FILTRO_OPCOES,
  STATUS_FILTRO_TONE,
  TIPO_FILTRO_OPCOES,
  ZONA_FILTRO_OPCOES,
} from '@/features/enderecos/mocks/enderecos-mock-data';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';

const nf = new Intl.NumberFormat('pt-BR');

const FILTER_CHIP_CLASS =
  'rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors';

export function EnderecosGestaoView() {
  const [importDialogAberto, setImportDialogAberto] = useState(false);

  const {
    isLoading,
    isSubmitting,
    kpi,
    enderecos,
    filtros,
    filtrosAtivos,
    limparFiltros,
    toggleZona,
    toggleNivel,
    toggleTipoFiltro,
    toggleStatusFiltro,
    busca,
    setBusca,
    pagina,
    setPagina,
    totalPaginas,
    totalFiltrados,
    itemsInicio,
    pageSize,
    selecionados,
    toggleSelecionado,
    toggleTodosPagina,
    bloqueioEmMassa,
    dialogState,
    closeDialog,
    openBlockDialog,
    openUnblockDialog,
    openChangeStatusDialog,
    confirmBlock,
    confirmUnblock,
    confirmChangeStatus,
    confirmMassBlock,
    inventariarEndereco,
    inativarEndereco,
    recarregar,
  } = useEnderecosGestao();

  const todosPaginaSelecionados =
    enderecos.length > 0 && enderecos.every((e) => selecionados.has(e.id));

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-4 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4 md:space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Estoque · WMS
              </p>
              <h1 className="text-headline-md font-bold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Endereços
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
                Padrão{' '}
                <span className="font-mono font-semibold text-primary">
                  ZONA · RUA · POSIÇÃO · NÍVEL
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1 sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Buscar código, zona ou rua..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={cn(
                    fieldInputClassName,
                    'h-9 w-full py-1.5 pl-8 pr-3 text-xs sm:w-56',
                  )}
                />
              </div>
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/enderecos/novo">
                  <Plus className="size-3.5" aria-hidden />
                  Novo
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setImportDialogAberto(true)}
              >
                <Upload className="size-3.5" aria-hidden />
                Importar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={downloadEnderecoTemplate}
              >
                <FileDown className="size-3.5" aria-hidden />
                Modelo
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/enderecos/impressao-etiqueta">
                  <Printer className="size-3.5" aria-hidden />
                  Etiquetas
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/enderecos/mapa-calor">
                  <LayoutGrid className="size-3.5" aria-hidden />
                  Mapa
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={isLoading || isSubmitting || selecionados.size === 0}
                onClick={bloqueioEmMassa}
              >
                <Ban className="size-3.5" aria-hidden />
                Bloquear
                {selecionados.size > 0 && (
                  <span className="rounded-full bg-destructive-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">
                    {selecionados.size}
                  </span>
                )}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
            <EnderecoKpiCard
              icon={
                <MapPin
                  className="size-4 shrink-0 text-primary"
                  aria-hidden
                />
              }
              badge={
                <span className="flex items-center text-[10px] font-bold text-tertiary">
                  <TrendingUp className="mr-0.5 size-3" aria-hidden />+
                  {kpi.totalEnderecosTrendPercent}%
                </span>
              }
              label="Total de Endereços"
              value={nf.format(kpi.totalEnderecos)}
              footer={
                <p className="text-[10px] text-muted-foreground">
                  {nf.format(kpi.enderecosDisponiveis ?? 0)} disp. ·{' '}
                  {nf.format(kpi.enderecosOcupados ?? 0)} ocup.
                </p>
              }
            />
            <EnderecoKpiCard
              icon={
                <TrendingUp
                  className="size-4 shrink-0 text-tertiary"
                  aria-hidden
                />
              }
              badge={
                (kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent) >= 85 ? (
                  <span className="flex items-center text-[10px] font-bold text-destructive">
                    <AlertTriangle className="mr-0.5 size-3" aria-hidden />
                    Crítico
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Geral
                  </span>
                )
              }
              label="Ocupação Global"
              value={`${kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent}%`}
              progressPercent={kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent}
              progressClassName="bg-tertiary"
            />
            <EnderecoKpiCard
              variant="critical"
              icon={
                <Ban
                  className="size-4 shrink-0 text-destructive"
                  aria-hidden
                />
              }
              badge={
                <span className="text-[10px] font-medium text-muted-foreground">
                  Manutenção
                </span>
              }
              label="Posições Bloqueadas"
              value={nf.format(kpi.posicoesBloqueadas)}
            />
            <EnderecoKpiCard
              icon={
                <Shuffle
                  className="size-4 shrink-0 text-secondary"
                  aria-hidden
                />
              }
              badge={
                <span className="text-[10px] font-medium text-muted-foreground">
                  Ativos
                </span>
              }
              label="Cross-docking"
              value={String(kpi.crossDockingAtivos)}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:w-60 xl:w-64">
              <div className={cn(glassPanelClassName, 'p-3 md:p-4')}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-foreground">
                    Filtros
                    {filtrosAtivos > 0 && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {filtrosAtivos}
                      </span>
                    )}
                  </h2>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="text-[11px] font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
                    disabled={filtrosAtivos === 0}
                  >
                    Limpar
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={cn(fieldLabelClassName, 'text-xs')}>
                      Zona
                    </label>
                    <div className="mt-1.5 grid grid-cols-4 gap-1">
                      {ZONA_FILTRO_OPCOES.map((zona) => (
                        <button
                          key={zona}
                          type="button"
                          onClick={() => toggleZona(zona)}
                          className={cn(
                            FILTER_CHIP_CLASS,
                            filtros.zonas.includes(zona)
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-transparent bg-surface-highest text-muted-foreground hover:border-outline-variant',
                          )}
                        >
                          {zona}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn(fieldLabelClassName, 'text-xs')}>
                      Nível
                    </label>
                    <div className="mt-1.5 grid grid-cols-4 gap-1">
                      {NIVEIS_OPCOES.map((nivel) => (
                        <button
                          key={nivel}
                          type="button"
                          onClick={() => toggleNivel(nivel)}
                          className={cn(
                            FILTER_CHIP_CLASS,
                            'font-mono normal-case',
                            filtros.niveis.includes(nivel)
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-transparent bg-surface-highest text-muted-foreground hover:border-outline-variant',
                          )}
                        >
                          {nivel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn(fieldLabelClassName, 'text-xs')}>
                      Tipo
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {TIPO_FILTRO_OPCOES.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => toggleTipoFiltro(tipo.value)}
                          className={cn(
                            FILTER_CHIP_CLASS,
                            filtros.tipos.includes(tipo.value)
                              ? 'border border-secondary/30 bg-secondary/10 text-secondary'
                              : 'border border-outline-variant/60 bg-surface-highest text-foreground hover:bg-muted',
                          )}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn(fieldLabelClassName, 'text-xs')}>
                      Status
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {STATUS_FILTRO_OPCOES.map((s) => {
                        const tone = STATUS_FILTRO_TONE[s.value];
                        const active = filtros.status.includes(s.value);

                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleStatusFiltro(s.value)}
                            className={cn(
                              FILTER_CHIP_CLASS,
                              active ? tone.active : tone.inactive,
                            )}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <p className="mt-3 border-t border-outline-variant/60 pt-3 text-[10px] leading-relaxed text-muted-foreground">
                  Exemplo:{' '}
                  <span className="font-mono font-semibold text-primary">
                    A 001 0001 10
                  </span>{' '}
                  — único por centro.
                </p>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className={cn(glassPanelClassName, 'overflow-hidden')}>
                <div className="flex items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    {isLoading ? (
                      'Carregando...'
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">
                          {nf.format(totalFiltrados)}
                        </span>{' '}
                        endereço{totalFiltrados === 1 ? '' : 's'}
                        {selecionados.size > 0 && (
                          <span className="ml-1 text-primary">
                            · {selecionados.size} selecionado
                            {selecionados.size === 1 ? '' : 's'}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Carregando endereços...
                    </div>
                  ) : enderecos.length === 0 ? (
                    <p className={compactTableEmptyCellClassName}>
                      Nenhum endereço encontrado com os filtros atuais.
                    </p>
                  ) : (
                    <table className={compactTableClassName}>
                      <thead>
                        <tr className={compactTableHeadRowClassName}>
                          <th className={compactTableHeadCellClassName('w-8')}>
                            <input
                              type="checkbox"
                              checked={todosPaginaSelecionados}
                              onChange={toggleTodosPagina}
                              className="size-3.5 rounded border-outline-variant bg-background text-primary"
                              aria-label="Selecionar todos da página"
                            />
                          </th>
                          {[
                            { label: 'Código', className: 'min-w-[120px]' },
                            { label: 'Zona', className: 'w-10' },
                            { label: 'Rua', className: 'w-12 hidden md:table-cell' },
                            { label: 'Pos.', className: 'w-10 hidden lg:table-cell' },
                            { label: 'Nív.', className: 'w-10' },
                            { label: 'Tipo', className: 'hidden sm:table-cell' },
                            { label: 'Status', className: 'w-20' },
                            { label: 'Cap.', className: 'w-24' },
                            { label: 'ABC', className: 'w-8 text-center' },
                            { label: '', className: 'w-7' },
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
                        {enderecos.map((item) => (
                          <tr
                            key={item.id}
                            className={cn(
                              compactTableRowClassName,
                              item.status === 'bloqueado' && 'bg-destructive/5',
                              item.status === 'inventario' && 'bg-secondary/5',
                              item.status === 'inativo' && 'opacity-60',
                            )}
                          >
                            <td className={compactTableCellClassName}>
                              <input
                                type="checkbox"
                                checked={selecionados.has(item.id)}
                                onChange={() => toggleSelecionado(item.id)}
                                className="size-3.5 rounded border-outline-variant bg-background text-primary"
                                aria-label={`Selecionar ${item.enderecoId}`}
                              />
                            </td>
                            <td className={compactTableCellClassName}>
                              <Link
                                href={`/enderecos/${item.id}`}
                                className={cn(
                                  'font-mono text-[11px] font-semibold hover:underline',
                                  item.status === 'bloqueado'
                                    ? 'text-destructive'
                                    : item.status === 'inativo'
                                      ? 'text-muted-foreground'
                                      : 'text-primary',
                                )}
                              >
                                {item.enderecoId}
                              </Link>
                            </td>
                            <td className={cn(compactTableCellClassName, 'font-bold')}>
                              {item.zona}
                            </td>
                            <td
                              className={cn(
                                compactTableCellClassName,
                                'hidden font-mono text-muted-foreground md:table-cell',
                              )}
                            >
                              {item.rua}
                            </td>
                            <td
                              className={cn(
                                compactTableCellClassName,
                                'hidden font-mono text-muted-foreground lg:table-cell',
                              )}
                            >
                              {item.posicao}
                            </td>
                            <td
                              className={cn(
                                compactTableCellClassName,
                                'font-mono text-muted-foreground',
                              )}
                            >
                              {item.nivel}
                            </td>
                            <td
                              className={cn(
                                compactTableCellClassName,
                                'hidden text-muted-foreground sm:table-cell',
                              )}
                            >
                              {ENDERECO_TIPO_LABELS[item.tipo]}
                            </td>
                            <td className={compactTableCellClassName}>
                              <EnderecoStatusBadge status={item.status} compact />
                            </td>
                            <td className={compactTableCellClassName}>
                              <div className="flex items-center gap-1">
                                <span className="whitespace-nowrap tabular-nums text-[11px]">
                                  {nf.format(item.capacidadeKg)} kg
                                </span>
                                <div className="h-0.5 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={cn(
                                      'h-full',
                                      item.status === 'bloqueado'
                                        ? 'bg-destructive'
                                        : item.status === 'inventario'
                                          ? 'bg-secondary'
                                          : 'bg-primary',
                                    )}
                                    style={{
                                      width: `${item.ocupacaoPercent}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className={cn(compactTableCellClassName, 'text-center')}>
                              <CurvaAbcBadge curva={item.curvaAbc} compact />
                            </td>
                            <td className={cn(compactTableCellClassName, 'text-right')}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="rounded p-0.5 text-muted-foreground opacity-60 transition-all hover:bg-muted hover:text-primary group-hover:opacity-100"
                                    aria-label={`Mais opções para ${item.enderecoId}`}
                                  >
                                    <MoreVertical className="size-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {item.status !== 'bloqueado' &&
                                    item.status !== 'inativo' &&
                                    item.status !== 'inventario' && (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          openBlockDialog(
                                            item.id,
                                            item.enderecoId,
                                          )
                                        }
                                      >
                                        <Ban className="mr-2 size-4" aria-hidden />
                                        Bloquear
                                      </DropdownMenuItem>
                                    )}
                                  {item.status === 'bloqueado' && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openUnblockDialog(
                                          item.id,
                                          item.enderecoId,
                                          item.ocupacaoPercent,
                                        )
                                      }
                                    >
                                      <Unlock
                                        className="mr-2 size-4"
                                        aria-hidden
                                      />
                                      Desbloquear
                                    </DropdownMenuItem>
                                  )}
                                  {item.status !== 'inventario' &&
                                    item.status !== 'inativo' && (
                                      <DropdownMenuItem
                                        onClick={() =>
                                          void inventariarEndereco(
                                            item.id,
                                            item.enderecoId,
                                          )
                                        }
                                      >
                                        <ClipboardList
                                          className="mr-2 size-4"
                                          aria-hidden
                                        />
                                        Inventariar
                                      </DropdownMenuItem>
                                    )}
                                  {item.status !== 'inativo' && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        void inativarEndereco(
                                          item.id,
                                          item.enderecoId,
                                        )
                                      }
                                    >
                                      Inativar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openChangeStatusDialog(
                                        item.id,
                                        item.enderecoId,
                                        item.status,
                                      )
                                    }
                                  >
                                    Alterar Status
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <Pagination
                  pagina={pagina}
                  totalPaginas={totalPaginas}
                  onChangePagina={setPagina}
                  totalFiltrados={totalFiltrados}
                  itemsInicio={itemsInicio}
                  pageSize={pageSize}
                  resourceLabelPlural="endereços"
                />
              </div>
            </div>
          </div>
        </div>

        <EnderecoActionDialogs
          dialogState={dialogState}
          isSubmitting={isSubmitting}
          onClose={closeDialog}
          onConfirmBlock={(motivo) => void confirmBlock(motivo)}
          onConfirmUnblock={(motivo) => void confirmUnblock(motivo)}
          onConfirmChangeStatus={(status, motivo) =>
            void confirmChangeStatus(status, motivo)
          }
          onConfirmMassBlock={(motivo) => void confirmMassBlock(motivo)}
        />

        <EnderecosImportacaoDialog
          open={importDialogAberto}
          onOpenChange={setImportDialogAberto}
          onSuccess={() => void recarregar()}
        />
      </main>
    </SidebarMain>
  );
}
