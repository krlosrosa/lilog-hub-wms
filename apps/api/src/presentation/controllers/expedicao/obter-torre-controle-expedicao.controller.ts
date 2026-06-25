import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ObterTorreControleQueryDto,
  TorreControleSnapshotDto,
} from '../../../application/dtos/expedicao/torre-controle.dto.js';
import { ObterTorreControleExpedicaoUseCase } from '../../../application/usecases/expedicao/obter-torre-controle-expedicao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/torre-controle')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ObterTorreControleExpedicaoController {
  constructor(
    private readonly obterTorreControleExpedicaoUseCase: ObterTorreControleExpedicaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Obter snapshot da torre de controle de expedição',
    operationId: 'obterTorreControleExpedicao',
  })
  @ApiSuccessResponse(TorreControleSnapshotDto)
  handle(@Query() query: ObterTorreControleQueryDto) {
    return this.obterTorreControleExpedicaoUseCase.execute(query);
  }
}
