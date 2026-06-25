import type { ClusterValue } from '@/features/filiais/types/filial.schema';
import type { EmpresaCodigo } from '@/features/filiais/types/centro-cadastro.schema';

export type CentroApi = {
  id: string;
  unidadeId: string;
  centro: string;
  empresa: EmpresaCodigo;
  nome: string;
  createdAt: string;
};

export type UnidadeApi = {
  id: string;
  nome: string;
  cluster: ClusterValue;
  nomeFilial: string;
  createdAt: string;
  updatedAt: string;
  centros: CentroApi[];
};

export type ListUnidadesApiResponse = {
  items: UnidadeApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateUnidadePayload = {
  id: string;
  nome: string;
  cluster: ClusterValue;
  nomeFilial: string;
  centros: Array<{
    centro: string;
    empresa: EmpresaCodigo;
    nome: string;
  }>;
};

export type UpdateUnidadePayload = Partial<
  Omit<CreateUnidadePayload, 'id' | 'centros'>
>;

export type CreateCentroPayload = {
  centro: string;
  empresa: EmpresaCodigo;
  nome: string;
};

export type UpdateCentroPayload = Partial<CreateCentroPayload>;
