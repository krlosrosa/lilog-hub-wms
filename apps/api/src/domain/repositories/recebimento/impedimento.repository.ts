import type { TipoImpedimento } from '../../model/recebimento/recebimento.model.js';

export const IMPEDIMENTO_REPOSITORY = 'IImpedimentoRepository';

export type CreateImpedimentoInput = {
  preRecebimentoId: string;
  tipo: TipoImpedimento;
  descricao: string;
  photoCount: number;
  registradoPorId?: number | null;
};

export type ImpedimentoRecord = {
  id: string;
  preRecebimentoId: string;
  tipo: string;
  descricao: string;
  photoCount: number;
  registradoPorId: number | null;
  registradoEm: Date;
  createdAt: Date;
};

export interface IImpedimentoRepository {
  create(data: CreateImpedimentoInput): Promise<ImpedimentoRecord>;
  findByPreRecebimentoId(
    preRecebimentoId: string,
  ): Promise<ImpedimentoRecord | null>;
}
