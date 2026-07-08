import {
  QR_CODE_VARIAVEL,
  VARIAVEIS_CABECALHO_MAPA_CATALOGO,
  aplicarVariaveisCabecalhoMapa,
  substituirVariaveisExemploCabecalho,
  type CabecalhoGrupoMapa,
  type ContextoVariaveisCabecalhoMapa,
  type VariavelCabecalhoMapaCatalogo,
} from '@lilog/contracts';

import type { OrdemImpressaoItem, PosicaoQrCode } from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { ORDEM_IMPRESSAO_LABELS } from '@/features/expedicao-impressao-config/types/impressao-config.schema';

export type TipoLayoutMapa =
  | 'separacao'
  | 'conferencia'
  | 'conferencia_reentrega'
  | 'carregamento';

export const TIPO_LAYOUT_MAPA_LABELS: Record<TipoLayoutMapa, string> = {
  separacao: 'Separação',
  conferencia: 'Conferência',
  conferencia_reentrega: 'Conferência Reentrega',
  carregamento: 'Carregamento',
};

export type VariavelLayoutMapa = VariavelCabecalhoMapaCatalogo;

export { QR_CODE_VARIAVEL };

export const VARIAVEIS_LAYOUT_MAPA: VariavelLayoutMapa[] =
  VARIAVEIS_CABECALHO_MAPA_CATALOGO;

export type { CabecalhoGrupoMapa, ContextoVariaveisCabecalhoMapa };

export const EXEMPLO_ORDEM_IMPRESSAO: Record<OrdemImpressaoItem, string> = {
  endereco: 'A-01-02',
  sku: 'SKU-001',
  descricao: 'Produto Exemplo',
  lote: 'L2026',
  data_maxima: '30/06/2026',
  data_minima: '01/06/2026',
  quantidade_unidade: '24',
  quantidade_caixa: '2',
  quantidade_palete: '1',
  faixa: 'Amarelo',
};

const COLUNAS_NUMERICAS = new Set<OrdemImpressaoItem>([
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
]);

export function colunaOrdemAlinhamento(item: OrdemImpressaoItem): 'left' | 'right' {
  return COLUNAS_NUMERICAS.has(item) ? 'right' : 'left';
}

export function labelColunaOrdem(item: OrdemImpressaoItem): string {
  return ORDEM_IMPRESSAO_LABELS[item];
}

export const QR_CODE_EXEMPLO_HTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border:1px solid #ccc;background:#fff;font-size:9px;color:#666;">QR</span>`;

export function templateContemQrCode(template: string): boolean {
  return template.includes(QR_CODE_VARIAVEL);
}

export function qrCodeConfigurado(
  template: string,
  posicao: PosicaoQrCode,
): boolean {
  if (posicao === 'no_html') return templateContemQrCode(template);
  return true;
}

export function substituirVariaveisExemploSemQr(template: string): string {
  return substituirVariaveisExemploCabecalho(template, { preservarQrCode: true });
}

export const QR_CODE_SLOT_CLASS = 'cabecalho-mapa-qr-slot';

export function montarHtmlComSlotsQr(
  template: string,
  tamanhoQr: number,
  slotClass = QR_CODE_SLOT_CLASS,
): string {
  const slotHtml = `<span class="${slotClass}" style="display:inline-block;vertical-align:middle;line-height:0;width:${tamanhoQr}px;height:${tamanhoQr}px" aria-hidden="true"></span>`;

  return substituirVariaveisExemploSemQr(
    template.replaceAll(QR_CODE_VARIAVEL, slotHtml),
  );
}

export function substituirVariaveisExemplo(template: string): string {
  return substituirVariaveisExemploSemQr(template).replaceAll(
    QR_CODE_VARIAVEL,
    QR_CODE_EXEMPLO_HTML,
  );
}

export function substituirVariaveisCabecalhoReal(
  template: string,
  cabecalho: CabecalhoGrupoMapa,
  contexto?: ContextoVariaveisCabecalhoMapa,
  options?: { preservarQrCode?: boolean },
): string {
  return aplicarVariaveisCabecalhoMapa(template, cabecalho, contexto ?? {}, options);
}

export const TEMPLATE_SEPARACAO_PADRAO = `<!-- Cabeçalho do Mapa de Separação -->
<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <strong style="font-size:14px;">{{rota}}</strong>
    <p style="margin:2px 0; font-size:11px; color:#555;">{{primeiro_cliente}} · {{codigo_primeiro_cliente}}</p>
    <p style="margin:2px 0; font-size:11px;">{{empresas_transporte}}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#555;">
    <p>Seq. {{sequencia}} · {{id_mapa}}</p>
    <p>Placa: {{placa}}</p>
    <p>{{transportadora}}</p>
  </div>
</div>
<div style="margin-top:6px; font-size:11px; border-top:1px solid #ccc; padding-top:4px;">
  <span>{{qtd_linhas}} linhas</span> ·
  <span>Peso: {{peso}}</span> ·
  <span>{{qtd_caixa_total}} cx</span> ·
  <span>{{qtd_palete_total}} paletes</span>
</div>`;

export const TEMPLATE_CONFERENCIA_PADRAO = `<!-- Cabeçalho do Mapa de Conferência -->
<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <p style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#888;">
      Mapa de Conferência
    </p>
    <strong style="font-size:14px;">{{rota}}</strong>
    <p style="margin:2px 0; font-size:11px;">{{todos_clientes}}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#555;">
    <p>Seq. {{sequencia}}</p>
    <p>Placa: {{placa}}</p>
    <p>{{empresa}}</p>
  </div>
</div>`;

export const TEMPLATE_CONFERENCIA_REENTREGA_PADRAO = `<!-- Cabeçalho do Mapa de Conferência Reentrega -->
<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <p style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#B45309;">
      Conferência Reentrega
    </p>
    <strong style="font-size:14px;">{{rota}}</strong>
    <p style="margin:2px 0; font-size:11px;">{{todos_clientes}}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#555;">
    <p>Seq. {{sequencia}}</p>
    <p>Placa: {{placa}}</p>
    <p>{{empresa}}</p>
  </div>
</div>`;

export const TEMPLATE_CARREGAMENTO_PADRAO = `<!-- Cabeçalho do Mapa de Carregamento -->
<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <p style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#888;">
      Mapa de Carregamento
    </p>
    <strong style="font-size:14px;">{{rota}}</strong>
    <p style="margin:2px 0; font-size:11px;">{{codigo_todos_clientes}}</p>
    <p style="margin:2px 0; font-size:11px;">{{info_adicionais_i}}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#555;">
    <p>{{id_mapa}}</p>
    <p>Placa: {{placa}}</p>
    <p>{{transportadora}}</p>
    <p>{{info_adicionais_ii}}</p>
  </div>
</div>
<div style="margin-top:6px; font-size:11px; border-top:1px solid #ccc; padding-top:4px;">
  <span>{{qtd_unidade_total}} un</span> ·
  <span>Peso: {{peso}}</span> ·
  <span>{{qtd_palete_total}} paletes</span>
</div>`;
