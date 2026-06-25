import { Injectable, Inject } from '@nestjs/common';

import type {
  CriarLoteInput,
  IUploadLoteRepository,
  UploadLoteRecord,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';
import {
  createUploadLoteDb,
  listUploadLotesDb,
} from './create-upload-lote.drizzle.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../providers/drizzle/drizzle.provider.js';

@Injectable()
export class UploadLoteService implements IUploadLoteRepository {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  criar(input: CriarLoteInput): Promise<UploadLoteRecord> {
    return createUploadLoteDb(this.db, input);
  }

  listar(unidadeId: string): Promise<UploadLoteRecord[]> {
    return listUploadLotesDb(this.db, unidadeId);
  }
}
