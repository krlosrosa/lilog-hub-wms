import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListPerfisTarifasQueryDto,
  ListPerfisTarifasResponseDto,
} from '../../../application/dtos/perfil-tarifa/perfil-tarifa.dto.js';
import { ListPerfisTarifasUseCase } from '../../../application/usecases/perfil-tarifa/list-perfis-tarifas.usecase.js';
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
export class ListPerfisTarifasController {
  constructor(
    private readonly listPerfisTarifasUseCase: ListPerfisTarifasUseCase,
  ) {}

  @RequirePermissions(PERFIL_TARIFA_PERMISSION.VIEW)
  @Get()
  @ApiOperation({
    summary: 'List perfis tarifas',
    operationId: 'listPerfisTarifas',
  })
  @ApiSuccessResponse(ListPerfisTarifasResponseDto)
  handle(@Query() query: ListPerfisTarifasQueryDto) {
    return this.listPerfisTarifasUseCase.execute(query);
  }
}
