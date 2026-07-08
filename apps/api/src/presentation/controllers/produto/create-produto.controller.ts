import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoResponseDto } from '../../../application/dtos/produto/produto.dto.js';
import { CreateProdutoUseCase } from '../../../application/usecases/produto/create-produto.usecase.js';
import {
  CategoriaProdutoSchema,
  EmpresaProdutoSchema,
  TipoProdutoSchema,
} from '../../../domain/model/produto/produto.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateProdutoBodySchema = z.object({
  produtoId: z.string().min(1).max(50),
  sku: z.string().min(1).max(50),
  descricao: z.string().min(1),
  empresa: EmpresaProdutoSchema,
  categoria: CategoriaProdutoSchema,
  grupo: z.string().optional().nullable(),
  tipo: TipoProdutoSchema,
  ean: z.string().optional(),
  dum: z.string().optional(),
  shelfLife: z.number().int().positive().optional().nullable(),
  pesoBrutoUnidade: z.string().optional().nullable(),
  pesoBrutoCaixa: z.string().optional().nullable(),
  pesoBrutoPalete: z.string().optional().nullable(),
  unidadesPorCaixa: z.number().int().positive().optional().nullable(),
  caixasPorPalete: z.number().int().positive().optional().nullable(),
});

class CreateProdutoBodyDto extends createZodDto(CreateProdutoBodySchema) {}

@ApiTags('Produto')
@Controller('produtos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateProdutoController {
  constructor(private readonly createProdutoUseCase: CreateProdutoUseCase) {}

  @Auditable({ action: 'create', resource: 'produto' })
  @Post()
  @ApiOperation({
    summary: 'Create produto',
    operationId: 'createProduto',
  })
  @ApiSuccessResponse(ProdutoResponseDto, 'created')
  handle(@Body() body: CreateProdutoBodyDto) {
    return this.createProdutoUseCase.execute(body);
  }
}
