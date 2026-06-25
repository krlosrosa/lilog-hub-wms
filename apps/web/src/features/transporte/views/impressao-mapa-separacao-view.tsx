'use client';

import Link from 'next/link';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import {
  ChevronRight,
  Eye,
  Loader2,
  Printer,
  QrCode,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { BalanceamentoRotaPanel } from '@/features/transporte/components/picking/balanceamento-rota-panel';
import { EstrategiaConfigPanel } from '@/features/transporte/components/picking/estrategia-config-panel';
import { EstrategiaSeparacaoPanel } from '@/features/transporte/components/picking/estrategia-separacao-panel';
import { IndicadoresAuditoriaPanel } from '@/features/transporte/components/picking/indicadores-auditoria-panel';
import { MapaPickingPreview } from '@/features/transporte/components/picking/mapa-picking-preview';
import { PedidosSelecaoPanel } from '@/features/transporte/components/picking/pedidos-selecao-panel';
import { SimulacaoResultadoPanel } from '@/features/transporte/components/picking/simulacao-resultado-panel';
import { useGeracaoMapasSeparacao } from '@/features/transporte/hooks/use-geracao-mapas-separacao';

export function ImpressaoMapaSeparacaoView() {
  const {
    pedidosFiltrados,
    filtros,
    selecionados,
    resumoSelecao,
    config,
    simulacao,
    resultado,
    auditoria,
    indicadores,
    rotas,
    transportadoras,
    clientes,
    centros,
    prontoParaGerar,
    previewAberto,
    gerando,
    imprimindo,
    atualizarFiltros,
    togglePedido,
    toggleTodos,
    selecionarEstrategia,
    atualizarConfigEstrategia,
    atualizarBalanceamento,
    atualizarOtimizacaoRota,
    gerarMapas,
    abrirPreview,
    fecharPreview,
    imprimirMapas,
    cancelar,
  } = useGeracaoMapasSeparacao();

  const mapasGerados = resultado?.mapas ?? [];

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 pb-28 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="space-y-3">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/transporte" className="hover:text-primary">
                Transporte
              </Link>
              <ChevronRight className="size-3" aria-hidden />
              <span className="text-foreground">
                Geração de Mapas de Separação
              </span>
            </nav>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                    <Printer className="size-4" aria-hidden />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    WMS — Picking
                  </span>
                </div>
                <h1 className="text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                  Geração de Mapas de Separação
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Transforme pedidos em tarefas operacionais de separação com
                  estratégias, balanceamento, simulação e impressão.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2 text-xs text-muted-foreground">
                <QrCode className="size-4 text-tertiary" aria-hidden />
                Mapas incluem QR Code para abertura no coletor
              </div>
            </div>
          </header>

          <PedidosSelecaoPanel
            pedidos={pedidosFiltrados}
            filtros={filtros}
            selecionados={selecionados}
            resumo={resumoSelecao}
            rotas={rotas}
            transportadoras={transportadoras}
            clientes={clientes}
            centros={centros}
            onFiltrosChange={atualizarFiltros}
            onTogglePedido={togglePedido}
            onToggleTodos={toggleTodos}
          />

          <EstrategiaSeparacaoPanel
            estrategia={config.estrategia}
            onSelecionar={selecionarEstrategia}
          />

          <EstrategiaConfigPanel
            estrategia={config.estrategia}
            config={config.configEstrategia}
            onChange={atualizarConfigEstrategia}
          />

          <BalanceamentoRotaPanel
            balanceamento={config.balanceamento}
            otimizacaoRota={config.otimizacaoRota}
            onBalanceamentoChange={atualizarBalanceamento}
            onOtimizacaoChange={atualizarOtimizacaoRota}
          />

          <SimulacaoResultadoPanel
            simulacao={simulacao}
            pronto={resumoSelecao.qtdPedidos > 0}
          />

          <IndicadoresAuditoriaPanel
            indicadores={indicadores}
            auditoria={auditoria}
          />
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-glass-bg/95 px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
        <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {resumoSelecao.qtdPedidos > 0
              ? `${resumoSelecao.qtdPedidos} pedido(s) selecionado(s) · ${simulacao?.totalMapas ?? 0} mapa(s) simulado(s)`
              : 'Selecione pedidos e configure a estratégia de separação'}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={cancelar}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!mapasGerados.length}
              onClick={abrirPreview}
            >
              <Eye className="size-4" aria-hidden />
              Pré-visualizar
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={!prontoParaGerar || gerando}
              onClick={() => void gerarMapas()}
            >
              {gerando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Printer className="size-4" aria-hidden />
              )}
              {gerando ? 'Gerando...' : 'Gerar Mapas'}
            </Button>
          </div>
        </div>
      </footer>

      <Dialog open={previewAberto} onOpenChange={(open) => !open && fecharPreview()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4" aria-hidden />
              Pré-visualização dos Mapas
            </DialogTitle>
          </DialogHeader>

          {mapasGerados.length > 0 && (
            <div className="rounded-lg bg-card p-4">
              <MapaPickingPreview mapas={mapasGerados} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={fecharPreview}>
              Fechar
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={imprimindo}
              onClick={() => void imprimirMapas()}
            >
              {imprimindo ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Printer className="size-4" aria-hidden />
              )}
              {imprimindo ? 'Imprimindo...' : 'Imprimir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMain>
  );
}
