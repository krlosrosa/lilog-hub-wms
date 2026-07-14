import type {
  CreateEscalaInput,
  CreateSessaoInput,
  IniciarSessaoPausaInput,
  UpdateSessaoFuncionarioPresencaInput,
} from '../../model/sessao-operacao/sessao-operacao.model.js';

export const SESSAO_OPERACAO_REPOSITORY = 'ISessaoOperacaoRepository';

export type EscalaRecord = {
  id: string;
  unidadeId: string;
  equipeId: string;
  nome: string;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  ativo: boolean;
  equipeNome: string;
  equipeArea: string | null;
  totalFuncionarios: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EscalaDetailRecord = EscalaRecord;

export type EquipeFuncionarioRecord = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  createdAt: Date;
};

export type ListEscalasFilter = {
  unidadeId: string;
  page: number;
  limit: number;
};

export type ListEscalasResult = {
  items: EscalaRecord[];
  total: number;
  page: number;
  limit: number;
};

export type EquipeRecord = {
  id: string;
  unidadeId: string;
  nome: string;
  area: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ListEquipesFilter = {
  unidadeId: string;
  page: number;
  limit: number;
  ativo?: boolean;
};

export type ListEquipesResult = {
  items: EquipeRecord[];
  total: number;
  page: number;
  limit: number;
};

export type SessaoRecord = {
  id: string;
  unidadeId: string;
  escalaId: string;
  equipeId: string;
  dataReferencia: string;
  inicioPlanejado: Date;
  fimPlanejado: Date;
  inicioReal: Date | null;
  fimReal: Date | null;
  status: 'planejada' | 'aberta' | 'encerrada' | 'cancelada';
  escalaNome: string;
  equipeNome: string;
  equipeArea: string | null;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  totalFuncionarios: number;
  abertaPorUserId: number | null;
  encerradaPorUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SessaoFuncionarioRecord = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: 'esperado' | 'presente' | 'falta' | 'atestado' | 'folga' | 'atraso';
  checkIn: Date | null;
  checkOut: Date | null;
  observacao: string | null;
  tipoVinculo: 'titular' | 'apoio';
  equipeOrigemId: string | null;
  equipeOrigemNome: string | null;
  apoioInicio: Date | null;
  apoioFim: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SessaoFuncionarioRefRecord = {
  id: string;
  funcionarioId: number;
  status: SessaoFuncionarioRecord['status'];
};

export type SessaoFuncionarioPausaRecord = {
  id: string;
  sessaoFuncionarioId: string;
  tipo: 'termica' | 'refeicao' | 'outros';
  inicio: Date;
  fim: Date | null;
  registradoPorUserId: number | null;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListSessaoFuncionarioPausasResult = {
  items: SessaoFuncionarioPausaRecord[];
  totalPausasMinutos: number;
  emPausaAgora: SessaoFuncionarioPausaRecord | null;
};

export type ListSessoesFilter = {
  unidadeId: string;
  page: number;
  limit: number;
  status?: 'planejada' | 'aberta' | 'encerrada' | 'cancelada';
  dataReferencia?: string;
  dataReferenciaInicio?: string;
  dataReferenciaFim?: string;
};

export type ListSessoesResult = {
  items: SessaoRecord[];
  total: number;
  page: number;
  limit: number;
};

export type AdicionarFuncionarioApoioInput = {
  sessaoId: string;
  funcionarioId: number;
  equipeOrigemId: string | null;
  sessaoOrigemId: string | null;
  userId: number;
};

export type FuncionarioApoioCandidatoRecord = {
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  sessaoOrigemId: string;
  equipeOrigemId: string;
  equipeOrigemNome: string;
  equipeOrigemArea: string | null;
  statusPresenca: SessaoFuncionarioRecord['status'];
};

export type SessaoTitularAbertaPorFuncionarioRecord = {
  sessaoId: string;
  equipeId: string;
  equipeNome: string;
};

export type SessaoFuncionarioRecebimentoAbertaRecord = {
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
};

export interface ISessaoOperacaoRepository {
  listEscalas(filter: ListEscalasFilter): Promise<ListEscalasResult>;
  listEquipes(filter: ListEquipesFilter): Promise<ListEquipesResult>;
  findEquipeById(id: string): Promise<EquipeRecord | null>;
  findEquipeIdByFuncionarioId(funcionarioId: number): Promise<string | null>;
  createEscalaComEquipe(input: CreateEscalaInput): Promise<EscalaDetailRecord>;
  findEscalaById(id: string): Promise<EscalaDetailRecord | null>;
  listEquipeFuncionarios(equipeId: string): Promise<EquipeFuncionarioRecord[]>;
  addEquipeFuncionario(
    equipeId: string,
    funcionarioId: number,
  ): Promise<EquipeFuncionarioRecord>;
  addEquipeFuncionarios(
    equipeId: string,
    funcionarioIds: number[],
  ): Promise<EquipeFuncionarioRecord[]>;
  removeEquipeFuncionario(
    equipeId: string,
    funcionarioId: number,
  ): Promise<boolean>;
  listSessoes(filter: ListSessoesFilter): Promise<ListSessoesResult>;
  createSessao(input: CreateSessaoInput): Promise<SessaoRecord>;
  findSessaoById(id: string): Promise<SessaoRecord | null>;
  findSessaoAbertaByEscalaId(escalaId: string): Promise<SessaoRecord | null>;
  abrirSessao(id: string, userId: number): Promise<SessaoRecord>;
  encerrarSessao(id: string, userId: number): Promise<SessaoRecord>;
  cancelarSessao(id: string): Promise<SessaoRecord>;
  listSessaoFuncionarios(sessaoId: string): Promise<SessaoFuncionarioRecord[]>;
  updateSessaoFuncionarioPresenca(
    sessaoId: string,
    funcionarioId: number,
    input: UpdateSessaoFuncionarioPresencaInput,
  ): Promise<SessaoFuncionarioRecord>;
  findSessaoFuncionario(
    sessaoId: string,
    funcionarioId: number,
  ): Promise<SessaoFuncionarioRefRecord | null>;
  findSessaoFuncionarioById(
    sessaoId: string,
    sessaoFuncionarioId: string,
  ): Promise<SessaoFuncionarioRefRecord | null>;
  listSessaoFuncionarioPausas(
    sessaoId: string,
    funcionarioId: number,
  ): Promise<ListSessaoFuncionarioPausasResult>;
  iniciarSessaoFuncionarioPausa(
    sessaoId: string,
    funcionarioId: number,
    userId: number,
    input: IniciarSessaoPausaInput,
  ): Promise<SessaoFuncionarioPausaRecord>;
  finalizarSessaoFuncionarioPausa(
    sessaoId: string,
    funcionarioId: number,
    userId: number,
  ): Promise<SessaoFuncionarioPausaRecord>;
  countPausasAbertasBySessaoId(sessaoId: string): Promise<number>;
  adicionarFuncionarioApoio(
    input: AdicionarFuncionarioApoioInput,
  ): Promise<SessaoFuncionarioRecord>;
  encerrarFuncionarioApoio(
    sessaoId: string,
    sessaoFuncionarioId: string,
    userId: number,
  ): Promise<SessaoFuncionarioRecord>;
  listFuncionariosApoioCandidatos(
    unidadeId: string,
    sessaoDestinoId: string,
  ): Promise<FuncionarioApoioCandidatoRecord[]>;
  findSessaoTitularAbertaPorFuncionario(
    unidadeId: string,
    funcionarioId: number,
    excludeSessaoId?: string,
  ): Promise<SessaoTitularAbertaPorFuncionarioRecord | null>;
  findSessaoFuncionarioRecebimentoAberta(
    unidadeId: string,
    funcionarioId: number,
  ): Promise<SessaoFuncionarioRecebimentoAbertaRecord | null>;
}
