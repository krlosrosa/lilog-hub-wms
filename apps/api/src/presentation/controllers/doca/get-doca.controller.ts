import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocaResponseDto } from '../../../application/dtos/doca/doca.dto.js';
import { GetDocaUseCase } from '../../../application/usecases/doca/get-doca.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetDocaController {
  constructor(private readonly getDocaUseCase: GetDocaUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_VIEW)
  @Get(':id')
  @ApiOperation({
    summary: 'Get doca by id',
    operationId: 'getDoca',
  })
  @ApiSuccessResponse(DocaResponseDto)
  handle(@Param('id') id: string) {
    return this.getDocaUseCase.execute(id);
  }
}
