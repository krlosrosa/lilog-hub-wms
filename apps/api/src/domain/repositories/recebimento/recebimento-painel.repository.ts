import type { PreRecebimentoSituacao } from '../../model/recebimento/recebimento.model.js';

export const RECEBIMENTO_PAINEL_REPOSITORY = 'IRecebimentoPainelRepository';

export type RecebimentoPainelFiltro = {
  unidadeId: string;
  dataInicio: Date;
  dataFim: Date;
};

export type RecebimentoPainelPreRecebimentoRow = {
  id: string;
  placa: string | null;
  transportadoraNome: string | null;
  horarioPrevisto: Date;
  situacao: PreRecebimentoSituacao;
  grauPrioridade: string | null;
  recebimentoId: string | null;
  recebimentoDataInicio: Date | null;
  recebimentoDataFim: Date | null;
  docaCodigo: string | null;
  conferenteNome: string | null;
  skuCount: number;
  volumeUn: number;
  empresas: string[];
};

export type RecebimentoPainelDocaRow = {
  id: string;
  codigo: string;
  situacao: string;
  capacidadeVeiculos: number | null;
  observacao: string | null;
  placaOcupando: string | null;
  ocupacaoInicio: Date | null;
  grauPrioridade: string | null;
};

export type RecebimentoPainelAnomaliaRow = {
  id: string;
  subtipoOcorrencia: string | null;
  origem: string | null;
  placa: string | null;
  recebimentoId: string;
  preRecebimentoId: string;
  createdAt: Date;
};

export type RecebimentoPainelCentroRow = {
  centro: string;
  nome: string;
};

export type RecebimentoPainelFinalizadoHoraRow = {
  hora: number;
  finalizados: number;
  volumeUn: number;
};

export type RecebimentoPainelEmpresaRow = {
  preRecebimentoId: string;
  empresa: string;
  pesoKg: number;
  situacao: PreRecebimentoSituacao;
};

export type RecebimentoPainelProdutividadeOperadorRow = {
  funcionarioId: number;
  nome: string;
  cargo: string;
  carros: number;
  tempoMedioMinutos: number | null;
  volumeUn: number;
};

export type RecebimentoPainelReadModel = {
  preRecebimentos: RecebimentoPainelPreRecebimentoRow[];
  empresaRecebimentos: RecebimentoPainelEmpresaRow[];
  docas: RecebimentoPainelDocaRow[];
  anomalias: RecebimentoPainelAnomaliaRow[];
  centros: RecebimentoPainelCentroRow[];
  divergenciasCount: number;
  cncGeradasCount: number;
  finalizadosPorHora: RecebimentoPainelFinalizadoHoraRow[];
  produtividadeOperadores: RecebimentoPainelProdutividadeOperadorRow[];
};

export interface IRecebimentoPainelRepository {
  obterReadModel(filtro: RecebimentoPainelFiltro): Promise<RecebimentoPainelReadModel>;
}
