export const UPLOAD_LOTE_REPOSITORY = 'IUploadLoteRepository';

export type RemessaItemInput = {
  sku: string;
  produtoId: string | null;
  lote: string | null;
  dataFabricacao: string | null;
  faixa: string | null;
  peso: number | null;
  quantidade: number;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
};

export type RemessaInput = {
  numeroTransporte: string;
  remessa: string;
  empresa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  peso: number;
  volume: number;
  itens: RemessaItemInput[];
};

export type CriarLoteInput = {
  unidadeId: string;
  dataReferencia: string;
  horarioExpectativaSaida: Date;
  nomeArquivo: string;
  remessas: RemessaInput[];
  criadoPor: number | null;
};

export type AtualizarItinerarioRemessaInput = {
  remessa: string;
  itinerario: string;
};

export type AtualizarItinerarioInput = {
  uploadLoteId: string;
  itinerarios: AtualizarItinerarioRemessaInput[];
};

export type AtualizarItinerarioRecord = {
  atualizados: number;
  naoEncontrados: number;
};

export type UploadLoteRecord = {
  id: string;
  unidadeId: string;
  dataReferencia: string;
  horarioExpectativaSaida: Date;
  nomeArquivo: string | null;
  totalRemessas: number;
  totalTransportes: number;
  criadoPor: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface IUploadLoteRepository {
  criar(input: CriarLoteInput): Promise<UploadLoteRecord>;
  listar(unidadeId: string): Promise<UploadLoteRecord[]>;
  atualizarItinerarios(
    input: AtualizarItinerarioInput,
  ): Promise<AtualizarItinerarioRecord>;
}
