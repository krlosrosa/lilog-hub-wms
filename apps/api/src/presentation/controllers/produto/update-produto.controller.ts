import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoResponseDto } from '../../../application/dtos/produto/produto.dto.js';
import { UpdateProdutoUseCase } from '../../../application/usecases/produto/update-produto.usecase.js';
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

const UpdateProdutoBodySchema = z.object({
  produtoId: z.string().min(1).max(50).optional(),
  sku: z.string().min(1).max(50).optional(),
  descricao: z.string().min(1).optional(),
  empresa: EmpresaProdutoSchema.optional(),
  categoria: CategoriaProdutoSchema.optional(),
  tipo: TipoProdutoSchema.optional(),
  ean: z.string().optional().nullable(),
  dum: z.string().optional().nullable(),
  shelfLife: z.number().int().positive().optional().nullable(),
  pesoBrutoUnidade: z.string().optional().nullable(),
  pesoBrutoCaixa: z.string().optional().nullable(),
  pesoBrutoPalete: z.string().optional().nullable(),
  unidadesPorCaixa: z.number().int().positive().optional().nullable(),
  caixasPorPalete: z.number().int().positive().optional().nullable(),
});

class UpdateProdutoBodyDto extends createZodDto(UpdateProdutoBodySchema) {}

@ApiTags('Produto')
@Controller('produtos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateProdutoController {
  constructor(private readonly updateProdutoUseCase: UpdateProdutoUseCase) {}

  @Auditable({ action: 'update', resource: 'produto' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update produto',
    operationId: 'updateProduto',
  })
  @ApiSuccessResponse(ProdutoResponseDto)
  handle(@Param('id') id: string, @Body() body: UpdateProdutoBodyDto) {
    return this.updateProdutoUseCase.execute(id, body);
  }
}
