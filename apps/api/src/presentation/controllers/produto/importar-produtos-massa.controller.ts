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

import { ImportarProdutosMassaUseCase } from '../../../application/usecases/produto/importar-produtos-massa.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

class ErroImportacaoProdutoDto {
  @ApiProperty({ example: 3 })
  linha!: number;

  @ApiProperty({ example: '540300492' })
  sku!: string;

  @ApiProperty({ example: 'Empresa' })
  campo!: string;

  @ApiProperty({ example: 'Valor "XYZ" inválido — use LDB, ITB ou DPA' })
  mensagem!: string;
}

class ImportarProdutosMassaResponseDto {
  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 95 })
  importados!: number;

  @ApiProperty({ example: 3 })
  duplicados!: number;

  @ApiProperty({ type: () => [ErroImportacaoProdutoDto] })
  erros!: ErroImportacaoProdutoDto[];
}

class ImportarProdutosMassaBodyDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Arquivo XLSX com produtos' })
  arquivo!: string;
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

@ApiTags('Produto')
@Controller('produtos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImportarProdutosMassaController {
  constructor(
    private readonly importarProdutosMassaUseCase: ImportarProdutosMassaUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'produto-importacao-massa' })
  @Post('importar-massa')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Importação em massa de produtos via XLSX',
    operationId: 'importarProdutosMassa',
  })
  @ApiBody({ type: ImportarProdutosMassaBodyDto })
  @ApiSuccessResponse(ImportarProdutosMassaResponseDto, 'created')
  async handle(@Req() request: MultipartRequest) {
    let arquivo: Buffer | null = null;

    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'arquivo') {
        const chunks: Buffer[] = [];

        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        arquivo = Buffer.concat(chunks);
      }
    }

    if (!arquivo) {
      throw new BadRequestException('Campo arquivo é obrigatório');
    }

    return this.importarProdutosMassaUseCase.execute(arquivo);
  }
}
