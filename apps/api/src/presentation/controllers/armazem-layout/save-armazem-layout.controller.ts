import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ArmazemLayoutResponseDto,
  SaveArmazemLayoutBodyDto,
} from '../../../application/dtos/armazem-layout/armazem-layout.dto.js';
import { SaveArmazemLayoutUseCase } from '../../../application/usecases/armazem-layout/save-armazem-layout.usecase.js';
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
export class SaveArmazemLayoutController {
  constructor(
    private readonly saveArmazemLayoutUseCase: SaveArmazemLayoutUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Put()
  @ApiOperation({
    summary: 'Save warehouse layout for unit',
    operationId: 'saveArmazemLayout',
  })
  @ApiSuccessResponse(ArmazemLayoutResponseDto)
  handle(@Body() body: SaveArmazemLayoutBodyDto) {
    return this.saveArmazemLayoutUseCase.execute(body);
  }
}
