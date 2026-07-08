import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListGruposEnderecosQueryDto,
  ListGruposEnderecosResponseDto,
} from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { ListGruposEnderecosUseCase } from '../../../application/usecases/produto-endereco/list-grupos-enderecos.usecase.js';
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
export class ListGruposEnderecosController {
  constructor(
    private readonly listGruposEnderecosUseCase: ListGruposEnderecosUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('grupos')
  @ApiOperation({
    summary: 'List product groups with allocated addresses for a centro',
    operationId: 'listGruposEnderecos',
  })
  @ApiSuccessResponse(ListGruposEnderecosResponseDto)
  handle(@Query() query: ListGruposEnderecosQueryDto) {
    return this.listGruposEnderecosUseCase.execute(query.centroId);
  }
}
