import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ArmazemLayoutResponseDto,
  GetArmazemLayoutQueryDto,
} from '../../../application/dtos/armazem-layout/armazem-layout.dto.js';
import { GetArmazemLayoutUseCase } from '../../../application/usecases/armazem-layout/get-armazem-layout.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('ArmazemLayout')
@Controller('armazem-layout')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetArmazemLayoutController {
  constructor(private readonly getArmazemLayoutUseCase: GetArmazemLayoutUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get()
  @ApiOperation({
    summary: 'Get warehouse layout by unit',
    operationId: 'getArmazemLayout',
  })
  @ApiSuccessResponse(ArmazemLayoutResponseDto)
  handle(@Query() query: GetArmazemLayoutQueryDto) {
    return this.getArmazemLayoutUseCase.execute(query.unidadeId);
  }
}
