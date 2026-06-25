import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import {
  assertR2Config,
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import { deleteR2Object } from '../../../infra/clients/r2/r2-presign.js';

export type DeleteDocumentoUseCaseInput = {
  id: string;
};

@Injectable()
export class DeleteDocumentoUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute({ id }: DeleteDocumentoUseCaseInput) {
    const r2 = assertR2Config(this.r2Config);
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (documento.status === 'deletado') {
      throw new BadRequestException('Documento já foi removido');
    }

    await deleteR2Object(
      r2.client,
      r2.bucketName,
      documento.chave,
    );

    const deleted = await this.documentoRepository.markDeleted(id);

    if (!deleted) {
      throw new NotFoundException('Falha ao remover documento');
    }

    return deleted;
  }
}
