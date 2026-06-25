import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDocasQueryDto,
  ListDocasResponseDto,
} from '../../../application/dtos/doca/doca.dto.js';
import { ListDocasUseCase } from '../../../application/usecases/doca/list-docas.usecase.js';
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
export class ListDocasController {
  constructor(private readonly listDocasUseCase: ListDocasUseCase) {}

  @RequirePermissions(DOCA_PERMISSION.DOCA_VIEW)
  @Get()
  @ApiOperation({
    summary: 'List docas',
    operationId: 'listDocas',
  })
  @ApiSuccessResponse(ListDocasResponseDto)
  handle(@Query() query: ListDocasQueryDto) {
    return this.listDocasUseCase.execute(query);
  }
}
