import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListCncsQueryDto,
  ListCncsResponseDto,
} from '../../../application/dtos/cnc/list-cncs.dto.js';
import { ListCncsUseCase } from '../../../application/usecases/cnc/list-cncs.usecase.js';
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
export class ListCncsController {
  constructor(private readonly listCncsUseCase: ListCncsUseCase) {}

  @RequirePermissions(CNC_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar CNCs',
    operationId: 'listCncs',
  })
  @ApiSuccessResponse(ListCncsResponseDto)
  handle(@Query() query: ListCncsQueryDto) {
    return this.listCncsUseCase.execute(query);
  }
}
