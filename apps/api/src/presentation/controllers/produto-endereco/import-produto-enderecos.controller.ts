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

import { ImportProdutoEnderecosResponseDto } from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { ImportProdutoEnderecosUseCase } from '../../../application/usecases/produto-endereco/import-produto-enderecos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

class ImportProdutoEnderecosBodyDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo XLSX com alocações produto x endereço',
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

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImportProdutoEnderecosController {
  constructor(
    private readonly importProdutoEnderecosUseCase: ImportProdutoEnderecosUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'produto-endereco-importacao' })
  @RequirePermissions(ADDRESS_PERMISSION.CREATE)
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importar alocações produto x endereço via XLSX',
    operationId: 'importProdutoEnderecos',
  })
  @ApiBody({ type: ImportProdutoEnderecosBodyDto })
  @ApiSuccessResponse(ImportProdutoEnderecosResponseDto)
  async handle(@Req() request: MultipartRequest) {
    let arquivo: Buffer | null = null;

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

    return this.importProdutoEnderecosUseCase.execute(arquivo);
  }
}
