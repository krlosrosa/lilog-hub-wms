export const DEVOLUCAO_REPOSITORY = 'IDevolucaoRepository';

export type DevolucaoNotaFiscalTipo =
  | 'reentrega'
  | 'devolucao_parcial'
  | 'devolucao_total';

export const DEVOLUCAO_NF_TIPOS_ELEGIVEIS_TRANSPORTE: DevolucaoNotaFiscalTipo[] =
  ['reentrega', 'devolucao_total'];

export type DemandaDevolucaoStatus =
  | 'rascunho'
  | 'aberta'
  | 'em_analise'
  | 'em_execucao'
  | 'conferida'
  | 'concluida'
  | 'cancelada';

export type CriarDevolucaoItemInput = {
  codigoProduto?: string;
  produtoId?: string | null;
  sku: string;
  descricaoProduto?: string | null;
  dataFabricacao?: string | null;
  quantidade: number;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  pesoDevolvido?: number | null;
  motivoItem?: string | null;
  observacao?: string | null;
};

export type CriarDevolucaoNotaFiscalInput = {
  numeroNf: string;
  tipo: DevolucaoNotaFiscalTipo;
  motivo: string;
  observacao?: string | null;
  transporteId?: string | null;
  codCliente?: string | null;
  cliente?: string | null;
  cidade?: string | null;
  itens: CriarDevolucaoItemInput[];
};

export type CriarDemandaDevolucaoViagemInput = {
  unidadeId: string;
  codigoDemanda: string;
  transporteId: string | null;
  placa?: string | null;
  observacao?: string | null;
  notasFiscais: CriarDevolucaoNotaFiscalInput[];
};

export type DemandaDevolucaoRecord = {
  id: string;
  unidadeId: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatus;
};

export type CriarDemandaDevolucaoViagemResult = {
  created: boolean;
  demanda: DemandaDevolucaoRecord | null;
};

export type ListarDemandasDevolucaoFilter = {
  unidadeId: string;
  status?: DemandaDevolucaoStatus;
  semGrupo?: boolean;
};

export type DemandaDevolucaoListItem = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatus;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
  concluidaAt: Date | null;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  transporteId: string | null;
  placa: string | null;
  cliente: string | null;
  tiposNf: DevolucaoNotaFiscalTipo[];
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
  grupoDescargaId: string | null;
  codigoGrupo: string | null;
};

export type DevolucaoGestaoStats = {
  total: number;
  rascunho: number;
  aberta: number;
  emAnalise: number;
  emExecucao: number;
  conferida: number;
  concluida: number;
  cancelada: number;
};

export type ListarDemandasDevolucaoResult = {
  demandas: DemandaDevolucaoListItem[];
  stats: DevolucaoGestaoStats;
};

export type AtualizarStatusDemandaInput = {
  status: DemandaDevolucaoStatus;
  observacao?: string | null;
  doca?: string | null;
  cargaSegregada?: boolean;
  paletesEsperados?: number | null;
  criadoPorUserId?: number | null;
};

export type AtualizarStatusDemandaResult = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatus;
  statusAnterior: DemandaDevolucaoStatus;
  updatedAt: Date;
  concluidaAt: Date | null;
};

export type DevolucaoItemCondicao =
  | 'integro'
  | 'avariado'
  | 'vencido'
  | 'violado'
  | 'nao_identificado';

export type BuscarDemandaDevolucaoFilter = {
  demandaId: string;
  unidadeId: string;
};

export type DevolucaoItemDetalhe = {
  id: string;
  produtoId: string | null;
  sku: string;
  descricaoProduto: string | null;
  lote: string | null;
  dataFabricacao: string | null;
  quantidade: number;
  qtdConferida: number | null;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  pesoDevolvido: number | null;
  motivoItem: string | null;
  condicao: DevolucaoItemCondicao;
  observacao: string | null;
  createdAt: Date;
  pesoVariavel: boolean;
};

