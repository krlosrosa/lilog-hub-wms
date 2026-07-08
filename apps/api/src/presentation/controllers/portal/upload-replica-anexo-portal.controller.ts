import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { UploadReplicaAnexoPortalResponseDto } from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { UploadReplicaAnexoPortalUseCase } from '../../../application/usecases/portal/upload-replica-anexo-portal.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

type MultipartField = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartFile = {
  type: 'file';
  fieldname: string;
  filename: string;
  mimetype: string;
  file: AsyncIterable<Buffer>;
};

type MultipartPart = MultipartField | MultipartFile;

type MultipartRequest = FastifyRequest & {
  parts: () => AsyncIterableIterator<MultipartPart>;
  user: { email: string; transportadoraId: string };
};

@ApiTags('Portal Cobranca')
@Controller('portal/cobranca')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UploadReplicaAnexoPortalController {
  constructor(
    private readonly uploadReplicaAnexoPortalUseCase: UploadReplicaAnexoPortalUseCase,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de anexo para réplica de débito',
    operationId: 'uploadReplicaAnexoPortal',
  })
  @ApiSuccessResponse(UploadReplicaAnexoPortalResponseDto, 'created')
  async handle(@Req() request: MultipartRequest) {
    let arquivo: Buffer | null = null;
    let nomeOriginal = '';
    let mimeType = 'application/octet-stream';
    let processoDebitoId = '';

    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname !== 'arquivo') {
          continue;
        }

        nomeOriginal = part.filename;
        mimeType = part.mimetype || mimeType;
        const chunks: Buffer[] = [];

        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        arquivo = Buffer.concat(chunks);
        continue;
      }

      const value = String(part.value ?? '');

      if (part.fieldname === 'processoDebitoId') {
        processoDebitoId = value;
      }
    }

    if (!arquivo) {
      throw new BadRequestException('Campo arquivo é obrigatório');
    }

    if (!processoDebitoId) {
      throw new BadRequestException('Campo processoDebitoId é obrigatório');
    }

    return this.uploadReplicaAnexoPortalUseCase.execute({
      processoDebitoId,
      transportadoraId: request.user.transportadoraId,
      nomeOriginal: nomeOriginal || 'anexo',
      mimeType,
      arquivo,
    });
  }
}
