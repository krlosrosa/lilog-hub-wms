import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { BuscarProcessoDebitoPortalResponseDto } from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { BuscarProcessoDebitoPortalUseCase } from '../../../application/usecases/portal/buscar-processo-debito-portal.usecase.js';
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
export class BuscarProcessoDebitoPortalController {
  constructor(
    private readonly buscarProcessoDebitoPortalUseCase: BuscarProcessoDebitoPortalUseCase,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhe de processo de débito no portal',
    operationId: 'buscarProcessoDebitoPortal',
  })
  @ApiSuccessResponse(BuscarProcessoDebitoPortalResponseDto)
  handle(
    @Param('id') id: string,
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.buscarProcessoDebitoPortalUseCase.execute({
      processoId: id,
      transportadoraId: req.user.transportadoraId,
    });
  }
}
