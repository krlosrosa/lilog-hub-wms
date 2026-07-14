import type {
  AlertaPausaApi,
  ProximaPausaApi,
  RecursosSessaoFuncionarioApi,
  RecursosSessaoKpiApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';

export type RecebimentoAlocacaoStatusApi =
  | 'atribuida'
  | 'iniciada'
  | 'cancelada'
  | 'encerrada';

export type DemandaRecebimentoStatusApi =
  | 'disponivel'
  | 'atribuida'
  | 'em_conferencia'
  | 'impedido';

export type AlocacaoRecebimentoApi = {
  id: string;
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  status: RecebimentoAlocacaoStatusApi;
  atribuidoEm: string;
  inicioEm: string | null;
  canceladoEm: string | null;
};

export type DemandaRecebimentoRecursoApi = {
  preRecebimentoId: string;
  placa: string | null;
  transportadoraNome: string | null;
  horarioPrevisto: string;
  skuCount: number;
  dock: string | null;
  statusDemanda: DemandaRecebimentoStatusApi;
  recebimentoId: string | null;
  recebimentoDataInicio: string | null;
  alocacao: {
    id: string;
    sessaoFuncionarioId: string;
    funcionarioId: number;
    funcionarioNome: string;
    funcionarioMatricula: string;
    atribuidoEm: string;
  } | null;
  conferente: {
    id: number;
    nome: string;
  } | null;
  apoios: Array<{
    id: string;
    funcionarioId: number;
    funcionarioNome: string;
    funcionarioMatricula: string;
    status: RecebimentoAlocacaoStatusApi;
    atribuidoEm: string;
  }>;
  empresas: string[];
  categorias: string[];
};

export type RecursosRecebimentoSessaoApiResponse = {
  sessaoId: string;
  unidadeId: string;
  funcionarios: RecursosSessaoFuncionarioApi[];
  demandas: DemandaRecebimentoRecursoApi[];
  kpis: RecursosSessaoKpiApi[];
};
