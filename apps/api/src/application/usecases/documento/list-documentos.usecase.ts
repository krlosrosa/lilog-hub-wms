import { Inject, Injectable } from '@nestjs/common';

import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
  type ListDocumentosFilter,
} from '../../../domain/repositories/documento/documento.repository.js';

@Injectable()
export class ListDocumentosUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
  ) {}

  execute(filter: ListDocumentosFilter) {
    return this.documentoRepository.list(filter);
  }
}