export type DevolucaoNotaFiscalDetalhe = {
  id: string;
  numeroNf: string;
  chaveAcesso: string | null;
  tipo: DevolucaoNotaFiscalTipo;
  motivo: string;
  cliente: string | null;
  codCliente: string | null;
  transporteId: string | null;
  observacao: string | null;
  createdAt: Date;
  itens: DevolucaoItemDetalhe[];
};

export type DevolucaoEventoDetalhe = {
  id: string;
  statusAnterior: DemandaDevolucaoStatus | null;
  statusNovo: DemandaDevolucaoStatus;
  descricao: string | null;
  criadoPorUserId: number | null;
  createdAt: Date;
};

export type DevolucaoChecklistDetalhe = {
  id: string;
  dock: string;
  paletesRecebidos: number;
  tempBau: number | null;
  tempProduto: number | null;
  conditions: Record<string, boolean>;
  observacoes: string | null;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BuscarDemandaDevolucaoResult = {
  id: string;
  unidadeId: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatus;
  observacao: string | null;
  placa: string | null;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
  createdAt: Date;
  updatedAt: Date;
  concluidaAt: Date | null;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  transporteId: string | null;
  cliente: string | null;
  tiposNf: DevolucaoNotaFiscalTipo[];
  notasFiscais: DevolucaoNotaFiscalDetalhe[];
  eventos: DevolucaoEventoDetalhe[];
  checklist: DevolucaoChecklistDetalhe | null;
};

export type DeletarDemandaDevolucaoResult = {
  id: string;
  codigoDemanda: string;
};

export type DevolucaoAlocacaoFuncao = 'lider' | 'conferente' | 'auxiliar';

export type DevolucaoAlocacaoStatus = 'em_andamento' | 'concluida' | 'cancelada';

export type DevolucaoAlocacaoEtapa =
  | 'aguardando'
  | 'checklist'
  | 'conferencia'
  | 'finalizacao'
  | 'concluida';

export type CriarAlocacaoDevolucaoInput = {
  demandaId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcao?: DevolucaoAlocacaoFuncao;
  unidadeId: string;
};

export type DevolucaoAlocacaoRecord = {
  id: string;
  demandaId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcao: DevolucaoAlocacaoFuncao;
  status: DevolucaoAlocacaoStatus;
  atribuidoEm: Date;
  inicioEm: Date | null;
  fimEm: Date | null;
};

export type DevolucaoAlocacaoComContexto = DevolucaoAlocacaoRecord & {
  codigoDemanda: string;
  demandaStatus: DemandaDevolucaoStatus;
  etapa: DevolucaoAlocacaoEtapa;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  cliente: string | null;
  placa: string | null;
  transporteId: string | null;
  tempoEsperadoMinutos: number;
  funcionarioId: number;
};

export type RemoverAlocacaoDevolucaoResult = {
  id: string;
  demandaId: string;
};

export type RegistrarConferenciaItemInput = {
  itemId: string;
  condicao?: DevolucaoItemCondicao;
  qtdConferida: number;
  lote?: string | null;
  dataFabricacao?: string | null;
  observacao?: string | null;
};

export type RegistrarConferenciaItensInput = {
  demandaId: string;
  unidadeId: string;
  status?: Extract<
    DemandaDevolucaoStatus,
    'em_analise' | 'em_execucao' | 'conferida' | 'concluida'
  >;
  itens?: RegistrarConferenciaItemInput[];
  criadoPorUserId?: number | null;
};

export type RegistrarConferenciaItensResult = {
  demandaId: string;
  itensAtualizados: number;
  status?: DemandaDevolucaoStatus;
};

export type RegistrarAvariaDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
  itemId?: string | null;
  tipo: string;
  natureza?: string | null;
  causa?: string | null;
  quantidadeCaixa?: number | null;
  quantidadeUnidade?: number | null;
  observacao?: string | null;
  photoUrls?: string[];
  replicarSkus?: string[];
  criadoPorUserId?: number | null;
};

