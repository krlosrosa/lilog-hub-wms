import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListCncItensQueryDto,
  ListCncItensResponseDto,
} from '../../../application/dtos/cnc/list-cnc-itens.dto.js';
import { ListCncItensUseCase } from '../../../application/usecases/cnc/list-cnc-itens.usecase.js';
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
export class ListCncItensController {
  constructor(private readonly listCncItensUseCase: ListCncItensUseCase) {}

  @RequirePermissions(CNC_PERMISSION.VISUALIZAR)
  @Get('itens')
  @ApiOperation({
    summary: 'Listar itens de CNCs',
    operationId: 'listCncItens',
  })
  @ApiSuccessResponse(ListCncItensResponseDto)
  handle(@Query() query: ListCncItensQueryDto) {
    return this.listCncItensUseCase.execute(query);
  }
}
