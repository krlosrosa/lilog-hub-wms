import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Inject,
  InternalServerErrorException,
  Logger,
  Optional,
  Put,
  Query,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  DOCUMENTO_REPOSITORY,
  type IDocumentoRepository,
} from '../../../domain/repositories/documento/documento.repository.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import {
  isLocalStorageEnabled,
  putLocalObject,
} from '../../../infra/clients/r2/local-object-storage.js';
import {
  R2_PROVIDER,
  type R2Config,
} from '../../../infra/clients/r2/r2.provider.js';
import { putR2Object } from '../../../infra/clients/r2/r2-presign.js';

async function readRequestBody(request: FastifyRequest): Promise<Buffer> {
  const body = request.body;

  if (Buffer.isBuffer(body)) {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request.raw) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

@ApiTags('Documento')
@Controller('documentos')
@ApiErrorResponses()
export class PutDocumentUploadController {
  private readonly logger = new Logger(PutDocumentUploadController.name);

  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly documentoRepository: IDocumentoRepository,
    @Optional()
    @Inject(R2_PROVIDER)
    private readonly r2Config: R2Config | null,
  ) {}

  @Put('upload')
  @ApiOperation({
    summary:
      'Upload de documento via proxy da API (autenticado pela chave pending)',
    operationId: 'putDocumentoUpload',
  })
  async handle(
    @Query('chave') chave: string,
    @Req() request: FastifyRequest,
  ) {
    if (!chave?.trim()) {
      throw new BadRequestException('Parâmetro chave é obrigatório');
    }

    const decodedChave = decodeURIComponent(chave);
    const documento = await this.documentoRepository.findByChave(decodedChave);

    if (!documento || documento.status !== 'pending') {
      throw new ForbiddenException('Chave de upload inválida ou expirada');
    }

    const buffer = await readRequestBody(request);

    if (buffer.length === 0) {
      throw new BadRequestException('Corpo do upload vazio');
    }

    const mimeType =
      typeof request.headers['content-type'] === 'string'
        ? request.headers['content-type']
        : 'application/octet-stream';

    if (this.r2Config) {
      try {
        await putR2Object(
          this.r2Config.client,
          this.r2Config.bucketName,
          decodedChave,
          buffer,
          mimeType,
        );
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'Code' in error
            ? String((error as { Code?: string }).Code)
            : undefined;

        this.logger.error(
          `Falha ao enviar arquivo para R2 (bucket=${this.r2Config.bucketName}, chave=${decodedChave}, code=${code ?? 'unknown'})`,
          error instanceof Error ? error.stack : undefined,
        );

        if (code === 'Unauthorized' || code === 'InvalidAccessKeyId') {
          throw new ServiceUnavailableException(
            'Credenciais R2 inválidas ou sem permissão de escrita. Recrie o token em Cloudflare R2 > Manage R2 API Tokens com permissão "Object Read & Write" no bucket correto.',
          );
        }

        throw new InternalServerErrorException(
          'Falha ao enviar arquivo para o armazenamento',
        );
      }

      return { ok: true };
    }

    if (!isLocalStorageEnabled()) {
      throw new ServiceUnavailableException(
        'Armazenamento não configurado para upload',
      );
    }

    await putLocalObject(decodedChave, buffer);
    return { ok: true };
  }

  /** @deprecated Use PUT /documentos/upload */
  @Put('local-upload')
  @ApiOperation({
    summary: 'Upload local de documento (alias legado)',
    operationId: 'putLocalDocumento',
  })
  async handleLegacy(
    @Query('chave') chave: string,
    @Req() request: FastifyRequest,
  ) {
    return this.handle(chave, request);
  }
}
