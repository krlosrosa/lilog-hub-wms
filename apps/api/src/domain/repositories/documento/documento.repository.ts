import type {
  ConfirmUploadInput,
  DocumentoStatus,
  GenerateUploadUrlInput,
} from '../../model/documento/documento.model.js';

export const DOCUMENTO_REPOSITORY = 'IDocumentoRepository';

export type DocumentoRecord = {
  id: string;
  nome: string;
  chave: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string | null;
  entidadeId: string | null;
  status: DocumentoStatus;
  uploadedBy: number | null;
  createdAt: Date;
};

export type ListDocumentosFilter = {
  page?: number;
  limit?: number;
  entidadeTipo?: string;
  entidadeId?: string;
  status?: DocumentoStatus;
};

export type ListDocumentosResult = {
  items: DocumentoRecord[];
  total: number;
  page: number;
  limit: number;
};

export type CreatePendingDocumentoInput = GenerateUploadUrlInput & {
  chave: string;
  uploadedBy: number | null;
};

export type ActivateDocumentoInput = ConfirmUploadInput & {
  uploadedBy: number | null;
};

export interface IDocumentoRepository {
  findById(id: string): Promise<DocumentoRecord | null>;
  findByChave(chave: string): Promise<DocumentoRecord | null>;
  list(filter: ListDocumentosFilter): Promise<ListDocumentosResult>;
  createPending(data: CreatePendingDocumentoInput): Promise<DocumentoRecord>;
  activate(
    chave: string,
    data: ActivateDocumentoInput,
  ): Promise<DocumentoRecord | null>;
  markDeleted(id: string): Promise<DocumentoRecord | null>;
}