export type RegistrarAvariaDevolucaoResult = {
  id: string;
  demandaId: string;
  itemId: string | null;
  itensAfetados: number;
};

export type DevolucaoAvariaDemandaRecord = {
  id: string;
  itemId: string | null;
  itemSku: string | null;
  skusAfetados: string[] | null;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
};

export type DevolucaoAvariaDetalheRecord = {
  id: string;
  demandaId: string;
  itemId: string | null;
  itemSku: string | null;
  tipo: string;
  natureza: string | null;
  causa: string | null;
  quantidadeCaixa: number;
  quantidadeUnidade: number;
  skusAfetados: string[] | null;
  observacao: string | null;
  photoUrls: string[];
  createdAt: Date;
};

export type SalvarChecklistDevolucaoInput = {
  demandaId: string;
  unidadeId: string;
  dock: string;
  paletesRecebidos: number;
  tempBau?: number | null;
  tempProduto?: number | null;
  conditions: Record<string, boolean>;
  observacoes?: string | null;
  photoCount?: number;
  criadoPorUserId?: number | null;
};

export type SalvarChecklistDevolucaoResult = {
  id: string;
  demandaId: string;
};

export type DevolucaoFaltaPesoStatus = 'pendente' | 'validada' | 'rejeitada';

export type DevolucaoFaltaPesoTratativaContabil = 'diferenca_peso';

export type RegistrarFaltaPesoInput = {
  demandaId: string;
  unidadeId: string;
  notaFiscalId: string;
  itemId: string;
  sku: string;
  diferencaKg: number;
  zerarQuantidadeContabil?: boolean;
  observacao?: string | null;
  registradoPorUserId?: number | null;
};

export type AtualizarFaltaPesoInput = {
  faltaPesoId: string;
  demandaId: string;
  unidadeId: string;
  diferencaKg: number;
  zerarQuantidadeContabil: boolean;
  observacao?: string | null;
};

export type RegistrarFaltaPesoResult = {
  id: string;
  demandaId: string;
  itemId: string;
  pesoFaltanteKg: number;
  quantidadeFiscalOriginal: number | null;
  quantidadeContabilConsiderada: number;
  tratativaContabil: DevolucaoFaltaPesoTratativaContabil;
  zerarQuantidadeContabil: boolean;
  status: DevolucaoFaltaPesoStatus;
};

export type ValidarFaltaPesoInput = {
  faltaPesoId: string;
  demandaId: string;
  unidadeId: string;
  status: Extract<DevolucaoFaltaPesoStatus, 'validada' | 'rejeitada'>;
  validadoPorUserId?: number | null;
};

export type ListarFaltasPesoFilter = {
  demandaId: string;
  unidadeId: string;
  status?: DevolucaoFaltaPesoStatus;
};

