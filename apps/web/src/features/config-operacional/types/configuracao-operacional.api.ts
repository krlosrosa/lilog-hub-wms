import type { EtapaProdutividade } from '@/features/config-operacional/types/regra-produtividade-tabs';
import type { RegraConferencia } from '@/features/regras-conferencia/types/regra-conferencia.schema';
import type { RegraPausa } from '@/features/regras-pausas/types/regra-pausa.schema';
import type { PausaTipo } from '@/features/pausas/types/pausas.schema';

export const PRODUTIVIDADE_DOMINIO = 'expedicao' as const;
export const PRODUTIVIDADE_CATEGORIA = 'produtividade' as const;
export const PAUSAS_DOMINIO = 'configuracoes' as const;
export const PAUSAS_CATEGORIA = 'pausas' as const;
export const RECEBIMENTO_DOMINIO = 'recebimento' as const;
export const RECEBIMENTO_CONFERENCIA_CATEGORIA = 'conferencia' as const;
export const RECEBIMENTO_PARAMETROS_SUBTIPO = 'parametros' as const;

export type ParametrosConferenciaApi = {
  gorduraInicioMapaSeg: number;
  tempoPrimeiroItemSeg: number;
  tempoDemaisItensSeg: number;
  tempoPorPaleteSeg: number;
  tempoPorClienteSeg: number;
  gorduraFimMapaSeg: number;
};

export type ParametrosPausaApi = {
  intervaloTrabalhoMinutos: number;
  duracaoPausaMinutos: number;
};

export type QuantidadeModoApi = 'caixa' | 'unidade' | 'ambos';
export type LoteModoApi = 'lote' | 'fabricacao' | 'ambos';
export type DisplayUnidadePadraoApi = 'CX' | 'UN';

export type CondicaoChecklistItem = {
  id: string;
  label: string;
};

export const DEFAULT_CONDICOES_CHECKLIST: CondicaoChecklistItem[] = [
  { id: 'limpeza', label: 'Limpeza Interna' },
  { id: 'odor', label: 'Ausência de Odor' },
  { id: 'estrutura', label: 'Integridade Estrutural' },
  { id: 'vedacao', label: 'Vedação das Portas' },
];

export type ParametrosRecebimentoConferenciaApi = {
  quantidadeModo: QuantidadeModoApi;
  loteModo: LoteModoApi;
  controlaPalete: boolean;
  solicitarPesoPvar: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  displayUnidadePadrao: DisplayUnidadePadraoApi;
  displayDecimaisCaixa: number;
  displayDecimaisUnidade: number;
  condicoesChecklist: CondicaoChecklistItem[];
};

export const DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA: ParametrosRecebimentoConferenciaApi =
  {
    quantidadeModo: 'ambos',
    loteModo: 'lote',
    controlaPalete: false,
    solicitarPesoPvar: true,
    exigirEtiquetaPesoVariavel: false,
    displayUnidadePadrao: 'UN',
    displayDecimaisCaixa: 2,
    displayDecimaisUnidade: 0,
    condicoesChecklist: DEFAULT_CONDICOES_CHECKLIST,
  };

export type RegrasPausaPadraoMap = Partial<Record<PausaTipo, ParametrosPausaApi>>;

export type ParametrosConfiguracaoOperacionalApi =
  | ParametrosConferenciaApi
  | ParametrosPausaApi
  | ParametrosRecebimentoConferenciaApi;

