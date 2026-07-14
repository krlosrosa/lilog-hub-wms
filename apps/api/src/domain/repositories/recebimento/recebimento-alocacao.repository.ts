export const RECEBIMENTO_ALOCACAO_REPOSITORY = 'IRecebimentoAlocacaoRepository';

export type RecebimentoAlocacaoStatus =
  | 'atribuida'
  | 'iniciada'
  | 'cancelada'
  | 'encerrada';

export type RecebimentoAlocacaoPapel = 'responsavel' | 'apoio';

export type RecebimentoAlocacaoRecord = {
  id: string;
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  papel: RecebimentoAlocacaoPapel;
  status: RecebimentoAlocacaoStatus;
  atribuidoEm: Date;
  inicioEm: Date | null;
  canceladoEm: Date | null;
  encerradoEm: Date | null;
};

export type ApoioRecebimentoRecord = {
  id: string;
  preRecebimentoId: string;
  funcionarioId: number;
  funcionarioNome: string;
  funcionarioMatricula: string;
  status: RecebimentoAlocacaoStatus;
  atribuidoEm: Date;
};

export type CriarAlocacaoRecebimentoInput = {
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  atribuidoPorUserId: number | null;
};

export type CriarApoioRecebimentoInput = CriarAlocacaoRecebimentoInput;

export type DemandaRecebimentoComAlocacao = {
  preRecebimentoId: string;
  placa: string | null;
  transportadoraNome: string | null;
  horarioPrevisto: Date;
  skuCount: number;
  dock: string | null;
  situacao: string;
  recebimentoId: string | null;
  recebimentoDataInicio: Date | null;
  alocacaoId: string | null;
  alocacaoStatus: RecebimentoAlocacaoStatus | null;
  alocacaoSessaoFuncionarioId: string | null;
  alocacaoFuncionarioId: number | null;
  alocacaoFuncionarioNome: string | null;
  alocacaoFuncionarioMatricula: string | null;
  alocacaoAtribuidoEm: Date | null;
  conferenteId: number | null;
  conferenteNome: string | null;
  empresas: string[];
  categorias: string[];
};

export type UltimaMissaoFinalizadaRecebimentoRecord = {
  funcionarioId: number;
  ultimaMissaoFinalizadaEm: Date;
};

export interface IRecebimentoAlocacaoRepository {
  criar(input: CriarAlocacaoRecebimentoInput): Promise<RecebimentoAlocacaoRecord>;
  criarApoio(input: CriarApoioRecebimentoInput): Promise<RecebimentoAlocacaoRecord>;
  findAtivaByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<RecebimentoAlocacaoRecord | null>;
  findApoioAtivo(
    preRecebimentoId: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord | null>;
  cancelar(id: string): Promise<RecebimentoAlocacaoRecord>;
  cancelarApoio(id: string): Promise<RecebimentoAlocacaoRecord>;
  encerrarApoio(
    id: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord>;
  marcarIniciada(preRecebimentoId: string): Promise<void>;
  listApoiosByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<ApoioRecebimentoRecord[]>;
  listApoiosByFuncionario(
    sessaoId: string,
    funcionarioId: number,
  ): Promise<RecebimentoAlocacaoRecord[]>;
  listDemandasComAlocacao(
    sessaoId: string,
    unidadeId: string,
  ): Promise<DemandaRecebimentoComAlocacao[]>;
  listUltimasMissoesFinalizadasPorSessao(
    sessaoId: string,
    unidadeId: string,
    sessaoInicio: Date | null,
    funcionarioIds: number[],
  ): Promise<UltimaMissaoFinalizadaRecebimentoRecord[]>;
}