export type DevolucaoFaltaPesoRecord = {
  id: string;
  demandaId: string;
  notaFiscalId: string;
  itemId: string;
  sku: string;
  descricaoProduto: string | null;
  pesoVariavel: boolean;
  pesoEsperadoKg: number;
  pesoDevolvidoKg: number;
  pesoFaltanteKg: number;
  quantidadeFiscalOriginal: number | null;
  quantidadeContabilConsiderada: number;
  tratativaContabil: DevolucaoFaltaPesoTratativaContabil;
  zerarQuantidadeContabil: boolean;
  motivo: string | null;
  observacao: string | null;
  status: DevolucaoFaltaPesoStatus;
  registradoPorUserId: number | null;
  registradoEm: Date;
  validadoPorUserId: number | null;
  validadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DevolucaoGrupoDescargaStatus =
  | 'rascunho'
  | 'aguardando_conferencia'
  | 'em_conferencia'
  | 'conferida'
  | 'concluida'
  | 'cancelada';

export type DevolucaoItemNaoContabilStatus =
  | 'pendente'
  | 'conciliado'
  | 'descartado'
  | 'gerou_ocorrencia';

export type CriarGrupoDescargaInput = {
  unidadeId: string;
  demandaIds: string[];
  placaDescarga: string;
  doca?: string | null;
  cargaSegregada?: boolean;
  paletesEsperados?: number | null;
  observacao?: string | null;
  criadoPorUserId?: number | null;
  liberarConferencia?: boolean;
};

export type CriarGrupoDescargaResult = {
  id: string;
  codigoGrupo: string;
  status: DevolucaoGrupoDescargaStatus;
  totalDemandas: number;
};

export type ListarGruposDescargaFilter = {
  unidadeId: string;
  status?: DevolucaoGrupoDescargaStatus;
};

export type GrupoDescargaListItem = {
  id: string;
  codigoGrupo: string;
  placaDescarga: string;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
  observacao: string | null;
  status: DevolucaoGrupoDescargaStatus;
  totalDemandas: number;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type ListarGruposDescargaResult = {
  grupos: GrupoDescargaListItem[];
};

export type GrupoDescargaDemandaResumo = {
  id: string;
  codigoDemanda: string;
  placa: string | null;
  status: DemandaDevolucaoStatus;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
};

export type GrupoDescargaItemEsperado = {
  itemId: string;
  demandaId: string;
  codigoDemanda: string;
  notaFiscalId: string;
  numeroNf: string;
  sku: string;
  descricaoProduto: string | null;
  quantidade: number;
  qtdConferida: number | null;
  unidadeMedida: string;
  condicao: DevolucaoItemCondicao;
  pesoVariavel: boolean;
};

export type GrupoDescargaItemNaoContabilRecord = {
  id: string;
  sku: string;
  descricaoProduto: string | null;
  quantidadeConferida: number;
  unidadeMedida: string;
  lote: string | null;
  dataFabricacao: string | null;
  condicao: DevolucaoItemCondicao;
  observacao: string | null;
  status: DevolucaoItemNaoContabilStatus;
  demandaId: string | null;
  createdAt: Date;
};

export type BuscarGrupoDescargaFilter = {
  grupoId: string;
  unidadeId: string;
};

export type BuscarGrupoDescargaResult = {
  id: string;
  unidadeId: string;
  codigoGrupo: string;
  placaDescarga: string;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
  observacao: string | null;
  status: DevolucaoGrupoDescargaStatus;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  demandas: GrupoDescargaDemandaResumo[];
  itensEsperados: GrupoDescargaItemEsperado[];
  itensNaoContabeis: GrupoDescargaItemNaoContabilRecord[];
};

export type AtualizarStatusGrupoDescargaInput = {
  grupoId: string;
  unidadeId: string;
  status: DevolucaoGrupoDescargaStatus;
  observacao?: string | null;
  criadoPorUserId?: number | null;
};

export type AtualizarStatusGrupoDescargaResult = {
  id: string;
  codigoGrupo: string;
  status: DevolucaoGrupoDescargaStatus;
  statusAnterior: DevolucaoGrupoDescargaStatus;
  updatedAt: Date;
};

export type RegistrarConferenciaGrupoItemInput = {
  itemId: string;
  condicao?: DevolucaoItemCondicao;
  qtdConferida: number;
  lote?: string | null;
  dataFabricacao?: string | null;
  observacao?: string | null;
};

export type RegistrarItemNaoContabilGrupoInput = {
  sku: string;
  descricaoProduto?: string | null;
  quantidadeConferida: number;
  unidadeMedida: string;
  lote?: string | null;
  dataFabricacao?: string | null;
  condicao?: DevolucaoItemCondicao;
  observacao?: string | null;
  demandaId?: string | null;
};

export type RegistrarConferenciaGrupoInput = {
  grupoId: string;
  unidadeId: string;
  itens?: RegistrarConferenciaGrupoItemInput[];
  itensNaoContabeis?: RegistrarItemNaoContabilGrupoInput[];
  status?: Extract<
    DevolucaoGrupoDescargaStatus,
    'em_conferencia' | 'conferida' | 'concluida'
  >;
  criadoPorUserId?: number | null;
};

export type RegistrarConferenciaGrupoResult = {
  grupoId: string;
  itensAtualizados: number;
  itensNaoContabeisRegistrados: number;
  status?: DevolucaoGrupoDescargaStatus;
  demandasAtualizadas: string[];
};

export interface IDevolucaoRepository {
  findDemandaByCodigo(
    unidadeId: string,
    codigoDemanda: string,
  ): Promise<DemandaDevolucaoRecord | null>;

  criarDemandaDevolucaoViagem(
    input: CriarDemandaDevolucaoViagemInput,
  ): Promise<CriarDemandaDevolucaoViagemResult>;

  listarDemandas(
    filter: ListarDemandasDevolucaoFilter,
  ): Promise<ListarDemandasDevolucaoResult>;

  atualizarStatus(
    demandaId: string,
    unidadeId: string,
    input: AtualizarStatusDemandaInput,
  ): Promise<AtualizarStatusDemandaResult | null>;

  buscarDemanda(
    filter: BuscarDemandaDevolucaoFilter,
  ): Promise<BuscarDemandaDevolucaoResult | null>;

  deletarDemanda(
    demandaId: string,
    unidadeId: string,
  ): Promise<DeletarDemandaDevolucaoResult | null>;

  criarAlocacao(
    input: CriarAlocacaoDevolucaoInput,
  ): Promise<DevolucaoAlocacaoRecord>;

  removerAlocacao(
    alocacaoId: string,
    unidadeId: string,
  ): Promise<RemoverAlocacaoDevolucaoResult | null>;

  listarAlocacoesPorSessao(
    sessaoId: string,
    unidadeId: string,
  ): Promise<DevolucaoAlocacaoComContexto[]>;

  registrarConferenciaItens(
    input: RegistrarConferenciaItensInput,
  ): Promise<RegistrarConferenciaItensResult | null>;

  registrarAvaria(
    input: RegistrarAvariaDevolucaoInput,
  ): Promise<RegistrarAvariaDevolucaoResult | null>;

  listarAvariasDemanda(
    demandaId: string,
    unidadeId: string,
  ): Promise<DevolucaoAvariaDemandaRecord[]>;

  listarAvariasDetalhe(
    demandaId: string,
    unidadeId: string,
  ): Promise<DevolucaoAvariaDetalheRecord[]>;

  salvarChecklist(
    input: SalvarChecklistDevolucaoInput,
  ): Promise<SalvarChecklistDevolucaoResult | null>;

  registrarFaltaPeso(
    input: RegistrarFaltaPesoInput,
  ): Promise<RegistrarFaltaPesoResult | null>;

  atualizarFaltaPeso(
    input: AtualizarFaltaPesoInput,
  ): Promise<DevolucaoFaltaPesoRecord | null>;

  validarFaltaPeso(
    input: ValidarFaltaPesoInput,
  ): Promise<DevolucaoFaltaPesoRecord | null>;

  listarFaltasPeso(
    filter: ListarFaltasPesoFilter,
  ): Promise<DevolucaoFaltaPesoRecord[]>;

  criarGrupoDescarga(
    input: CriarGrupoDescargaInput,
  ): Promise<CriarGrupoDescargaResult>;

  listarGruposDescarga(
    filter: ListarGruposDescargaFilter,
  ): Promise<ListarGruposDescargaResult>;

  buscarGrupoDescarga(
    filter: BuscarGrupoDescargaFilter,
  ): Promise<BuscarGrupoDescargaResult | null>;

  atualizarStatusGrupoDescarga(
    input: AtualizarStatusGrupoDescargaInput,
  ): Promise<AtualizarStatusGrupoDescargaResult | null>;

  registrarConferenciaGrupo(
    input: RegistrarConferenciaGrupoInput,
  ): Promise<RegistrarConferenciaGrupoResult | null>;
}
