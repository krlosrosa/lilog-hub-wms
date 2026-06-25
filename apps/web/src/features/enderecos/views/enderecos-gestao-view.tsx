'use client';

import Link from 'next/link';

import {
  AlertTriangle,
  Ban,
  ClipboardList,
  Info,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Printer,
  Search,
  Shuffle,
  TrendingUp,
  Unlock,
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
import { Pagination } from '@/features/filiais/components/pagination';
import { EnderecoActionDialogs } from '@/features/enderecos/components/endereco-action-dialogs';
import { EnderecoKpiCard } from '@/features/enderecos/components/endereco-kpi-card';
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
import {
  NIVEIS_OPCOES,
  STATUS_FILTRO_OPCOES,
  STATUS_FILTRO_TONE,
  TIPO_FILTRO_OPCOES,
  ZONA_FILTRO_OPCOES,
} from '@/features/enderecos/mocks/enderecos-mock-data';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';

const nf = new Intl.NumberFormat('pt-BR');

export function EnderecosGestaoView() {
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
  } = useEnderecosGestao();

  const todosPaginaSelecionados =
    enderecos.length > 0 && enderecos.every((e) => selecionados.has(e.id));

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gestão de Estrutura e Slotting
              </h1>
              <p className="mt-2 flex items-center gap-2 text-body-md text-muted-foreground">
                <span
                  className="size-2 animate-pulse rounded-full bg-tertiary"
                  aria-hidden
                />
                Monitoramento em tempo real — padrão ZONA RUA POSIÇÃO NÍVEL
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link href="/enderecos/novo">
                  <Plus className="size-4" aria-hidden />
                  Novo Endereço
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/enderecos/impressao-etiqueta">
                  <Printer className="size-4" aria-hidden />
                  Imprimir Etiquetas
                </Link>
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={isLoading || isSubmitting}
                onClick={bloqueioEmMassa}
              >
                <Ban className="size-4" aria-hidden />
                Bloqueio em Massa
              </Button>
            </div>
          </header>

          <div className="mb-8 grid gap-gutter md:grid-cols-2 xl:grid-cols-4">
            <EnderecoKpiCard
              icon={
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <MapPin className="size-5" aria-hidden />
                </div>
              }
              badge={
                <span className="flex items-center text-xs font-bold text-tertiary">
                  <TrendingUp className="mr-1 size-4" aria-hidden />+
                  {kpi.totalEnderecosTrendPercent}%
                </span>
              }
              label="Total de Endereços"
              value={nf.format(kpi.totalEnderecos)}
              footer={
                <p className="mt-2 text-xs text-muted-foreground">
                  {nf.format(kpi.enderecosDisponiveis ?? 0)} disponíveis ·{' '}
                  {nf.format(kpi.enderecosOcupados ?? 0)} ocupados
                </p>
              }
            />
            <EnderecoKpiCard
              icon={
                <div className="rounded-lg bg-tertiary/10 p-2 text-tertiary">
                  <TrendingUp className="size-5" aria-hidden />
                </div>
              }
              badge={
                (kpi.taxaOcupacaoGeral ?? kpi.ocupacaoGlobalPercent) >= 85 ? (
                  <span className="flex items-center text-xs font-bold text-destructive">
                    <AlertTriangle className="mr-1 size-4" aria-hidden />
                    Crítico
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    Taxa geral
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
                <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                  <Ban className="size-5" aria-hidden />
                </div>
              }
              badge={
                <span className="text-xs font-medium text-muted-foreground">
                  Manutenção
                </span>
              }
              label="Posições Bloqueadas"
              value={nf.format(kpi.posicoesBloqueadas)}
            />
            <EnderecoKpiCard
              icon={
                <div className="rounded-lg bg-secondary/10 p-2 text-secondary">
                  <Shuffle className="size-5" aria-hidden />
                </div>
              }
              badge={
                <span className="text-xs font-medium text-muted-foreground">
                  Cross-docking
                </span>
              }
              label="Cross-docking Ativos"
              value={String(kpi.crossDockingAtivos)}
            />
          </div>

          <div className="flex flex-col gap-gutter lg:flex-row">
            <aside className="w-full shrink-0 space-y-6 lg:w-80">
              <div className={cn(glassPanelClassName, 'p-6')}>
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-label-md font-bold text-foreground">
                    Filtros
                    {filtrosAtivos > 0 && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {filtrosAtivos}
                      </span>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="text-xs text-primary hover:underline"
                    disabled={filtrosAtivos === 0}
                  >
                    Limpar
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className={fieldLabelClassName}>Zona</label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {ZONA_FILTRO_OPCOES.map((zona) => (
                        <button
                          key={zona}
                          type="button"
                          onClick={() => toggleZona(zona)}
                          className={cn(
                            'rounded py-2 text-xs font-bold transition-colors',
                            filtros.zonas.includes(zona)
                              ? 'border border-primary/30 bg-primary-container/20 text-primary'
                              : 'border border-transparent bg-surface-highest text-muted-foreground hover:border-outline-variant',
                          )}
                        >
                          {zona}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabelClassName}>Nível</label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {NIVEIS_OPCOES.map((nivel) => (
                        <button
                          key={nivel}
                          type="button"
                          onClick={() => toggleNivel(nivel)}
                          className={cn(
                            'rounded py-2 font-mono text-xs font-medium transition-colors',
                            filtros.niveis.includes(nivel)
                              ? 'border border-primary/30 bg-primary-container/20 text-primary'
                              : 'border border-transparent bg-surface-highest text-muted-foreground hover:border-outline-variant',
                          )}
                        >
                          {nivel}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabelClassName}>Tipo</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TIPO_FILTRO_OPCOES.map((tipo) => (
                        <button
                          key={tipo.value}
                          type="button"
                          onClick={() => toggleTipoFiltro(tipo.value)}
                          className={cn(
                            'cursor-pointer rounded px-2 py-1 text-[10px] font-bold uppercase transition-colors',
                            filtros.tipos.includes(tipo.value)
                              ? 'border border-secondary/30 bg-secondary/10 text-secondary'
                              : 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
                          )}
                        >
                          {tipo.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabelClassName}>Status</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {STATUS_FILTRO_OPCOES.map((s) => {
                        const tone = STATUS_FILTRO_TONE[s.value];
                        const active = filtros.status.includes(s.value);

                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleStatusFiltro(s.value)}
                            className={cn(
                              'cursor-pointer rounded px-2 py-1 text-[10px] font-bold uppercase transition-colors',
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
              </div>

              <div className="rounded-xl border border-dashed border-outline-variant bg-muted/30 p-6">
                <div className="flex items-start gap-4">
                  <Info className="size-5 shrink-0 text-primary" aria-hidden />
                  <div className="space-y-2 text-caption leading-relaxed text-muted-foreground">
                    <p>
                      Padrão de endereçamento:{' '}
                      <span className="font-mono font-bold text-primary">
                        A 0001 001 10
                      </span>
                    </p>
                    <p>
                      Estrutura: Zona · Rua · Posição · Nível — único por
                      unidade (centro).
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className={cn(glassPanelClassName, 'overflow-hidden')}>
                <div className="border-b border-outline-variant px-3 py-2">
                  <div className="relative max-w-md">
                    <Search
                      className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="search"
                      placeholder="Buscar por código, zona ou rua (ex: A 0001, 0005)..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className={cn(
                        fieldInputClassName,
                        'h-8 w-full py-1 pl-8 text-xs',
                      )}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                      Carregando endereços...
                    </div>
                  ) : enderecos.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      Nenhum endereço encontrado com os filtros atuais.
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="sticky top-0 bg-surface-highest/50 backdrop-blur-md">
                          <th className="w-8 border-b border-outline-variant px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={todosPaginaSelecionados}
                              onChange={toggleTodosPagina}
                              className="size-3.5 rounded border-outline-variant bg-background text-primary"
                              aria-label="Selecionar todos da página"
                            />
                          </th>
                          {[
                            { label: 'Código', className: 'min-w-[130px]' },
                            { label: 'Zona', className: 'w-12' },
                            { label: 'Rua', className: 'w-14 hidden md:table-cell' },
                            { label: 'Pos.', className: 'w-12 hidden lg:table-cell' },
                            { label: 'Nív.', className: 'w-12' },
                            { label: 'Tipo', className: 'hidden sm:table-cell' },
                            { label: 'Status', className: 'w-24' },
                            { label: 'Cap.', className: 'w-28' },
                            { label: 'ABC', className: 'w-10 text-center' },
                            { label: '', className: 'w-8' },
                          ].map((h) => (
                            <th
                              key={h.label || 'actions'}
                              className={cn(
                                'border-b border-outline-variant px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                                h.className,
                              )}
                            >
                              {h.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30">
                        {enderecos.map((item) => (
                          <tr
                            key={item.id}
                            className={cn(
                              'group transition-colors hover:bg-surface-highest/50',
                              item.status === 'bloqueado' && 'bg-destructive/5',
                              item.status === 'inventario' && 'bg-secondary/5',
                              item.status === 'inativo' && 'opacity-60',
                            )}
                          >
                            <td className="px-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={selecionados.has(item.id)}
                                onChange={() => toggleSelecionado(item.id)}
                                className="size-3.5 rounded border-outline-variant bg-background text-primary"
                                aria-label={`Selecionar ${item.enderecoId}`}
                              />
                            </td>
                            <td className="px-2 py-1.5">
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
                            <td className="px-2 py-1.5 font-bold text-foreground">
                              {item.zona}
                            </td>
                            <td className="hidden px-2 py-1.5 font-mono text-muted-foreground md:table-cell">
                              {item.rua}
                            </td>
                            <td className="hidden px-2 py-1.5 font-mono text-muted-foreground lg:table-cell">
                              {item.posicao}
                            </td>
                            <td className="px-2 py-1.5 font-mono text-muted-foreground">
                              {item.nivel}
                            </td>
                            <td className="hidden px-2 py-1.5 text-muted-foreground sm:table-cell">
                              {ENDERECO_TIPO_LABELS[item.tipo]}
                            </td>
                            <td className="px-2 py-1.5">
                              <EnderecoStatusBadge status={item.status} compact />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="whitespace-nowrap tabular-nums text-[11px] text-foreground">
                                  {nf.format(item.capacidadeKg)} kg
                                </span>
                                <div className="h-0.5 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
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
                            <td className="px-2 py-1.5 text-center">
                              <CurvaAbcBadge curva={item.curvaAbc} compact />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:text-primary"
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

          <nav className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" asChild size="sm">
              <Link href="/enderecos/novo">Novo Endereço</Link>
            </Button>
            <Button variant="outline" asChild size="sm">
              <Link href="/enderecos/mapa-calor">Mapa de Calor</Link>
            </Button>
          </nav>
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
      </main>
    </SidebarMain>
  );
}
