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
import { generateGetPresignedUrl } from '../../../infra/clients/r2/r2-presign.js';

const DOWNLOAD_URL_EXPIRES_IN_SECONDS = 60 * 60;

export type GetDownloadUrlUseCaseInput = {
  id: string;
};

@Injectable()
export class GetDownloadUrlUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  async execute({ id }: GetDownloadUrlUseCaseInput) {
    const r2 = assertR2Config(this.r2Config);
    const documento = await this.documentoRepository.findById(id);

    if (!documento) {
      throw new NotFoundException('Documento não encontrado');
    }

    if (documento.status !== 'ativo') {
      throw new BadRequestException(
        'Documento não está disponível para download',
      );
    }

    const downloadUrl = await generateGetPresignedUrl(
      r2.client,
      r2.bucketName,
      documento.chave,
      DOWNLOAD_URL_EXPIRES_IN_SECONDS,
    );

    return {
      downloadUrl,
      expiresIn: DOWNLOAD_URL_EXPIRES_IN_SECONDS,
    };
  }
}
