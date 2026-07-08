import { DEFAULT_OPCOES_TABELAS_CARREGAMENTO } from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import type {
  ImpressaoConfig,
  QrCodeMapa,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import {
  TEMPLATE_CARREGAMENTO_PADRAO,
  TEMPLATE_CONFERENCIA_PADRAO,
  TEMPLATE_CONFERENCIA_REENTREGA_PADRAO,
  TEMPLATE_SEPARACAO_PADRAO,
} from '@/features/expedicao-impressao-config/types/layout-mapa';

export const DEFAULT_QR_CODE_MAPA: QrCodeMapa = {
  separacao: { posicao: 'superior_direito', tamanho: 72 },
  conferencia: { posicao: 'superior_direito', tamanho: 72 },
  conferencia_reentrega: { posicao: 'superior_direito', tamanho: 72 },
  carregamento: { posicao: 'superior_direito', tamanho: 72 },
};

export const DEFAULT_IMPRESSAO_CONFIG: ImpressaoConfig = {
  centroId: 'c290e8e6-9dd5-43cb-84eb-a432c3d62682',
  centroNome: 'LDB',
  tipoDadosBasicos: 'cliente',
  quebraPalete: {
    ativa: false,
    tipo: 'porcentual',
    percentual: 95,
  },
  opcoesSeparacao: {
    separarPaletesCompletos: true,
    separarUnidadesIndividuais: false,
    segregarFifo: false,
    faixasFifo: [],
    percentualMaximoDataFifo: 100,
  },
  opcoesConferencia: {
    classificarPor: 'pickway',
    agrupamento: 'replicar_separacao',
  },
  ordemImpressaoSeparacao: [
    'endereco',
    'sku',
    'descricao',
    'lote',
    'data_maxima',
    'quantidade_unidade',
  ],
  ordemImpressaoConferencia: [
    'sku',
    'descricao',
    'lote',
    'endereco',
    'quantidade_unidade',
    'quantidade_caixa',
  ],
  ordemImpressaoConferenciaReentrega: [
    'sku',
    'descricao',
    'lote',
    'endereco',
    'quantidade_unidade',
    'quantidade_caixa',
  ],
  layoutCabecalho: {
    separacao: TEMPLATE_SEPARACAO_PADRAO,
    conferencia: TEMPLATE_CONFERENCIA_PADRAO,
    conferencia_reentrega: TEMPLATE_CONFERENCIA_REENTREGA_PADRAO,
    carregamento: TEMPLATE_CARREGAMENTO_PADRAO,
  },
  qrCodeMapa: DEFAULT_QR_CODE_MAPA,
  opcoesTabelasCarregamento: structuredClone(DEFAULT_OPCOES_TABELAS_CARREGAMENTO),
  nomeCentroSistema: 'teste_1',
  usuarioId: '421931',
};
