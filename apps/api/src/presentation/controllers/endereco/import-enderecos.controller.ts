import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { ImportEnderecosResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { ImportEnderecosUseCase } from '../../../application/usecases/endereco/import-enderecos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

class ImportEnderecosBodyDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo XLSX com endereços para cadastro em massa',
  })
  file!: string;
}

type MultipartFile = {
  type: 'file';
  fieldname: string;
  filename: string;
  file: AsyncIterable<Buffer>;
};

type MultipartField = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartPart = MultipartFile | MultipartField;

type MultipartRequest = FastifyRequest & {
  parts: () => AsyncIterableIterator<MultipartPart>;
};

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImportEnderecosController {
  constructor(
    private readonly importEnderecosUseCase: ImportEnderecosUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'endereco-importacao' })
  @RequirePermissions(ADDRESS_PERMISSION.CREATE)
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importar endereços via XLSX',
    operationId: 'importEnderecos',
  })
  @ApiBody({ type: ImportEnderecosBodyDto })
  @ApiSuccessResponse(ImportEnderecosResponseDto)
  async handle(@Req() request: MultipartRequest) {
    let arquivo: Buffer | null = null;
    const unidadeIdHeader = request.headers['x-unidade-id'];
    const unidadeId = Array.isArray(unidadeIdHeader)
      ? unidadeIdHeader[0]
      : unidadeIdHeader;

    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'file') {
        const chunks: Buffer[] = [];

        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        arquivo = Buffer.concat(chunks);
      }
    }

    if (!arquivo) {
      throw new BadRequestException('Campo file é obrigatório');
    }

    if (!unidadeId?.trim()) {
      throw new BadRequestException(
        'Unidade não informada. Selecione uma unidade antes de importar.',
      );
    }

    return this.importEnderecosUseCase.execute(arquivo, unidadeId.trim());
  }
}
