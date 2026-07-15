export const RECEBIMENTO_AVARIA_REPOSITORY = 'IRecebimentoAvariaRepository';

export type RecebimentoAvariaRecord = {
  id: string;
  recebimentoId: string;
  produtoId: string | null;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  validade: Date | null;
  numeroSerie: string | null;
  photoCount: number;
  replicado: boolean;
  operatorId: number;
  createdAt: Date;
};

export type CreateRecebimentoAvariaInput = {
  recebimentoId: string;
  produtoId?: string | null;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote?: string | null;
  validade?: Date | null;
  numeroSerie?: string | null;
  photoCount: number;
  replicado: boolean;
  clientDamageId?: string | null;
  operatorId: number;
};

export interface IRecebimentoAvariaRepository {
  createMany(
    items: CreateRecebimentoAvariaInput[],
  ): Promise<RecebimentoAvariaRecord[]>;
  listByRecebimento(recebimentoId: string): Promise<RecebimentoAvariaRecord[]>;
  deleteByRecebimento(
    recebimentoId: string,
  ): Promise<{ removedCount: number }>;
  deleteById(
    recebimentoId: string,
    avariaId: string,
  ): Promise<{ removed: boolean }>;
}
