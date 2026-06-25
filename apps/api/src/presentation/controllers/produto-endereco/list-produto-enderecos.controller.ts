import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListProdutoEnderecosQueryDto,
  ListProdutoEnderecosResponseDto,
} from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { ListProdutoEnderecosUseCase } from '../../../application/usecases/produto-endereco/list-produto-enderecos.usecase.js';
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
export class ListProdutoEnderecosController {
  constructor(
    private readonly listProdutoEnderecosUseCase: ListProdutoEnderecosUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get()
  @ApiOperation({
    summary: 'List produto endereco allocations',
    operationId: 'listProdutoEnderecos',
  })
  @ApiSuccessResponse(ListProdutoEnderecosResponseDto)
  handle(@Query() query: ListProdutoEnderecosQueryDto) {
    return this.listProdutoEnderecosUseCase.execute(query);
  }
}
