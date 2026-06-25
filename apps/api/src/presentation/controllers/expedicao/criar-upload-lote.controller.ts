import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { UploadLoteResponseDto } from '../../../application/dtos/expedicao/upload-lote.dto.js';
import { CriarUploadLoteUseCase } from '../../../application/usecases/expedicao/criar-upload-lote.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

type MultipartField = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartFile = {
  type: 'file';
  fieldname: string;
  filename: string;
  file: AsyncIterable<Buffer>;
};

type MultipartPart = MultipartField | MultipartFile;

type MultipartRequest = FastifyRequest & {
  parts: () => AsyncIterableIterator<MultipartPart>;
};

@Controller('expedicao/upload-lotes')
@ApiTags('Expedicao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarUploadLoteController {
  constructor(private readonly criarUploadLoteUseCase: CriarUploadLoteUseCase) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'create', resource: 'expedicao-upload-lote' })
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de remessas via XLSX/CSV',
    operationId: 'criarUploadLote',
  })
  @ApiSuccessResponse(UploadLoteResponseDto, 'created')
  async handle(
    @Req() request: MultipartRequest & { user?: RequestUser },
  ) {
    let arquivo: Buffer | null = null;
    let nomeArquivo = '';
    let unidadeId = '';
    let dataReferencia = '';
    let horarioExpectativaSaida = '';

    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.fieldname !== 'arquivo') {
          continue;
        }

        nomeArquivo = part.filename;
        const chunks: Buffer[] = [];

        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        arquivo = Buffer.concat(chunks);
        continue;
      }

      const value = String(part.value ?? '');

      if (part.fieldname === 'unidadeId') {
        unidadeId = value;
      }

      if (part.fieldname === 'dataReferencia') {
        dataReferencia = value;
      }

      if (part.fieldname === 'horarioExpectativaSaida') {
        horarioExpectativaSaida = value;
      }
    }

    if (!arquivo) {
      throw new BadRequestException('Campo arquivo é obrigatório');
    }

    return this.criarUploadLoteUseCase.execute({
      unidadeId,
      dataReferencia,
      horarioExpectativaSaida,
      nomeArquivo,
      arquivo,
      criadoPor: getRequestUser(request)?.id ?? null,
    });
  }
}
