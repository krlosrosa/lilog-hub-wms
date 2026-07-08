import type {
  ImpressaoConfig,
  ImpressaoConfigConteudo,
  PreConfiguracaoImpressao,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { TEMPLATE_CONFERENCIA_REENTREGA_PADRAO } from '@/features/expedicao-impressao-config/types/layout-mapa';

export type ConfiguracaoImpressaoConteudoApi = Omit<
  ImpressaoConfigConteudo,
  'layoutCabecalho'
>;

export type TemplatesHtmlApi = ImpressaoConfigConteudo['layoutCabecalho'];

export type ConfiguracaoImpressaoApi = {
  id: string;
  unidadeId: string;
  nome: string;
  configuracao: ConfiguracaoImpressaoConteudoApi;
  templatesHtml: TemplatesHtmlApi;
  isPadrao: boolean;
  criadoPor: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ListConfiguracoesImpressaoApiResponse = {
  items: ConfiguracaoImpressaoApi[];
};

export type CreateConfiguracaoImpressaoApiPayload = {
  unidadeId: string;
  nome: string;
  configuracao: ConfiguracaoImpressaoConteudoApi;
  templatesHtml: TemplatesHtmlApi;
  isPadrao?: boolean;
};

export type UpdateConfiguracaoImpressaoApiPayload = {
  nome?: string;
  configuracao?: ConfiguracaoImpressaoConteudoApi;
  templatesHtml?: TemplatesHtmlApi;
  isPadrao?: boolean;
};

export function splitConfigForApi(conteudo: ImpressaoConfigConteudo): {
  configuracao: ConfiguracaoImpressaoConteudoApi;
  templatesHtml: TemplatesHtmlApi;
} {
  const { layoutCabecalho, ...configuracao } = conteudo;

  return {
    configuracao,
    templatesHtml: layoutCabecalho,
  };
}

export function mergeApiToConteudo(
  configuracao: ConfiguracaoImpressaoConteudoApi,
  templatesHtml: TemplatesHtmlApi,
): ImpressaoConfigConteudo {
  const templatesNormalizados = {
    ...templatesHtml,
    conferencia_reentrega:
      templatesHtml.conferencia_reentrega?.trim().length
        ? templatesHtml.conferencia_reentrega
        : TEMPLATE_CONFERENCIA_REENTREGA_PADRAO,
  };

  return {
    ...configuracao,
    layoutCabecalho: templatesNormalizados,
    ordemImpressaoConferenciaReentrega:
      configuracao.ordemImpressaoConferenciaReentrega ??
      configuracao.ordemImpressaoConferencia,
    qrCodeMapa: {
      ...configuracao.qrCodeMapa,
      conferencia_reentrega:
        configuracao.qrCodeMapa?.conferencia_reentrega ??
        configuracao.qrCodeMapa?.conferencia,
    },
  };
}

export function mapApiToPreConfiguracao(
  item: ConfiguracaoImpressaoApi,
): PreConfiguracaoImpressao {
  return {
    id: item.id,
    nome: item.nome,
    config: mergeApiToConteudo(item.configuracao, item.templatesHtml),
    criadoEm: item.createdAt,
    isPadrao: item.isPadrao,
  };
}

export function buildPayloadFromConfig(
  unidadeId: string,
  nome: string,
  config: ImpressaoConfig,
  isPadrao = false,
): CreateConfiguracaoImpressaoApiPayload {
  const conteudo = extrairConteudoFromImpressaoConfig(config);
  const { configuracao, templatesHtml } = splitConfigForApi(conteudo);

  return {
    unidadeId,
    nome,
    configuracao,
    templatesHtml,
    isPadrao,
  };
}

function extrairConteudoFromImpressaoConfig(
  config: ImpressaoConfig,
): ImpressaoConfigConteudo {
  const {
    centroId: _centroId,
    centroNome: _centroNome,
    nomeCentroSistema: _nomeCentroSistema,
    usuarioId: _usuarioId,
    ...conteudo
  } = config;

  return conteudo;
}
