import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ArmazemLayoutOcupacaoResponseDto,
  GetArmazemLayoutQueryDto,
} from '../../../application/dtos/armazem-layout/armazem-layout.dto.js';
import { GetArmazemLayoutOcupacaoUseCase } from '../../../application/usecases/armazem-layout/get-armazem-layout-ocupacao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('ArmazemLayout')
@Controller('armazem-layout/ocupacao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetArmazemLayoutOcupacaoController {
  constructor(
    private readonly getArmazemLayoutOcupacaoUseCase: GetArmazemLayoutOcupacaoUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW, ADDRESS_PERMISSION.CAPACITY_VIEW)
  @Get()
  @ApiOperation({
    summary: 'Get warehouse layout occupancy by unit',
    operationId: 'getArmazemLayoutOcupacao',
  })
  @ApiSuccessResponse(ArmazemLayoutOcupacaoResponseDto)
  handle(@Query() query: GetArmazemLayoutQueryDto) {
    return this.getArmazemLayoutOcupacaoUseCase.execute(query.unidadeId);
  }
}
