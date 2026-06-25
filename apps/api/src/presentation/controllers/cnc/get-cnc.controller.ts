import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CncResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { GetCncUseCase } from '../../../application/usecases/cnc/get-cnc.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetCncController {
  constructor(private readonly getCncUseCase: GetCncUseCase) {}

  @RequirePermissions(CNC_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Consultar CNC por ID',
    operationId: 'getCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(@Param('id') id: string) {
    return this.getCncUseCase.execute(id);
  }
}
