import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListTiposVeiculoRavexResponseDto } from '../../../application/dtos/perfil-tarifa/perfil-tarifa.dto.js';
import { ListTiposVeiculoRavexUseCase } from '../../../application/usecases/perfil-tarifa/list-tipos-veiculo-ravex.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { PERFIL_TARIFA_PERMISSION } from '../../../shared/constants/perfil-tarifa-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Perfil Tarifa')
@Controller('perfis-tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListTiposVeiculoRavexController {
  constructor(
    private readonly listTiposVeiculoRavexUseCase: ListTiposVeiculoRavexUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.VIEW)
  @Get('ravex/tipos-veiculo')
  @ApiOperation({
    summary: 'List vehicle types from Ravex',
    operationId: 'listTiposVeiculoRavex',
  })
  @ApiSuccessResponse(ListTiposVeiculoRavexResponseDto)
  handle() {
    return this.listTiposVeiculoRavexUseCase.execute();
  }
}
