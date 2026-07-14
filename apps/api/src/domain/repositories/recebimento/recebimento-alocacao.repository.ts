export const RECEBIMENTO_ALOCACAO_REPOSITORY = 'IRecebimentoAlocacaoRepository';

export type RecebimentoAlocacaoStatus = 'atribuida' | 'iniciada' | 'cancelada';

export type RecebimentoAlocacaoRecord = {
  id: string;
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  status: RecebimentoAlocacaoStatus;
  atribuidoEm: Date;
  inicioEm: Date | null;
  canceladoEm: Date | null;
};

export type CriarAlocacaoRecebimentoInput = {
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  atribuidoPorUserId: number | null;
};

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
};

export type UltimaMissaoFinalizadaRecebimentoRecord = {
  funcionarioId: number;
  ultimaMissaoFinalizadaEm: Date;
};

export interface IRecebimentoAlocacaoRepository {
  criar(input: CriarAlocacaoRecebimentoInput): Promise<RecebimentoAlocacaoRecord>;
  findAtivaByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<RecebimentoAlocacaoRecord | null>;
  cancelar(id: string): Promise<RecebimentoAlocacaoRecord>;
  marcarIniciada(preRecebimentoId: string): Promise<void>;
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
