import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { UploadInteracaoAnexoCdResponseDto } from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { UploadInteracaoAnexoCdUseCase } from '../../../application/usecases/cobranca-transportadora/upload-interacao-anexo-cd.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import { getRequestUser, type RequestUser } from '../../../shared/utils/request-user.js';

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
  user?: RequestUser;
};

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UploadInteracaoAnexoCdController {
  constructor(
    private readonly uploadInteracaoAnexoCdUseCase: UploadInteracaoAnexoCdUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Post('upload-interacao')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de anexo para interação do CD',
    operationId: 'uploadInteracaoAnexoCd',
  })
  @ApiSuccessResponse(UploadInteracaoAnexoCdResponseDto, 'created')
  async handle(@Req() request: MultipartRequest) {
    let arquivo: Buffer | null = null;
    let nomeOriginal = '';
    let mimeType = 'application/octet-stream';
    let processoDebitoId = '';
    let unidadeId = '';

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

      if (part.fieldname === 'unidadeId') {
        unidadeId = value;
      }
    }

    if (!arquivo) {
      throw new BadRequestException('Campo arquivo é obrigatório');
    }

    if (!processoDebitoId) {
      throw new BadRequestException('Campo processoDebitoId é obrigatório');
    }

    if (!unidadeId) {
      throw new BadRequestException('Campo unidadeId é obrigatório');
    }

    return this.uploadInteracaoAnexoCdUseCase.execute({
      processoDebitoId,
      unidadeId,
      nomeOriginal: nomeOriginal || 'anexo',
      mimeType,
      arquivo,
      uploadedBy: getRequestUser(request)?.id ?? null,
    });
  }
}
