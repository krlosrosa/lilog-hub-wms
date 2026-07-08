'use client';

import Link from 'next/link';

import { Button, cn, AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@lilog/ui';
import {
  CloudUpload,
  FileSpreadsheet,
  Loader2,
  Map,
  Monitor,
  Printer,
  Save,
  Truck,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableClassName,
  compactTableEmptyCellClassName,
} from '@/components/ui/compact-table-classes';

import { AdicionarNfSheet } from '@/features/transporte/components/adicionar-nf-sheet';
import { AlocarPlacaSheet } from '@/features/transporte/components/alocar-placa-sheet';
import { ItinerarioImportModal } from '@/features/transporte/components/itinerario-import-modal';
import { ImprimirMapasModal } from '@/features/transporte/components/imprimir-mapas-modal';
import { PrioridadeTransporteModal } from '@/features/transporte/components/prioridade-transporte-modal';
import { RemessaUploadModal } from '@/features/transporte/components/remessa-upload-modal';
import { RoteirizacaoImportModal } from '@/features/transporte/components/roteirizacao-import-modal';
import { TransporteQuickFilters } from '@/features/transporte/components/transporte-quick-filters';
import { TransporteRow } from '@/features/transporte/components/transporte-row';
import { TransporteSummaryCards } from '@/features/transporte/components/transporte-summary-cards';
import { UploadConflitoDialog } from '@/features/transporte/components/upload-conflito-dialog';
import { useAlocacaoPlaca } from '@/features/transporte/hooks/use-alocacao-placa';
import type { FiltroStatusTransporte } from '@/features/transporte/types/transporte.schema';
import { STATUS_TRANSPORTE_LABELS } from '@/features/transporte/types/transporte.schema';

const STATUS_OPTIONS: { value: FiltroStatusTransporte; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...(
    Object.entries(STATUS_TRANSPORTE_LABELS) as [
      Exclude<FiltroStatusTransporte, 'todos'>,
      string,
    ][]
  ).map(([value, label]) => ({ value, label })),
];

const TABLE_HEADERS = [
  { key: 'select', label: '', className: 'w-10' },
  { key: 'expand', label: '', className: 'w-10' },
  { key: 'rota', label: 'Rota', className: 'w-[120px] max-w-[120px]' },
  { key: 'data', label: 'Data', className: 'hidden w-[88px] sm:table-cell' },
  { key: 'itinerario', label: 'Itinerário', className: 'hidden w-[108px] max-w-[108px] sm:table-cell' },
  { key: 'bairro', label: 'Bairro', className: 'hidden w-[100px] max-w-[100px] sm:table-cell' },
  { key: 'nfs', label: 'NFs', className: 'w-14 text-center' },
  { key: 'reentrega', label: 'Reentrega', className: 'hidden w-[76px] sm:table-cell text-center' },
  { key: 'peso', label: 'Peso', className: 'hidden w-[80px] sm:table-cell text-right' },
  { key: 'perfil-esperado', label: 'Perfil esp.', className: 'hidden w-[88px] lg:table-cell' },
  { key: 'perfil-alocado', label: 'Perfil aloc.', className: 'hidden w-[88px] lg:table-cell' },
  { key: 'perfil', label: 'Perfil', className: 'hidden w-[140px] md:table-cell lg:hidden' },
  { key: 'custo-previsto', label: 'Custo prev.', className: 'hidden w-[92px] md:table-cell text-right' },
  { key: 'custo-ton', label: 'R$/Ton', className: 'hidden w-[80px] lg:table-cell text-right' },
  { key: 'dropsize', label: 'Dropsize', className: 'hidden w-[84px] lg:table-cell text-right' },
  { key: 'ocupacao', label: 'Ocupação', className: 'hidden w-[84px] lg:table-cell text-right' },
  { key: 'prioridade', label: 'Prioridade', className: 'hidden w-[88px] sm:table-cell' },
  { key: 'status', label: 'Status', className: 'w-[88px]' },
  { key: 'mapa', label: 'Mapa', className: 'w-12 text-center' },
  { key: 'transportadora', label: 'Transportadora', className: 'hidden w-[120px] md:table-cell' },
  { key: 'placa', label: 'Placa', className: 'w-[84px]' },
  { key: 'actions', label: '', className: 'w-[108px] text-right' },
] as const;

const filterInputClass = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

export function AlocacaoPlacaView() {
  const {
    summary,
    transportes,
    transportesTodos,
    veiculos,
    perfisTarifas,
    transportadorasOpcoes,
    regioes,
    transportesPendentes,
    filtroStatus,
    setFiltroStatus,
    filtroRegiao,
    setFiltroRegiao,
    intervaloData,
    setIntervaloData,
    filtroRapido,
    setFiltroRapido,
    contadoresFiltroRapido,
    intervaloDataPreenchido,
    selecionados,
    expandidos,
    processando,
    carregandoTransportes,
    carregandoVeiculos,
    todosSelecionados,
    modalUploadAberto,
    modalRoteirizacaoAberto,
    modalItinerarioAberto,
    modalAlocarAberto,
    modalPrioridadeAberto,
    modalImprimirAberto,
    modalAdicionarNfAberto,
    transporteSelecionado,
    transportePrioridadeSelecionado,
    transporteAdicionarNfSelecionado,
    transportesSelecionados,
    gerandoPdfMapas,
    unidadeId,
    uploadLoteIdTorre,
    torreControleHref,
    toggleSelecionado,
    toggleSelecionarTodos,
    toggleExpandido,
    abrirModalUpload,
    fecharModalUpload,
    abrirModalRoteirizacao,
    fecharModalRoteirizacao,
    abrirModalItinerario,
    fecharModalItinerario,
    abrirModalAlocar,
    fecharModalAlocar,
    abrirModalPrioridade,
    fecharModalPrioridade,
    abrirModalAdicionarNf,
    fecharModalAdicionarNf,
    abrirModalImprimir,
    fecharModalImprimir,
    imprimirMapas,
    confirmarUpload,
    importarRoteirizacao,
    importarItinerario,
    confirmarAlocacao,
    confirmarPrioridade,
    salvarAlocacoes,
    temAlocacoesPendentesSalvar,
    alocacoesPendentesSalvar,
    navegarParaGerarMapas,
    navegarParaImpressaoMapaSeparacao,
    deleteDialog,
    desalocarReentregaDialog,
    excluirMapaConfReentregaDialog,
    uploadConflitoDialog,
    abrirDeleteDialog,
    fecharDeleteDialog,
    confirmarExclusaoTransporte,
    abrirDesalocarReentregaDialog,
    fecharDesalocarReentregaDialog,
    confirmarDesalocarReentrega,
    abrirExcluirMapaConfReentregaDialog,
    fecharExcluirMapaConfReentregaDialog,
    confirmarExcluirMapaConfReentrega,
    fecharUploadConflitoDialog,
    recarregarTransportes,
  } = useAlocacaoPlaca();

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Truck className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Operacional
                </span>
              </div>
              <h1 className="text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                Expedição de Cargas
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Gerencie remessas, importe roteirização e prepare a geração de mapas.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                onClick={abrirModalUpload}
              >
                <CloudUpload className="size-3.5" aria-hidden />
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                disabled={processando || transportesTodos.length === 0}
                onClick={abrirModalRoteirizacao}
              >
                <FileSpreadsheet className="size-3.5" aria-hidden />
                Importar Roteirização
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                disabled={processando || transportesTodos.length === 0}
                onClick={abrirModalItinerario}
              >
                <FileSpreadsheet className="size-3.5" aria-hidden />
                Importar Itinerário
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={processando || !temAlocacoesPendentesSalvar}
                onClick={() => void salvarAlocacoes()}
              >
                {processando ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Save className="size-3.5" aria-hidden />
                )}
                Salvar Alocações
                {alocacoesPendentesSalvar.size > 0 && (
                  <span className="rounded-full bg-primary-foreground/20 px-1.5 py-px text-[9px] font-bold">
                    {alocacoesPendentesSalvar.size}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                disabled={processando || transportes.length === 0}
                onClick={navegarParaGerarMapas}
              >
                <Map className="size-3.5" aria-hidden />
                Gerar Mapas
                {selecionados.size > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-px text-[9px] font-bold text-primary">
                    {selecionados.size}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                disabled={processando || selecionados.size === 0}
                onClick={abrirModalImprimir}
              >
                <Printer className="size-3.5" aria-hidden />
                Imprimir Mapas
                {selecionados.size > 0 && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-px text-[9px] font-bold text-primary">
                    {selecionados.size}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-outline-variant text-xs"
                disabled={processando || transportes.length === 0}
                onClick={navegarParaImpressaoMapaSeparacao}
              >
                <Printer className="size-3.5" aria-hidden />
                Mapas de Separação
              </Button>
              {torreControleHref ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-primary/40 bg-primary/[0.04] text-xs text-primary"
                >
                  <Link href={torreControleHref}>
                    <Monitor className="size-3.5" aria-hidden />
                    Torre de Controle
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-outline-variant text-xs"
                  disabled
                  title="Importe remessas ou filtre transportes de um lote para abrir a torre"
                >
                  <Monitor className="size-3.5" aria-hidden />
                  Torre de Controle
                </Button>
              )}
            </div>
          </header>

          <TransporteSummaryCards summary={summary} />

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-glass-bg shadow-inner-glow backdrop-blur-glass">
              <div className="space-y-2.5 border-b border-outline-variant bg-surface-low/30 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    {transportesPendentes.length} pendentes
                  </span>
                  <span className="hidden h-3.5 w-px bg-outline-variant sm:block" />
                  <div className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      Período
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    </span>
                    <input
                      type="date"
                      required
                      value={intervaloData.dataInicio}
                      onChange={(event) =>
                        setIntervaloData({
                          ...intervaloData,
                          dataInicio: event.target.value,
                        })
                      }
                      aria-label="Data início do período (obrigatório)"
                      className={cn(
                        filterInputClass,
                        !intervaloDataPreenchido &&
                          !intervaloData.dataInicio.trim() &&
                          'border-destructive/50 ring-1 ring-destructive/20',
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">até</span>
                    <input
                      type="date"
                      required
                      value={intervaloData.dataFim}
                      onChange={(event) =>
                        setIntervaloData({
                          ...intervaloData,
                          dataFim: event.target.value,
                        })
                      }
                      aria-label="Data fim do período (obrigatório)"
                      className={cn(
                        filterInputClass,
                        !intervaloDataPreenchido &&
                          !intervaloData.dataFim.trim() &&
                          'border-destructive/50 ring-1 ring-destructive/20',
                      )}
                    />
                  </div>
                  <select
                    value={filtroStatus}
                    onChange={(event) =>
                      setFiltroStatus(
                        event.target.value as FiltroStatusTransporte,
                      )
                    }
                    aria-label="Filtrar por status"
                    className={filterInputClass}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filtroRegiao}
                    onChange={(event) => setFiltroRegiao(event.target.value)}
                    aria-label="Filtrar por região"
                    className={filterInputClass}
                  >
                    <option value="todas">Todas regiões</option>
                    {regioes.map((regiao) => (
                      <option key={regiao} value={regiao}>
                        {regiao}
                      </option>
                    ))}
                  </select>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {transportes.length} transporte
                    {transportes.length !== 1 ? 's' : ''}
                    {uploadLoteIdTorre ? (
                      <>
                        {' '}
                        · lote{' '}
                        <span className="font-mono text-foreground">
                          {uploadLoteIdTorre.slice(0, 8)}…
                        </span>
                      </>
                    ) : null}
                  </span>
                </div>

                <TransporteQuickFilters
                  filtroAtivo={filtroRapido}
                  contadores={contadoresFiltroRapido}
                  onFiltroChange={setFiltroRapido}
                />
              </div>

              <div className="overflow-x-auto">
                <table
                  className={cn(
                    compactTableClassName,
                    'min-w-[1280px] table-auto text-[11px]',
                  )}
                >
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-outline-variant bg-surface-highest/90 backdrop-blur-md">
                      <th className="w-10 px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={todosSelecionados}
                          onChange={toggleSelecionarTodos}
                          aria-label="Selecionar todos"
                          className="size-3.5 rounded border-input accent-primary"
                        />
                      </th>
                      {TABLE_HEADERS.slice(1).map((header) => (
                        <th
                          key={header.key}
                          className={cn(
                            'px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                            header.className,
                          )}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {carregandoTransportes ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={cn(
                            compactTableEmptyCellClassName,
                            'py-16',
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Loader2
                              className="size-8 animate-spin text-muted-foreground"
                              aria-hidden
                            />
                            <p className="text-sm font-medium text-foreground">
                              Carregando transportes...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : transportes.length ? (
                      transportes.map((transporte) => (
                        <TransporteRow
                          key={transporte.id}
                          transporte={transporte}
                          perfisTarifas={perfisTarifas}
                          selecionado={selecionados.has(transporte.id)}
                          expandido={expandidos.has(transporte.id)}
                          processando={processando}
                          onToggleSelecionado={toggleSelecionado}
                          onToggleExpandido={toggleExpandido}
                          onAlocar={abrirModalAlocar}
                          onAbrirPrioridade={abrirModalPrioridade}
                          onAdicionarNf={abrirModalAdicionarNf}
                          onExcluir={abrirDeleteDialog}
                          onDesalocarReentrega={abrirDesalocarReentregaDialog}
                          onExcluirMapaConferenciaReentrega={
                            abrirExcluirMapaConfReentregaDialog
                          }
                        />
                      ))
                    ) : !intervaloDataPreenchido ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={cn(
                            compactTableEmptyCellClassName,
                            'py-16',
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Truck className="size-8 text-muted-foreground/40" aria-hidden />
                            <p className="text-sm font-medium text-foreground">
                              Selecione o período de expedição
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Informe data início e data fim para listar os transportes.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEADERS.length}
                          className={cn(
                            compactTableEmptyCellClassName,
                            'py-16',
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Truck className="size-8 text-muted-foreground/40" aria-hidden />
                            <p className="text-sm font-medium text-foreground">
                              Nenhum transporte encontrado
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ajuste os filtros para ver outros resultados.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </section>
        </div>
      </main>

      <RemessaUploadModal
        open={modalUploadAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalUpload();
        }}
        processando={processando}
        onConfirmar={(payload) => void confirmarUpload(payload)}
      />

      <RoteirizacaoImportModal
        open={modalRoteirizacaoAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalRoteirizacao();
        }}
        processando={processando}
        onConfirmar={importarRoteirizacao}
      />

      <ItinerarioImportModal
        open={modalItinerarioAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalItinerario();
        }}
        processando={processando}
        onConfirmar={importarItinerario}
      />

      <PrioridadeTransporteModal
        open={modalPrioridadeAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalPrioridade();
        }}
        transporte={transportePrioridadeSelecionado}
        processando={processando}
        onConfirmar={(payload) => void confirmarPrioridade(payload)}
      />

      <AdicionarNfSheet
        open={modalAdicionarNfAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalAdicionarNf();
        }}
        transporte={transporteAdicionarNfSelecionado}
        unidadeId={unidadeId}
        onVinculado={recarregarTransportes}
      />

      <AlocarPlacaSheet
        open={modalAlocarAberto}
        onOpenChange={(aberto) => {
          if (!aberto) fecharModalAlocar();
        }}
        transporte={transporteSelecionado}
        veiculos={veiculos}
        transportes={transportesTodos}
        perfisTarifas={perfisTarifas}
        processando={processando}
        carregandoVeiculos={carregandoVeiculos}
        transportadorasOpcoes={transportadorasOpcoes}
        onConfirmar={(veiculoId, pagamento) =>
          confirmarAlocacao(veiculoId, pagamento)
        }
      />

      <ImprimirMapasModal
        aberto={modalImprimirAberto}
        unidadeId={unidadeId}
        transportesSelecionados={transportesSelecionados}
        gerando={gerandoPdfMapas}
        onConfirmar={(configuracaoImpressaoId, tipoMapa) =>
          void imprimirMapas(configuracaoImpressaoId, tipoMapa)
        }
        onCancelar={fecharModalImprimir}
      />

      <UploadConflitoDialog
        aberto={uploadConflitoDialog.open}
        rotasConflitantes={uploadConflitoDialog.rotas}
        onFechar={fecharUploadConflitoDialog}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open && !processando) {
            fecharDeleteDialog();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir transporte?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta ação não pode ser desfeita. O transporte{' '}
              <span className="font-semibold text-foreground">
                {deleteDialog.target?.rota}
              </span>{' '}
              com {deleteDialog.target?.quantidadeRemessas ?? 0} remessa
              {(deleteDialog.target?.quantidadeRemessas ?? 0) !== 1 ? 's' : ''}{' '}
              será removido permanentemente.
              {deleteDialog.target?.status === 'ALOCADO' && (
                <> A alocação de placa também será perdida.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={processando}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={processando}
              onClick={() => void confirmarExclusaoTransporte()}
            >
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={desalocarReentregaDialog.open}
        onOpenChange={(open) => {
          if (!open && !processando) {
            fecharDesalocarReentregaDialog();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Desalocar reentrega?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Confirma a remoção da NF{' '}
              <span className="font-semibold text-foreground">
                {desalocarReentregaDialog.remessa?.remessa}
              </span>{' '}
              do transporte{' '}
              <span className="font-semibold text-foreground">
                {desalocarReentregaDialog.transporte?.rota}
              </span>
              . A NF voltará a ficar disponível para vinculação em outro
              transporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={processando}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={processando}
              onClick={() => void confirmarDesalocarReentrega()}
            >
              {processando ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Desalocando...
                </>
              ) : (
                'Desalocar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={excluirMapaConfReentregaDialog.open}
        onOpenChange={(open) => {
          if (!open && !processando) {
            fecharExcluirMapaConfReentregaDialog();
          }
        }}
      >
        <AlertDialogContent className="border-outline-variant bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Excluir mapa de conferência reentrega?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Remove o mapa de conferência reentrega do transporte{' '}
              <span className="font-semibold text-foreground">
                {excluirMapaConfReentregaDialog.transporte?.rota}
              </span>
              . Após excluir, as NFs de reentrega poderão ser desalocadas e
              realocadas em outro transporte. O mapa de separação/conferência
              normal não será afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={processando}>
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={processando}
              onClick={() => void confirmarExcluirMapaConfReentrega()}
            >
              {processando ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMain>
  );
}
