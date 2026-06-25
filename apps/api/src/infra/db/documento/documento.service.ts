import { Inject, Injectable } from '@nestjs/common';

import type {
  ActivateDocumentoInput,
  CreatePendingDocumentoInput,
  IDocumentoRepository,
  ListDocumentosFilter,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';
import { createPendingDocumentoDb } from './create-documento.drizzle.js';
import {
  findDocumentoByChaveDb,
  findDocumentoByIdDb,
} from './find-documento.drizzle.js';
import { listDocumentosDb } from './list-documentos.drizzle.js';
import {
  activateDocumentoDb,
  markDocumentoDeletedDb,
} from './update-documento-status.drizzle.js';

@Injectable()
export class DocumentoService implements IDocumentoRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  findById(id: string) {
    return findDocumentoByIdDb(this.db, id);
  }

  findByChave(chave: string) {
    return findDocumentoByChaveDb(this.db, chave);
  }

  list(filter: ListDocumentosFilter) {
    return listDocumentosDb(this.db, filter);
  }

  createPending(data: CreatePendingDocumentoInput) {
    return createPendingDocumentoDb(this.db, data);
  }

  activate(chave: string, data: ActivateDocumentoInput) {
    return activateDocumentoDb(this.db, chave, data);
  }

  markDeleted(id: string) {
    return markDocumentoDeletedDb(this.db, id);
  }
}
