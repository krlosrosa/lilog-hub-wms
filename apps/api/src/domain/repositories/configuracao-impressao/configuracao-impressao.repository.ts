import type {
  ConfiguracaoImpressaoConteudo,
  CreateConfiguracaoImpressaoInput,
  TemplatesHtml,
  UpdateConfiguracaoImpressaoInput,
} from '../../model/configuracao-impressao/configuracao-impressao.model.js';

export const CONFIGURACAO_IMPRESSAO_REPOSITORY =
  'IConfiguracaoImpressaoRepository';

export type ConfiguracaoImpressaoRecord = {
  id: string;
  unidadeId: string;
  nome: string;
  configuracao: ConfiguracaoImpressaoConteudo;
  templatesHtml: TemplatesHtml;
  isPadrao: boolean;
  criadoPor: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListConfiguracoesImpressaoFilter = {
  unidadeId: string;
};

export interface IConfiguracaoImpressaoRepository {
  list(
    filter: ListConfiguracoesImpressaoFilter,
  ): Promise<ConfiguracaoImpressaoRecord[]>;
  findById(id: string): Promise<ConfiguracaoImpressaoRecord | null>;
  findByUnidadeAndNome(
    unidadeId: string,
    nome: string,
  ): Promise<ConfiguracaoImpressaoRecord | null>;
  create(
    data: CreateConfiguracaoImpressaoInput,
  ): Promise<ConfiguracaoImpressaoRecord>;
  update(
    id: string,
    data: UpdateConfiguracaoImpressaoInput,
  ): Promise<ConfiguracaoImpressaoRecord | null>;
  delete(id: string): Promise<void>;
  definirPadrao(id: string, unidadeId: string): Promise<ConfiguracaoImpressaoRecord | null>;
}
