import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  GerarMapasBodyDto,
  GerarMapasResponseDto,
} from '../../../application/dtos/expedicao/gerar-mapas.dto.js';
import { GerarMapasUseCase } from '../../../application/usecases/expedicao/gerar-mapas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GerarMapasController {
  constructor(private readonly gerarMapasUseCase: GerarMapasUseCase) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Post('gerar')
  @ApiOperation({
    summary: 'Gerar grupos de mapa',
    operationId: 'gerarMapas',
  })
  @ApiSuccessResponse(GerarMapasResponseDto)
  handle(@Body() body: GerarMapasBodyDto) {
    return this.gerarMapasUseCase.execute(body);
  }
}
