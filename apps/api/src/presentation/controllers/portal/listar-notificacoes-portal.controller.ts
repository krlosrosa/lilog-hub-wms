import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import {
  ListarNotificacoesPortalQueryDto,
  ListarNotificacoesPortalResponseDto,
} from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { ListarNotificacoesPortalUseCase } from '../../../application/usecases/portal/listar-notificacoes-portal.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

@ApiTags('Portal Notificacoes')
@Controller('portal/notificacoes')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarNotificacoesPortalController {
  constructor(
    private readonly listarNotificacoesPortalUseCase: ListarNotificacoesPortalUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar notificações do portal da transportadora autenticada',
    operationId: 'listarNotificacoesPortal',
  })
  @ApiSuccessResponse(ListarNotificacoesPortalResponseDto)
  handle(
    @Query() query: ListarNotificacoesPortalQueryDto,
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.listarNotificacoesPortalUseCase.execute({
      transportadoraId: req.user.transportadoraId,
      apenasNaoLidas: query.apenasNaoLidas,
      limit: query.limit,
    });
  }
}
