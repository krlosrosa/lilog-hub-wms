'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { cn } from '@lilog/ui';
import { AlertTriangle, Eye, Info } from 'lucide-react';

import { CabecalhoMapaPreview } from '@/features/expedicao-impressao-config/components/cabecalho-mapa-preview';
import { CarregamentoTabelasPanel } from '@/features/expedicao-impressao-config/components/carregamento-tabelas-panel';
import {
  CollapsibleBlock,
  CollapsiblePanelSection,
} from '@/features/expedicao-impressao-config/components/collapsible-panel-section';
import { QrCodePosicaoSelector } from '@/features/expedicao-impressao-config/components/qr-code-posicao-selector';
import {
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  LINHAS_TABELA_CLIENTES_MOCK,
  LINHAS_TABELA_EMPRESA_MOCK,
} from '@/features/expedicao-impressao-config/mocks/carregamento-tabelas.mock';
import type {
  OpcoesTabelasCarregamento,
  OrdemTabelaClientesItem,
  OrdemTabelaEmpresaItem,
  TabelaCarregamentoTipo,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import {
  colunaClientesAlinhamento,
  colunaEmpresaAlinhamento,
  labelColunaClientes,
  labelColunaEmpresa,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import type {
  OrdemImpressaoItem,
  QrCodeMapa,
  PosicaoQrCode,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import {
  EXEMPLO_ORDEM_IMPRESSAO,
  TIPO_LAYOUT_MAPA_LABELS,
  VARIAVEIS_LAYOUT_MAPA,
  colunaOrdemAlinhamento,
  labelColunaOrdem,
  qrCodeConfigurado,
  type TipoLayoutMapa,
} from '@/features/expedicao-impressao-config/types/layout-mapa';

function TabelaCarregamentoPreview<T extends string>({
  titulo,
  colunas,
  linhas,
  labelColuna,
  alinhamentoColuna,
}: {
  titulo: string;
  colunas: T[];
  linhas: Record<T, string>[];
  labelColuna: (coluna: T) => string;
  alinhamentoColuna: (coluna: T) => 'left' | 'right';
}) {
  if (colunas.length === 0) {
    return (
      <p className="text-center text-[11px] text-zinc-400">
        Nenhuma coluna ativa em {titulo}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {titulo}
      </p>
      <table className="w-full border-collapse text-left text-xs text-zinc-600">
        <thead>
          <tr className="border-b border-zinc-300 bg-zinc-100 text-[10px] uppercase tracking-wider">
            {colunas.map((coluna) => {
              const alinhamento = alinhamentoColuna(coluna);

              return (
                <th
                  key={coluna}
                  className={cn(
                    'px-2 py-1.5',
                    alinhamento === 'right' && 'text-right',
                  )}
                >
                  {labelColuna(coluna)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, index) => (
            <tr key={index} className="border-b border-zinc-200">
              {colunas.map((coluna) => {
                const alinhamento = alinhamentoColuna(coluna);

                return (
                  <td
                    key={coluna}
                    className={cn(
                      'px-2 py-1.5',
                      alinhamento === 'right' && 'text-right font-mono',
                    )}
                  >
                    {linha[coluna]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-right text-[10px] text-zinc-400">
        Exibindo {linhas.length} de {linhas.length} linhas (prévia)
      </p>
    </div>
  );
}

const ABAS: { id: TipoLayoutMapa; label: string }[] = [
  { id: 'separacao', label: 'Separação' },
  { id: 'conferencia', label: 'Conferência' },
  { id: 'carregamento', label: 'Carregamento' },
];

const LINHAS_PREVIA = [
  { id: '1', valores: { ...EXEMPLO_ORDEM_IMPRESSAO } },
  {
    id: '2',
    valores: {
      ...EXEMPLO_ORDEM_IMPRESSAO,
      sku: 'SKU-002',
      descricao: 'Produto Secundário',
      endereco: 'B-03-01',
      lote: 'L2027',
      quantidade_unidade: '12',
      quantidade_caixa: '1',
    },
  },
  {
    id: '3',
    valores: {
      ...EXEMPLO_ORDEM_IMPRESSAO,
      sku: 'SKU-003',
      descricao: 'Produto Terciário',
      endereco: 'C-02-04',
      faixa: 'Vermelho',
      quantidade_unidade: '6',
    },
  },
] as const;

type LayoutCabecalhoEditorProps = {
  templates: Record<TipoLayoutMapa, string>;
  qrCodeMapa: QrCodeMapa;
  ordemImpressaoSeparacao: OrdemImpressaoItem[];
  ordemImpressaoConferencia: OrdemImpressaoItem[];
  opcoesTabelasCarregamento: OpcoesTabelasCarregamento;
  onMudar: (tipo: TipoLayoutMapa, html: string) => void;
  onMudarQrPosicao: (tipo: TipoLayoutMapa, posicao: PosicaoQrCode) => void;
  onMudarQrTamanho: (tipo: TipoLayoutMapa, tamanho: number) => void;
  onMudarExibirTabelaCarregamento: (
    tipo: TabelaCarregamentoTipo,
    exibir: boolean,
  ) => void;
  onMoveColunaCarregamentoUp: (
    tipo: TabelaCarregamentoTipo,
    index: number,
  ) => void;
  onMoveColunaCarregamentoDown: (
    tipo: TabelaCarregamentoTipo,
    index: number,
  ) => void;
  onToggleColunaCarregamento: (
    tipo: TabelaCarregamentoTipo,
    coluna: OrdemTabelaEmpresaItem | OrdemTabelaClientesItem,
  ) => void;
};

function resolverOrdemImpressao(
  aba: TipoLayoutMapa,
  ordemSeparacao: OrdemImpressaoItem[],
  ordemConferencia: OrdemImpressaoItem[],
): OrdemImpressaoItem[] {
  if (aba === 'conferencia') return ordemConferencia;
  if (aba === 'carregamento') return [];
  return ordemSeparacao;
}

export function LayoutCabecalhoEditor({
  templates,
  qrCodeMapa,
  ordemImpressaoSeparacao,
  ordemImpressaoConferencia,
  opcoesTabelasCarregamento,
  onMudar,
  onMudarQrPosicao,
  onMudarQrTamanho,
  onMudarExibirTabelaCarregamento,
  onMoveColunaCarregamentoUp,
  onMoveColunaCarregamentoDown,
  onToggleColunaCarregamento,
}: LayoutCabecalhoEditorProps) {
  const [abaAtiva, setAbaAtiva] = useState<TipoLayoutMapa>('separacao');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const template = templates[abaAtiva];
  const qrConfig = qrCodeMapa[abaAtiva];
  const qrValido = qrCodeConfigurado(template, qrConfig.posicao);

  const colunasOrdem = useMemo(
    () =>
      resolverOrdemImpressao(
        abaAtiva,
        ordemImpressaoSeparacao,
        ordemImpressaoConferencia,
      ),
    [abaAtiva, ordemImpressaoSeparacao, ordemImpressaoConferencia],
  );

  const inserirVariavel = useCallback(
    (chave: string) => {
      const el = textareaRef.current;
      if (!el) return;

      const inicio = el.selectionStart;
      const fim = el.selectionEnd;
      const atual = templates[abaAtiva];
      const novo = atual.slice(0, inicio) + chave + atual.slice(fim);
      onMudar(abaAtiva, novo);

      requestAnimationFrame(() => {
        el.focus();
        const pos = inicio + chave.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [abaAtiva, onMudar, templates],
  );

  const abasHeader = (
    <div className={segmentGroupClassName}>
      {ABAS.map((aba) => (
        <button
          key={aba.id}
          type="button"
          onClick={() => setAbaAtiva(aba.id)}
          className={segmentButtonClassName(abaAtiva === aba.id)}
        >
          {aba.label}
        </button>
      ))}
    </div>
  );

  return (
    <CollapsiblePanelSection
      icon={Eye}
      title="Layout do Cabeçalho"
      headerExtra={abasHeader}
    >
      <div className="space-y-3">
        <CollapsibleBlock
          title="QR Code (obrigatório)"
          description={`Defina onde o QR Code aparece no mapa de ${TIPO_LAYOUT_MAPA_LABELS[abaAtiva]}.`}
        >
          <QrCodePosicaoSelector
            posicao={qrConfig.posicao}
            tamanho={qrConfig.tamanho}
            onMudarPosicao={(posicao) => onMudarQrPosicao(abaAtiva, posicao)}
            onMudarTamanho={(tamanho) => onMudarQrTamanho(abaAtiva, tamanho)}
          />

          {!qrValido ? (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                aria-hidden
              />
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Com posição personalizada, inclua{' '}
                <code className="font-mono">{'{{qr_code}}'}</code> no template
                HTML abaixo.
              </p>
            </div>
          ) : null}
        </CollapsibleBlock>

        <CollapsibleBlock
          title={`Template HTML — ${TIPO_LAYOUT_MAPA_LABELS[abaAtiva]}`}
          description="Escreva HTML livremente. Use as variáveis ao lado para inserir dados dinâmicos."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(event) => onMudar(abaAtiva, event.target.value)}
              rows={18}
              spellCheck={false}
              className={cn(
                'w-full resize-y rounded-md border border-outline-variant bg-surface-low px-3 py-2',
                'font-mono text-[11px] text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring',
              )}
              aria-label={`Template HTML do cabeçalho de ${TIPO_LAYOUT_MAPA_LABELS[abaAtiva]}`}
            />

            <CollapsibleBlock
              title="Variáveis disponíveis"
              description='Clique em "Inserir" para adicionar a variável na posição atual do cursor.'
              className="h-fit"
            >
              <div className="flex items-center gap-1.5 pb-2">
                <Info className="size-3.5 text-muted-foreground" aria-hidden />
                <p className="text-[10px] text-muted-foreground">
                  {VARIAVEIS_LAYOUT_MAPA.length} variáveis disponíveis
                </p>
              </div>

              <div className="max-h-[360px] overflow-x-auto overflow-y-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="sticky top-0 bg-surface-low/95 backdrop-blur-sm">
                    <tr className="border-b border-outline-variant text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="py-1.5 pr-3 text-left font-semibold">
                        Variável
                      </th>
                      <th className="py-1.5 pr-3 text-left font-semibold">
                        Descrição
                      </th>
                      <th className="py-1.5 text-right font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {VARIAVEIS_LAYOUT_MAPA.map((variavel) => (
                      <tr key={variavel.chave} className="group">
                        <td className="py-1.5 pr-3 align-top">
                          <code className="rounded bg-primary/8 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                            {variavel.chave}
                          </code>
                          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                            {variavel.exemplo}
                          </p>
                        </td>
                        <td className="py-1.5 pr-3 align-top text-muted-foreground">
                          {variavel.descricao}
                        </td>
                        <td className="py-1.5 text-right align-top">
                          <button
                            type="button"
                            onClick={() => inserirVariavel(variavel.chave)}
                            className={cn(
                              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                              'border border-outline-variant text-muted-foreground',
                              'hover:border-primary hover:bg-primary/5 hover:text-primary',
                            )}
                          >
                            Inserir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleBlock>
          </div>
        </CollapsibleBlock>

        {abaAtiva === 'carregamento' ? (
          <CollapsibleBlock
            title="Tabelas do mapa"
            description="Defina quais tabelas e colunas aparecem no mapa de carregamento."
          >
            <CarregamentoTabelasPanel
              opcoes={opcoesTabelasCarregamento}
              onMudarExibirTabela={onMudarExibirTabelaCarregamento}
              onMoveColunaUp={onMoveColunaCarregamentoUp}
              onMoveColunaDown={onMoveColunaCarregamentoDown}
              onToggleColuna={onToggleColunaCarregamento}
            />
          </CollapsibleBlock>
        ) : null}

        <CollapsibleBlock
          title="Pré-visualização"
          description={
            abaAtiva === 'carregamento'
              ? 'Renderização do cabeçalho e das tabelas de carregamento com dados de exemplo.'
              : `Renderização com dados de exemplo. Colunas seguem a ordem de ${TIPO_LAYOUT_MAPA_LABELS[abaAtiva]}.`
          }
        >
          <div className="overflow-auto rounded-lg border border-zinc-300 bg-white p-4 shadow-sm">
            <CabecalhoMapaPreview
              template={template}
              posicaoQr={qrConfig.posicao}
              tamanhoQr={qrConfig.tamanho}
            />

            {template.trim() ? (
              <div className="mt-4 border-t border-zinc-200 pt-3">
                {abaAtiva === 'carregamento' ? (
                  <>
                    {!opcoesTabelasCarregamento.exibirTabelaEmpresa &&
                    !opcoesTabelasCarregamento.exibirTabelaClientes ? (
                      <p className="text-center text-[11px] text-zinc-400">
                        Nenhuma tabela selecionada para o mapa de carregamento.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {opcoesTabelasCarregamento.exibirTabelaEmpresa ? (
                          <TabelaCarregamentoPreview<OrdemTabelaEmpresaItem>
                            titulo="Lista de Carregamento por Empresa"
                            colunas={opcoesTabelasCarregamento.ordemTabelaEmpresa}
                            linhas={LINHAS_TABELA_EMPRESA_MOCK}
                            labelColuna={labelColunaEmpresa}
                            alinhamentoColuna={colunaEmpresaAlinhamento}
                          />
                        ) : null}

                        {opcoesTabelasCarregamento.exibirTabelaClientes ? (
                          <TabelaCarregamentoPreview<OrdemTabelaClientesItem>
                            titulo="Lista de Clientes"
                            colunas={
                              opcoesTabelasCarregamento.ordemTabelaClientes
                            }
                            linhas={LINHAS_TABELA_CLIENTES_MOCK}
                            labelColuna={labelColunaClientes}
                            alinhamentoColuna={colunaClientesAlinhamento}
                          />
                        ) : null}
                      </div>
                    )}
                  </>
                ) : colunasOrdem.length > 0 ? (
                  <>
                    <table className="w-full border-collapse text-left text-xs text-zinc-600">
                      <thead>
                        <tr className="border-b border-zinc-300 bg-zinc-100 text-[10px] uppercase tracking-wider">
                          {colunasOrdem.map((coluna) => {
                            const alinhamento = colunaOrdemAlinhamento(coluna);

                            return (
                              <th
                                key={coluna}
                                className={cn(
                                  'px-2 py-1.5',
                                  alinhamento === 'right' && 'text-right',
                                )}
                              >
                                {labelColunaOrdem(coluna)}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {LINHAS_PREVIA.map((linha) => (
                          <tr
                            key={linha.id}
                            className="border-b border-zinc-200"
                          >
                            {colunasOrdem.map((coluna) => {
                              const alinhamento =
                                colunaOrdemAlinhamento(coluna);

                              return (
                                <td
                                  key={coluna}
                                  className={cn(
                                    'px-2 py-1.5',
                                    alinhamento === 'right' &&
                                      'text-right font-mono',
                                    coluna === 'sku' && 'font-mono',
                                  )}
                                >
                                  {linha.valores[coluna]}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-right text-[10px] text-zinc-400">
                      Exibindo 3 de 12 itens (prévia)
                    </p>
                  </>
                ) : (
                  <p className="text-center text-[11px] text-zinc-400">
                    Nenhuma coluna ativa em Ordenação de Impressão.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </CollapsibleBlock>
      </div>
    </CollapsiblePanelSection>
  );
}
