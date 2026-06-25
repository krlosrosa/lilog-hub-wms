'use client';

import { useRef } from 'react';

import Link from 'next/link';

import { ArrowLeft, Code2, Loader2, Map, Monitor, RefreshCw, Save, Trash2, X } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  AGRUPAMENTO_CONFERENCIA_LABELS,
  CLASSIFICAR_POR_CONFERENCIA_LABELS,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { SidebarMain } from '@/components/layout/sidebar';
import { AgrupamentoMapaPanel } from '@/features/transporte/components/agrupamento-mapa-panel';
import { GerarMapasPreviewPanel } from '@/features/transporte/components/gerar-mapas-preview-panel';
import { PreConfiguracaoMapaCombobox } from '@/features/transporte/components/pre-configuracao-mapa-combobox';
import { SalvarMapasModal } from '@/features/transporte/components/salvar-mapas-modal';
import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import { useGerarMapas } from '@/features/transporte/hooks/use-gerar-mapas';
import {
  TIPO_DADOS_BASICOS_MAPA_LABELS,
  TIPO_DADOS_BASICOS_MAPA_OPCOES,
} from '@/features/transporte/types/transporte.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

const fieldInputClassName = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

export function GerarMapasView() {
  const previewRef = useRef<HTMLElement>(null);

  const {
    transportesSelecionados,
    blocosPreview,
    gruposGerados,
    config,
    preConfiguracoes,
    preConfiguracaoId,
    carregandoConfigs,
    gerandoMapas,
    salvandoMapas,
    mapaLoteSalvoId,
    torreControleHref,
    modalSalvarAberto,
    resumoSalvarPreview,
    transportesComMapaExistente,
    lotesMapaConflitantes,
    excluindoMapaLoteId,
    podeSalvar,
    inicializado,
    removerTransporte,
    aplicarPreConfiguracao,
    atualizarUsarQuebraPalete,
    atualizarQuebraTipo,
    atualizarQuebraValor,
    atualizarTipoDadosBasicos,
    atualizarCheckbox,
    toggleTipoAgrupamento,
    adicionarClienteSegregado,
    removerClienteSegregado,
    adicionarGrupo,
    removerGrupo,
    atualizarGrupo,
    adicionarItemGrupo,
    removerItemGrupo,
    voltar,
    gerarMapas,
    abrirModalSalvar,
    fecharModalSalvar,
    salvarMapas,
    excluirMapaLote,
  } = useGerarMapas();

  const podeGerar =
    inicializado && !carregandoConfigs && transportesSelecionados.length > 0;

  const handleGerarMapas = async () => {
    const gerado = await gerarMapas();
    if (gerado) {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-5 md:px-margin-desktop md:py-6">
        <div className="mx-auto max-w-container space-y-4">
          <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 h-8 gap-1.5 px-2 text-xs text-muted-foreground"
                onClick={voltar}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Voltar
              </Button>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                  <Map className="size-4" aria-hidden />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Operacional
                </span>
              </div>
              <h1 className="text-headline-md font-semibold tracking-tight text-foreground md:text-headline-lg">
                Gerar Mapas para Impressão
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Configure as opções e gere o JSON dos grupos na pré-visualização.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
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
              ) : null}
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={!podeGerar || gerandoMapas}
                onClick={() => void handleGerarMapas()}
              >
                <RefreshCw
                  className={cn('size-3.5', gerandoMapas && 'animate-spin')}
                  aria-hidden
                />
                {gerandoMapas ? 'Gerando...' : 'Gerar Mapas'}
                {transportesSelecionados.length > 0 && (
                  <span className="rounded-full bg-on-primary/20 px-1.5 py-px text-[9px] font-bold">
                    {transportesSelecionados.length}
                  </span>
                )}
              </Button>
            </div>
          </header>

          {transportesComMapaExistente.length > 0 && (
            <section className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Mapa já salvo — exclusão necessária
                </p>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90">
                  Os transportes abaixo já possuem mapa persistido. Exclua o lote
                  de mapas antes de salvar um novo.
                </p>
              </div>

              <div className="space-y-2">
                {lotesMapaConflitantes.map((lote) => (
                  <div
                    key={lote.loteId}
                    className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 text-xs">
                      <p className="font-medium text-foreground">
                        Rotas:{' '}
                        {lote.transportes.map((transporte) => transporte.rota).join(', ')}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Lote {lote.loteId.slice(0, 8)}…
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={excluindoMapaLoteId != null}
                      onClick={() => void excluirMapaLote(lote.loteId)}
                    >
                      {excluindoMapaLoteId === lote.loteId ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="size-3.5" aria-hidden />
                      )}
                      Excluir mapa
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={panelClassName}>
            <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                Transportes selecionados
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {transportesSelecionados.length} transporte
                {transportesSelecionados.length !== 1 ? 's' : ''} para geração
                do mapa
              </p>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {!inicializado ? (
                <p className="text-xs text-muted-foreground">Carregando...</p>
              ) : transportesSelecionados.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum transporte selecionado. Volte e selecione transportes
                  na página de expedição.
                </p>
              ) : (
                transportesSelecionados.map((transporte) => (
                  <span
                    key={transporte.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border border-primary/30',
                      'bg-primary/5 px-2.5 py-1 text-xs text-foreground',
                    )}
                  >
                    <span className="font-medium">{transporte.rota}</span>
                    <TransporteStatusBadge status={transporte.status} />
                    <button
                      type="button"
                      onClick={() => removerTransporte(transporte.id)}
                      className={cn(
                        'ml-0.5 flex size-4 items-center justify-center rounded-full',
                        'text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive',
                      )}
                      aria-label={`Remover ${transporte.rota}`}
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))
              )}
            </div>
          </section>

          <section className={panelClassName}>
            <div className="flex flex-col gap-3 border-b border-outline-variant bg-surface-low/30 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Configurações do mapa
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Defina quebras, segregações e agrupamentos para a impressão.
                </p>
              </div>
              <PreConfiguracaoMapaCombobox
                opcoes={preConfiguracoes}
                selecionadaId={preConfiguracaoId}
                onSelecionar={aplicarPreConfiguracao}
                carregando={carregandoConfigs}
                className="shrink-0"
              />
            </div>

            <div className="space-y-5 p-4">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agrupamento base
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Define se os mapas serão agrupados por transporte ou por código
                  de cliente. Valor inicial vem da configuração de impressão.
                </p>
                <div className="inline-flex rounded-md border border-outline-variant bg-surface-low p-0.5">
                  {TIPO_DADOS_BASICOS_MAPA_OPCOES.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      disabled={carregandoConfigs}
                      className={cn(
                        'rounded px-4 py-1.5 text-[11px] font-medium transition-colors',
                        config.tipoDadosBasicos === tipo
                          ? 'bg-primary text-on-primary'
                          : 'text-muted-foreground hover:text-foreground',
                        carregandoConfigs && 'cursor-not-allowed opacity-50',
                      )}
                      onClick={() => atualizarTipoDadosBasicos(tipo)}
                      aria-pressed={config.tipoDadosBasicos === tipo}
                    >
                      {TIPO_DADOS_BASICOS_MAPA_LABELS[tipo]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quebra de palete
                </h3>
                <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={config.quebraPalete.ativo}
                    onChange={(event) =>
                      atualizarUsarQuebraPalete(event.target.checked)
                    }
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  Usar quebra de palete
                </label>
                {config.quebraPalete.ativo && (
                  <div className="flex flex-wrap items-center gap-2 pl-1">
                    <div className="inline-flex rounded-md border border-outline-variant bg-surface-low p-0.5">
                      <button
                        type="button"
                        className={cn(
                          'rounded px-3 py-1 text-[11px] font-medium transition-colors',
                          config.quebraPalete.tipo === 'percentual'
                            ? 'bg-primary text-on-primary'
                            : 'text-muted-foreground',
                        )}
                        onClick={() => atualizarQuebraTipo('percentual')}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'rounded px-3 py-1 text-[11px] font-medium transition-colors',
                          config.quebraPalete.tipo === 'linhas'
                            ? 'bg-primary text-on-primary'
                            : 'text-muted-foreground',
                        )}
                        onClick={() => atualizarQuebraTipo('linhas')}
                      >
                        Linhas
                      </button>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={config.quebraPalete.valor}
                      onChange={(event) =>
                        atualizarQuebraValor(Number(event.target.value))
                      }
                      className={cn(fieldInputClassName, 'w-24')}
                      aria-label={
                        config.quebraPalete.tipo === 'percentual'
                          ? 'Percentual de quebra de palete'
                          : 'Quantidade de linhas para quebra de palete'
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {config.quebraPalete.tipo === 'percentual'
                        ? '% do peso total'
                        : 'linhas por bloco'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Separação
                </h3>
                <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={config.segregarPaleteFull}
                    disabled={carregandoConfigs}
                    onChange={(event) =>
                      atualizarCheckbox('segregarPaleteFull', event.target.checked)
                    }
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  Separar paletes completos
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={config.segregarUnidade}
                    disabled={carregandoConfigs}
                    onChange={(event) =>
                      atualizarCheckbox('segregarUnidade', event.target.checked)
                    }
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  Separar unidades avulsas
                </label>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Opções
                </h3>
                <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                  <input
                    type="checkbox"
                    checked={config.exibirClienteCabecalho}
                    onChange={(event) =>
                      atualizarCheckbox(
                        'exibirClienteCabecalho',
                        event.target.checked,
                      )
                    }
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  Exibir cliente no cabeçalho
                </label>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conferência
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Opções carregadas da pré-configuração de impressão. Para alterar,
                  edite em{' '}
                  <Link
                    href="/expedicao/config-impressao"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Configuração de impressão
                  </Link>
                  .
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Classificar por
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {
                        CLASSIFICAR_POR_CONFERENCIA_LABELS[
                          config.opcoesConferencia.classificarPor
                        ]
                      }
                    </p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-surface-low/40 px-3 py-2.5 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Agrupamento
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {
                        AGRUPAMENTO_CONFERENCIA_LABELS[
                          config.opcoesConferencia.agrupamento
                        ]
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Agrupamento
                </h3>
                <AgrupamentoMapaPanel
                  agrupamento={config.agrupamento}
                  onToggleTipo={toggleTipoAgrupamento}
                  onAdicionarClienteSegregado={adicionarClienteSegregado}
                  onRemoverClienteSegregado={removerClienteSegregado}
                  onAdicionarGrupo={adicionarGrupo}
                  onRemoverGrupo={removerGrupo}
                  onAtualizarGrupo={atualizarGrupo}
                  onAdicionarItemGrupo={adicionarItemGrupo}
                  onRemoverItemGrupo={removerItemGrupo}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-outline-variant bg-surface-low/20 px-4 py-3">
              {mapaLoteSalvoId && (
                <p className="mr-auto self-center text-[11px] text-muted-foreground">
                  Último lote salvo:{' '}
                  <span className="font-mono text-foreground">{mapaLoteSalvoId.slice(0, 8)}…</span>
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={!podeSalvar}
                onClick={abrirModalSalvar}
              >
                <Save className="size-3.5" aria-hidden />
                Salvar Mapas
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                disabled={!podeGerar || gerandoMapas}
                onClick={() => void handleGerarMapas()}
              >
                <RefreshCw
                  className={cn('size-3.5', gerandoMapas && 'animate-spin')}
                  aria-hidden
                />
                {gerandoMapas ? 'Gerando...' : 'Gerar Mapas'}
              </Button>
            </div>
          </section>

          <section ref={previewRef} className={panelClassName}>
            <div className="border-b border-outline-variant bg-surface-low/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold text-foreground">
                  Pré-visualização
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Visualização dos grupos gerados pela configuração atual.
              </p>
            </div>

            <GerarMapasPreviewPanel
              blocos={blocosPreview}
              gruposGerados={gruposGerados}
              config={config}
              transportes={transportesSelecionados}
              inicializado={inicializado}
              temTransportes={transportesSelecionados.length > 0}
            />
          </section>
        </div>
      </main>

      <SalvarMapasModal
        aberto={modalSalvarAberto}
        resumo={resumoSalvarPreview}
        salvando={salvandoMapas}
        onConfirmar={() => void salvarMapas()}
        onCancelar={fecharModalSalvar}
      />
    </SidebarMain>
  );
}