export type ConfiguracaoOperacionalApi = {
  id: string;
  unidadeId: string;
  dominio: string;
  categoria: string;
  subtipo: EtapaProdutividade | PausaTipo;
  nome: string;
  descricao: string | null;
  parametros: ParametrosConfiguracaoOperacionalApi;
  versaoSchema: number;
  isPadrao: boolean;
  ativo: boolean;
  criadoPor: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ListConfiguracoesOperacionaisApiResponse = {
  items: ConfiguracaoOperacionalApi[];
};

export type CreateConfiguracaoOperacionalApiPayload = {
  unidadeId: string;
  dominio:
    | typeof PRODUTIVIDADE_DOMINIO
    | typeof PAUSAS_DOMINIO
    | typeof RECEBIMENTO_DOMINIO;
  categoria:
    | typeof PRODUTIVIDADE_CATEGORIA
    | typeof PAUSAS_CATEGORIA
    | typeof RECEBIMENTO_CONFERENCIA_CATEGORIA;
  subtipo:
    | EtapaProdutividade
    | PausaTipo
    | typeof RECEBIMENTO_PARAMETROS_SUBTIPO;
  nome: string;
  descricao?: string;
  parametros: ParametrosConfiguracaoOperacionalApi;
  isPadrao?: boolean;
  ativo?: boolean;
};

export type UpdateConfiguracaoOperacionalApiPayload = {
  nome?: string;
  descricao?: string | null;
  parametros?: ParametrosConfiguracaoOperacionalApi;
  isPadrao?: boolean;
  ativo?: boolean;
};

export function mapApiToRegraConferencia(
  item: ConfiguracaoOperacionalApi,
): RegraConferencia {
  const parametros = item.parametros as ParametrosConferenciaApi;

  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? undefined,
    ativo: item.ativo,
    padrao: item.isPadrao,
    gorduraInicioMapaSeg: parametros.gorduraInicioMapaSeg,
    tempoPrimeiroItemSeg: parametros.tempoPrimeiroItemSeg,
    tempoDemaisItensSeg: parametros.tempoDemaisItensSeg,
    tempoPorPaleteSeg: parametros.tempoPorPaleteSeg,
    tempoPorClienteSeg: parametros.tempoPorClienteSeg,
    gorduraFimMapaSeg: parametros.gorduraFimMapaSeg,
    atualizadoEm: item.updatedAt,
  };
}

export function extractParametrosConferencia(
  form: Pick<
    RegraConferencia,
    | 'gorduraInicioMapaSeg'
    | 'tempoPrimeiroItemSeg'
    | 'tempoDemaisItensSeg'
    | 'tempoPorPaleteSeg'
    | 'tempoPorClienteSeg'
    | 'gorduraFimMapaSeg'
  >,
): ParametrosConferenciaApi {
  return {
    gorduraInicioMapaSeg: form.gorduraInicioMapaSeg,
    tempoPrimeiroItemSeg: form.tempoPrimeiroItemSeg,
    tempoDemaisItensSeg: form.tempoDemaisItensSeg,
    tempoPorPaleteSeg: form.tempoPorPaleteSeg,
    tempoPorClienteSeg: form.tempoPorClienteSeg,
    gorduraFimMapaSeg: form.gorduraFimMapaSeg,
  };
}

export function mapApiToRegraPausa(item: ConfiguracaoOperacionalApi): RegraPausa {
  const parametros = item.parametros as ParametrosPausaApi;

  return {
    id: item.id,
    nome: item.nome,
    descricao: item.descricao ?? undefined,
    ativo: item.ativo,
    padrao: item.isPadrao,
    tipo: item.subtipo as PausaTipo,
    intervaloTrabalhoMinutos: parametros.intervaloTrabalhoMinutos,
    duracaoPausaMinutos: parametros.duracaoPausaMinutos,
    atualizadoEm: item.updatedAt,
  };
}

export function extractParametrosPausa(
  form: Pick<RegraPausa, 'intervaloTrabalhoMinutos' | 'duracaoPausaMinutos'>,
): ParametrosPausaApi {
  return {
    intervaloTrabalhoMinutos: form.intervaloTrabalhoMinutos,
    duracaoPausaMinutos: form.duracaoPausaMinutos,
  };
}

export function mapRegrasPausaPadraoFromItems(
  items: ConfiguracaoOperacionalApi[],
): RegrasPausaPadraoMap {
  const regras: RegrasPausaPadraoMap = {};

  for (const item of items) {
    if (!item.ativo || !item.isPadrao) {
      continue;
    }

    const tipo = item.subtipo as PausaTipo;
    if (tipo !== 'termica' && tipo !== 'refeicao' && tipo !== 'outros') {
      continue;
    }

    regras[tipo] = extractParametrosPausa(item.parametros as ParametrosPausaApi);
  }

  return regras;
}
