'use client';

import { ClipboardCheck, Layers, ListOrdered, Package, Printer, Settings2 } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { CollapsiblePanelSection } from '@/features/expedicao-impressao-config/components/collapsible-panel-section';
import { DadosBasicosPanel } from '@/features/expedicao-impressao-config/components/dados-basicos-panel';
import { ConferenciaConfigPanel } from '@/features/expedicao-impressao-config/components/conferencia-config-panel';
import { LayoutCabecalhoEditor } from '@/features/expedicao-impressao-config/components/layout-cabecalho-editor';
import { PreConfiguracaoImpressaoCombobox } from '@/features/expedicao-impressao-config/components/pre-configuracao-impressao-combobox';
import { SalvarConfigImpressaoDialog } from '@/features/expedicao-impressao-config/components/salvar-config-impressao-dialog';
import { SeparacaoConfigPanel } from '@/features/expedicao-impressao-config/components/separacao-config-panel';
import { OrdemImpressaoPanel } from '@/features/expedicao-impressao-config/components/ordem-impressao-panel';
import {
  fieldInputClassName,
  sectionLabelClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import { useImpressaoConfig } from '@/features/expedicao-impressao-config/hooks/use-impressao-config';
import {
  TIPO_QUEBRA_LABELS,
  type TipoQuebra,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';
import { useUnidadeContext } from '@/contexts/unidade-context';

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={sectionLabelClassName}>
      {children}
    </label>
  );
}

function CompactToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <SwitchToggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function ImpressaoConfigView() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? '';

  const {
    config,
    configuracoesSalvas,
    configuracaoSalvaId,
    isLoading,
    isSaving,
    modalSalvarComoAberto,
    setModalSalvarComoAberto,
    setTipoDadosBasicos,
    setQuebraPaleteAtiva,
    setTipoQuebra,
    setPercentualQuebra,
    setSepararPaletesCompletos,
    setSepararUnidadesIndividuais,
    setSegregarFifo,
    toggleFaixaFifo,
    setPercentualMaximoDataFifo,
    setClassificarPorConferencia,
    setAgrupamentoConferencia,
    moveOrdemItemUp,
    moveOrdemItemDown,
    toggleOrdemItem,
    setLayoutCabecalho,
    setQrCodePosicao,
    setQrCodeTamanho,
    setExibirTabelaCarregamento,
    moveColunaCarregamentoUp,
    moveColunaCarregamentoDown,
    toggleColunaCarregamento,
    aplicarConfiguracaoSalva,
    limpar,
    salvar,
    salvarComoNova,
  } = useImpressaoConfig({ unidadeId });

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-[50vh] items-center justify-center px-margin-mobile md:px-margin-desktop">
          <span className="text-sm text-muted-foreground">
            Carregando configurações de impressão...
          </span>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-4 md:px-margin-desktop md:py-5">
        <div className="mx-auto max-w-container space-y-3">
          <header className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                    <Printer className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Expedição
                  </span>
                  <span className="rounded-full border border-outline-variant/60 bg-surface-low/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {config.centroNome}
                  </span>
                </div>
                <h1 className="text-headline-md font-semibold tracking-tight text-foreground">
                  Configurar Impressão de Mapa
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Padrões de impressão para separação, conferência e carregamento.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={limpar}
                  disabled={isSaving}
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setModalSalvarComoAberto(true)}
                  disabled={isSaving}
                >
                  Salvar como nova
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => void salvar()}
                  disabled={isSaving}
                >
                  Salvar
                </Button>
              </div>
            </div>

            <PreConfiguracaoImpressaoCombobox
              opcoes={configuracoesSalvas}
              selecionadaId={configuracaoSalvaId}
              onSelecionar={aplicarConfiguracaoSalva}
            />
          </header>

          <SalvarConfigImpressaoDialog
            open={modalSalvarComoAberto}
            isSaving={isSaving}
            onOpenChange={setModalSalvarComoAberto}
            onConfirmar={salvarComoNova}
          />

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <CollapsiblePanelSection icon={Settings2} title="Dados Básicos">
                <DadosBasicosPanel
                  tipo={config.tipoDadosBasicos}
                  centroId={config.centroId}
                  usuarioId={config.usuarioId}
                  onMudarTipo={setTipoDadosBasicos}
                />
              </CollapsiblePanelSection>

              <CollapsiblePanelSection icon={Layers} title="Opções de Separação">
                <SeparacaoConfigPanel
                  opcoes={config.opcoesSeparacao}
                  onMudarPaletesCompletos={setSepararPaletesCompletos}
                  onMudarUnidadesIndividuais={setSepararUnidadesIndividuais}
                  onMudarSegregarFifo={setSegregarFifo}
                  onToggleFaixaFifo={toggleFaixaFifo}
                  onMudarPercentualMaximoDataFifo={setPercentualMaximoDataFifo}
                />
              </CollapsiblePanelSection>
            </div>

            <CollapsiblePanelSection icon={Package} title="Quebra de Palete">
              <div className="space-y-2.5">
                <CompactToggle
                  label="Ativar quebra de palete"
                  checked={config.quebraPalete.ativa}
                  onChange={() =>
                    setQuebraPaleteAtiva(!config.quebraPalete.ativa)
                  }
                />

                {config.quebraPalete.ativa && (
                  <div className="grid max-w-md grid-cols-2 gap-2">
                    <div>
                      <FieldLabel htmlFor="tipo-quebra">Tipo</FieldLabel>
                      <select
                        id="tipo-quebra"
                        value={config.quebraPalete.tipo}
                        onChange={(event) =>
                          setTipoQuebra(event.target.value as TipoQuebra)
                        }
                        className={cn(fieldInputClassName, 'mt-1')}
                      >
                        {(
                          Object.entries(TIPO_QUEBRA_LABELS) as [
                            TipoQuebra,
                            string,
                          ][]
                        ).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="percentual">
                        {config.quebraPalete.tipo === 'porcentual'
                          ? 'Percentual (%)'
                          : config.quebraPalete.tipo === 'quantidade'
                            ? 'Quantidade'
                            : 'Linhas'}
                      </FieldLabel>
                      <input
                        id="percentual"
                        type="number"
                        min={0}
                        max={
                          config.quebraPalete.tipo === 'porcentual'
                            ? 100
                            : undefined
                        }
                        step={
                          config.quebraPalete.tipo === 'porcentual' ? 0.01 : 1
                        }
                        value={config.quebraPalete.percentual}
                        onChange={(event) =>
                          setPercentualQuebra(Number(event.target.value))
                        }
                        className={cn(fieldInputClassName, 'mt-1 font-mono')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CollapsiblePanelSection>

            <CollapsiblePanelSection icon={ListOrdered} title="Ordenação de Impressão">
              <OrdemImpressaoPanel
                ordemSeparacao={config.ordemImpressaoSeparacao}
                ordemConferencia={config.ordemImpressaoConferencia}
                onMoveUp={moveOrdemItemUp}
                onMoveDown={moveOrdemItemDown}
                onToggle={toggleOrdemItem}
              />
            </CollapsiblePanelSection>

            <CollapsiblePanelSection icon={ClipboardCheck} title="Conferência">
              <ConferenciaConfigPanel
                opcoes={config.opcoesConferencia}
                onMudarClassificarPor={setClassificarPorConferencia}
                onMudarAgrupamento={setAgrupamentoConferencia}
              />
            </CollapsiblePanelSection>

            <LayoutCabecalhoEditor
              templates={config.layoutCabecalho}
              qrCodeMapa={config.qrCodeMapa}
              ordemImpressaoSeparacao={config.ordemImpressaoSeparacao}
              ordemImpressaoConferencia={config.ordemImpressaoConferencia}
              opcoesTabelasCarregamento={config.opcoesTabelasCarregamento}
              onMudar={setLayoutCabecalho}
              onMudarQrPosicao={setQrCodePosicao}
              onMudarQrTamanho={setQrCodeTamanho}
              onMudarExibirTabelaCarregamento={setExibirTabelaCarregamento}
              onMoveColunaCarregamentoUp={moveColunaCarregamentoUp}
              onMoveColunaCarregamentoDown={moveColunaCarregamentoDown}
              onToggleColunaCarregamento={toggleColunaCarregamento}
            />
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
