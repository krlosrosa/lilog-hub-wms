import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  SalvarMapasBodyDto,
  SalvarMapasResponseDto,
} from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import { SalvarMapasUseCase } from '../../../application/usecases/expedicao/salvar-mapas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Expedicao')
@Controller('expedicao/mapas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SalvarMapasController {
  constructor(private readonly salvarMapasUseCase: SalvarMapasUseCase) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Post('salvar')
  @ApiOperation({
    summary: 'Salvar lote de mapas gerados',
    operationId: 'salvarMapas',
  })
  @ApiSuccessResponse(SalvarMapasResponseDto, 'created')
  handle(
    @Body() body: SalvarMapasBodyDto,
    @Req() request: FastifyRequest & { user?: RequestUser },
  ) {
    return this.salvarMapasUseCase.execute({
      ...body,
      criadoPor: getRequestUser(request)?.id ?? null,
    });
  }
}
