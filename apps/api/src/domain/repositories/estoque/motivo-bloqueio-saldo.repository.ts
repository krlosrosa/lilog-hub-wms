import type {
  CreateMotivoBloqueioSaldoInput,
  MotivoBloqueioSaldo,
  OrigemMotivoBloqueioSaldo,
  UpdateMotivoBloqueioSaldoInput,
} from '../../model/estoque/motivo-bloqueio-saldo.model.js';

export const MOTIVO_BLOQUEIO_SALDO_REPOSITORY =
  'IMotivoBloqueioSaldoRepository';

export type ListMotivosBloqueioSaldoFilter = {
  unidadeId: string;
  ativo?: boolean;
  origem?: OrigemMotivoBloqueioSaldo;
};

export interface IMotivoBloqueioSaldoRepository {
  create(input: CreateMotivoBloqueioSaldoInput): Promise<MotivoBloqueioSaldo>;
  list(filter: ListMotivosBloqueioSaldoFilter): Promise<MotivoBloqueioSaldo[]>;
  findById(id: string): Promise<MotivoBloqueioSaldo | null>;
  findByCodigo(
    unidadeId: string,
    codigo: string,
  ): Promise<MotivoBloqueioSaldo | null>;
  update(
    id: string,
    input: UpdateMotivoBloqueioSaldoInput,
  ): Promise<MotivoBloqueioSaldo | null>;
  delete(id: string): Promise<void>;
  ensureMotivosSistemaUnidade(unidadeId: string): Promise<MotivoBloqueioSaldo[]>;
}
