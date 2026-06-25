import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListTransportadorasQueryDto,
  ListTransportadorasResponseDto,
} from '../../../application/dtos/transportadora/transportadora.dto.js';
import { ListTransportadorasUseCase } from '../../../application/usecases/transportadora/list-transportadoras.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListTransportadorasController {
  constructor(
    private readonly listTransportadorasUseCase: ListTransportadorasUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.VIEW)
  @Get()
  @ApiOperation({
    summary: 'List transportadoras',
    operationId: 'listTransportadoras',
  })
  @ApiSuccessResponse(ListTransportadorasResponseDto)
  handle(@Query() query: ListTransportadorasQueryDto) {
    return this.listTransportadorasUseCase.execute(query);
  }
}
