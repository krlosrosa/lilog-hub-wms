import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoEnderecoResponseDto } from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { CreateProdutoEnderecoUseCase } from '../../../application/usecases/produto-endereco/create-produto-endereco.usecase.js';
import { ProdutoEnderecoPapelSchema } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateProdutoEnderecoBodySchema = z.object({
  centroId: z.uuid(),
  produtoId: z.uuid(),
  enderecoId: z.uuid(),
  papel: ProdutoEnderecoPapelSchema,
  ordem: z.number().int().min(1).max(32767).default(1),
  ativo: z.boolean().default(true),
});

class CreateProdutoEnderecoBodyDto extends createZodDto(
  CreateProdutoEnderecoBodySchema,
) {}

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateProdutoEnderecoController {
  constructor(
    private readonly createProdutoEnderecoUseCase: CreateProdutoEnderecoUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.CREATE)
  @Auditable({ action: 'create', resource: 'produto_endereco' })
  @Post()
  @ApiOperation({
    summary: 'Create produto endereco allocation',
    operationId: 'createProdutoEndereco',
  })
  @ApiSuccessResponse(ProdutoEnderecoResponseDto, 'created')
  handle(@Body() body: CreateProdutoEnderecoBodyDto) {
    return this.createProdutoEnderecoUseCase.execute({ data: body });
  }
}
