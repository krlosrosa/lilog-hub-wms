import type { TransportadoraStatus } from '@/features/transporte/types/transportadora.schema';

export type TransportadoraApi = {
  id: string;
  unidadeId: string;
  idRavexTransportadora: number;
  nome: string;
  cnpj: string;
  status: TransportadoraStatus;
  quantidadeVeiculos: number;
  createdAt: string;
  updatedAt: string;
};

export type ListTransportadorasApiResponse = {
  items: TransportadoraApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateTransportadoraPayload = {
  unidadeId: string;
  idRavexTransportadora: number;
  nome: string;
  cnpj: string;
  status?: TransportadoraStatus;
  quantidadeVeiculos?: number;
  sincronizarPlacas?: boolean;
};

export type UpdateTransportadoraPayload = Partial<{
  nome: string;
  cnpj: string;
  status: TransportadoraStatus;
  quantidadeVeiculos: number;
}>;

export type ImportarTransportadoraRavexPayload = {
  unidadeId: string;
  idRavexTransportadora: number;
};

export type TransportadoraRavexPreview = {
  idRavexTransportadora: number;
  nome: string;
  cnpj: string;
  quantidadeVeiculos: number;
  jaCadastrada: boolean;
  transportadoraExistenteId?: string | null;
};

export type ConfirmarCadastroRavexPayload = {
  idRavexTransportadora: number;
  nome: string;
  cnpj: string;
  status: TransportadoraStatus;
  quantidadeVeiculos: number;
  sincronizarPlacas: boolean;
};
