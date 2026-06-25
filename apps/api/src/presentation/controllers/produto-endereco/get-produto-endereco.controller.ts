import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProdutoEnderecoResponseDto } from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { GetProdutoEnderecoUseCase } from '../../../application/usecases/produto-endereco/get-produto-endereco.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetProdutoEnderecoController {
  constructor(
    private readonly getProdutoEnderecoUseCase: GetProdutoEnderecoUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get(':id')
  @ApiOperation({
    summary: 'Get produto endereco allocation',
    operationId: 'getProdutoEndereco',
  })
  @ApiSuccessResponse(ProdutoEnderecoResponseDto)
  handle(@Param('id') id: string) {
    return this.getProdutoEnderecoUseCase.execute(id);
  }
}
