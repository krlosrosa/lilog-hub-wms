export const TRANSPORTE_REPOSITORY = 'ITransporteRepository';

export type StatusTransportePreOperacional = 'pendente' | 'alocado' | 'parcial';

export type StatusTransporteOperacional =
  | StatusTransportePreOperacional
  | 'em_separacao'
  | 'separado'
  | 'em_conferencia'
  | 'conferido'
  | 'em_carregamento'
  | 'carregado'
  | 'em_viagem'
  | 'viagem_finalizada';

export type ResumoProcessoGrupos = {
  total: number;
  iniciados: number;
  finalizados: number;
};

export type ResumoGruposOperacionaisRecord = {
  separacao: ResumoProcessoGrupos;
  conferencia: ResumoProcessoGrupos;
  carregamento: ResumoProcessoGrupos;
};

export type SalvarAlocacaoTransporteInput = {
  transporteId: string;
  placaTransportadoraId: string;
  placa: string;
  transportadora: string;
  motorista?: string | null;
  perfilTarifaId?: string | null;
  perfilTarifaNome?: string | null;
  perfilPagamentoId?: string | null;
  perfilPagamentoNome?: string | null;
  semCusto?: boolean;
  itinerario?: string | null;
  nivelPrioridade?: NivelPrioridadeTransporte | null;
  horarioExpectativaSaida?: string | null;
  cidade?: string;
  bairro?: string | null;
  isPrioridade?: boolean;
};

export type SalvarAlocacoesTransportesInput = {
  unidadeId: string;
  alocacoes: SalvarAlocacaoTransporteInput[];
};

export type SalvarAlocacoesTransportesResult = {
  atualizados: number;
};

export type ExcluirTransporteResult = {
  id: string;
  rota: string;
};

export type NivelPrioridadeTransporte =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

export type AtualizarPrioridadeTransporteInput = {
  id: string;
  unidadeId: string;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporte | null;
};

export type AtualizarPrioridadeTransporteResult = {
  id: string;
  rota: string;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporte | null;
};

export type TransporteViagemRavexRecord = {
  id: string;
  unidadeId: string;
  rota: string;
  viagemId: number | null;
  viagemInicioEm: Date | null;
  viagemFimEm: Date | null;
  anomalia: string | null;
};

export type AtualizarViagemRavexInput = {
  transporteId: string;
  unidadeId: string;
  viagemId?: number | null;
  viagemInicioEm?: Date | null;
  viagemFimEm?: Date | null;
  anomalia?: string | null;
  status?: StatusTransporteOperacional;
};

export type AtualizarDadosCarregamentoTransporteInput = {
  transporteId: string;
  unidadeId: string;
  docaId?: string | null;
  lacreCarregamento?: string | null;
};

export type AtualizarDadosCarregamentoTransporteResult = {
  id: string;
  rota: string;
  docaId: string | null;
  lacreCarregamento: string | null;
};

export type TransporteConflitoRecord = {
  id: string;
  rota: string;
  status: string;
  ultimoMapaLoteId: string | null;
};

export interface ITransporteRepository {
  salvarAlocacoes(
    input: SalvarAlocacoesTransportesInput,
  ): Promise<SalvarAlocacoesTransportesResult>;
  excluir(id: string, unidadeId: string): Promise<ExcluirTransporteResult | null>;
  atualizarPrioridade(
    input: AtualizarPrioridadeTransporteInput,
  ): Promise<AtualizarPrioridadeTransporteResult | null>;
  findDuplicados(input: {
    unidadeId: string;
    dataTransporte: string;
    rotas: string[];
  }): Promise<TransporteConflitoRecord[]>;
  findComMapaExistente(input: {
    unidadeId: string;
    transporteIds: string[];
  }): Promise<TransporteConflitoRecord[]>;
  findResumoGruposOperacionais(
    transporteId: string,
  ): Promise<ResumoGruposOperacionaisRecord>;
  findStatusTransporte(
    transporteId: string,
    unidadeId: string,
  ): Promise<{ id: string; status: StatusTransporteOperacional } | null>;
  atualizarStatusOperacional(input: {
    transporteId: string;
    unidadeId: string;
    status: StatusTransporteOperacional;
  }): Promise<{ id: string; status: StatusTransporteOperacional } | null>;
  findViagemRavexContext(
    transporteId: string,
    unidadeId: string,
  ): Promise<TransporteViagemRavexRecord | null>;
  atualizarViagemRavex(input: AtualizarViagemRavexInput): Promise<void>;
  atualizarDadosCarregamento(
    input: AtualizarDadosCarregamentoTransporteInput,
  ): Promise<AtualizarDadosCarregamentoTransporteResult | null>;
}
