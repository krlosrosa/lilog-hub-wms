import {
  ConflictException,
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  buildDocumentoChave,
  GenerateUploadUrlInputSchema,
  type GenerateUploadUrlInput,
} from '../../../domain/model/documento/documento.model.js';
import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import { isLocalStorageEnabled } from '../../../infra/clients/r2/local-object-storage.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';

const UPLOAD_URL_EXPIRES_IN_SECONDS = 15 * 60;

function buildProxyUploadUrl(
  configService: ConfigService,
  chave: string,
): string {
  const port = configService.get<number>('PORT', 3001);
  const publicBase =
    configService.get<string>('API_PUBLIC_URL') ??
    `http://localhost:${port}`;

  return `${publicBase.replace(/\/$/, '')}/api/documentos/upload?chave=${encodeURIComponent(chave)}`;
}

export type GenerateUploadUrlUseCaseInput = {
  data: GenerateUploadUrlInput;
  userId: number | null;
};

@Injectable()
export class GenerateUploadUrlUseCase {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Optional()
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
    private readonly configService: ConfigService,
  ) {}

  async execute({ data, userId }: GenerateUploadUrlUseCaseInput) {
    const parsed = GenerateUploadUrlInputSchema.parse(data);
    const chave = buildDocumentoChave(parsed.nome);

    const existing = await this.documentoRepository.findByChave(chave);

    if (existing) {
      throw new ConflictException('Chave de documento já existe');
    }

    await this.documentoRepository.createPending({
      ...parsed,
      chave,
      uploadedBy: userId,
    });

    if (!this.r2Config && !isLocalStorageEnabled()) {
      throw new ServiceUnavailableException(
        'Armazenamento R2 não configurado. Defina R2_ACCOUNT_ID, R2_BUCKET_NAME e R2_API_TOKEN.',
      );
    }

    return {
      uploadUrl: buildProxyUploadUrl(this.configService, chave),
      chave,
      expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
    };
  }
}
