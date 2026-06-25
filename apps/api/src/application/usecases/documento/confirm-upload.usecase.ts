import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfirmUploadInputSchema } from '../../../domain/model/documento/documento.model.js';
import type { ConfirmUploadInput } from '../../../domain/model/documento/documento.model.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import { headLocalObject } from '../../../infra/clients/r2/local-object-storage.js';
import {
  assertR2Config,
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import { headR2Object } from '../../../infra/clients/r2/r2-presign.js';

export type ConfirmUploadUseCaseInput = {
  data: ConfirmUploadInput;
  userId: number | null;
};

@Injectable()
export class ConfirmUploadUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute({ data, userId }: ConfirmUploadUseCaseInput) {
    if (!this.r2Config && process.env.NODE_ENV === 'production') {
      assertR2Config(this.r2Config);
    }

    const r2 = this.r2Config;
    const parsed = ConfirmUploadInputSchema.parse(data);

    const pending = await this.documentoRepository.findByChave(parsed.chave);

    if (!pending) {
      throw new NotFoundException('Documento pendente não encontrado');
    }

    if (pending.status === 'deletado') {
      throw new BadRequestException('Documento foi removido');
    }

    if (pending.status === 'ativo') {
      return pending;
    }

    let objectHead: { contentLength: number };

    try {
      if (r2) {
        objectHead = await headR2Object(
          r2.client,
          r2.bucketName,
          parsed.chave,
        );
      } else {
        objectHead = await headLocalObject(parsed.chave);
      }
    } catch {
      throw new NotFoundException(
        'Arquivo não encontrado no storage. Faça o upload antes de confirmar.',
      );
    }

    if (objectHead.contentLength <= 0) {
      throw new BadRequestException('Arquivo vazio no storage');
    }

    const activated = await this.documentoRepository.activate(parsed.chave, {
      ...parsed,
      tamanho: objectHead.contentLength,
      uploadedBy: userId,
    });

    if (!activated) {
      throw new NotFoundException('Falha ao confirmar upload do documento');
    }

    return activated;
  }
}
