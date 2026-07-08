import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListSlottingProdutoEnderecosQueryDto,
  ListSlottingProdutoEnderecosResponseDto,
} from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { ListSlottingProdutoEnderecosUseCase } from '../../../application/usecases/produto-endereco/list-slotting-produto-enderecos.usecase.js';
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
export class ListSlottingProdutoEnderecosController {
  constructor(
    private readonly listSlottingProdutoEnderecosUseCase: ListSlottingProdutoEnderecosUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('slotting')
  @ApiOperation({
    summary: 'List slotting rows (endereco + primary allocation)',
    operationId: 'listSlottingProdutoEnderecos',
  })
  @ApiSuccessResponse(ListSlottingProdutoEnderecosResponseDto)
  handle(@Query() query: ListSlottingProdutoEnderecosQueryDto) {
    return this.listSlottingProdutoEnderecosUseCase.execute(query);
  }
}
