import type {
  CreateConfiguracaoOperacionalInput,
  ParametrosConfiguracaoOperacional,
  RegrasPausaPadraoMap,
  SubtipoConfiguracao,
  UpdateConfiguracaoOperacionalInput,
} from '../../model/configuracao-operacional/configuracao-operacional.model.js';

export const CONFIGURACAO_OPERACIONAL_REPOSITORY =
  'IConfiguracaoOperacionalRepository';

export type ConfiguracaoOperacionalRecord = {
  id: string;
  unidadeId: string;
  dominio: string;
  categoria: string;
  subtipo: SubtipoConfiguracao;
  nome: string;
  descricao: string | null;
  parametros: ParametrosConfiguracaoOperacional;
  versaoSchema: number;
  isPadrao: boolean;
  ativo: boolean;
  criadoPor: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListConfiguracoesOperacionaisFilter = {
  unidadeId: string;
  dominio?: string;
  categoria?: string;
  subtipo?: SubtipoConfiguracao;
  ativo?: boolean;
};

export interface IConfiguracaoOperacionalRepository {
  list(
    filter: ListConfiguracoesOperacionaisFilter,
  ): Promise<ConfiguracaoOperacionalRecord[]>;
  findById(id: string): Promise<ConfiguracaoOperacionalRecord | null>;
  findByUnidadeDominioCategoriaSubtipoNome(
    unidadeId: string,
    dominio: string,
    categoria: string,
    subtipo: SubtipoConfiguracao,
    nome: string,
  ): Promise<ConfiguracaoOperacionalRecord | null>;
  create(
    data: CreateConfiguracaoOperacionalInput,
  ): Promise<ConfiguracaoOperacionalRecord>;
  update(
    id: string,
    data: UpdateConfiguracaoOperacionalInput,
  ): Promise<ConfiguracaoOperacionalRecord | null>;
  delete(id: string): Promise<void>;
  definirPadrao(
    id: string,
    unidadeId: string,
    dominio: string,
    categoria: string,
    subtipo: SubtipoConfiguracao,
  ): Promise<ConfiguracaoOperacionalRecord | null>;
  duplicar(id: string): Promise<ConfiguracaoOperacionalRecord | null>;
  findRegrasPausaPadrao(unidadeId: string): Promise<RegrasPausaPadraoMap>;
}
