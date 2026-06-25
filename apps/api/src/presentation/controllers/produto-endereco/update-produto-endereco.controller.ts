import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ProdutoEnderecoResponseDto } from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { UpdateProdutoEnderecoUseCase } from '../../../application/usecases/produto-endereco/update-produto-endereco.usecase.js';
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

const UpdateProdutoEnderecoBodySchema = z.object({
  enderecoId: z.uuid().optional(),
  papel: ProdutoEnderecoPapelSchema.optional(),
  ordem: z.number().int().min(1).max(32767).optional(),
  ativo: z.boolean().optional(),
});

class UpdateProdutoEnderecoBodyDto extends createZodDto(
  UpdateProdutoEnderecoBodySchema,
) {}

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateProdutoEnderecoController {
  constructor(
    private readonly updateProdutoEnderecoUseCase: UpdateProdutoEnderecoUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'produto_endereco' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update produto endereco allocation',
    operationId: 'updateProdutoEndereco',
  })
  @ApiSuccessResponse(ProdutoEnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateProdutoEnderecoBodyDto,
  ) {
    return this.updateProdutoEnderecoUseCase.execute({ id, data: body });
  }
}
