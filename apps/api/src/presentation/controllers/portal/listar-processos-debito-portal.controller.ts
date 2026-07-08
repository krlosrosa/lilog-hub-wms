import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  ListarProcessosDebitoPortalQueryDto,
  ListarProcessosDebitoPortalResponseDto,
} from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { ListarProcessosDebitoPortalUseCase } from '../../../application/usecases/portal/listar-processos-debito-portal.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

@ApiTags('Portal Cobranca')
@Controller('portal/cobranca/processos')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarProcessosDebitoPortalController {
  constructor(
    private readonly listarProcessosDebitoPortalUseCase: ListarProcessosDebitoPortalUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar processos de débito da transportadora autenticada',
    operationId: 'listarProcessosDebitoPortal',
  })
  @ApiSuccessResponse(ListarProcessosDebitoPortalResponseDto)
  handle(
    @Query() query: ListarProcessosDebitoPortalQueryDto,
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.listarProcessosDebitoPortalUseCase.execute({
      transportadoraId: req.user.transportadoraId,
      unidadeId: query.unidadeId,
      status: query.status,
    });
  }
}
