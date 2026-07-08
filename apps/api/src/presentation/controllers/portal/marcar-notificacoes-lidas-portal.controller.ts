import { Body, Controller, HttpCode, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { MarcarNotificacoesLidasBodyDto } from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { MarcarNotificacoesLidasPortalUseCase } from '../../../application/usecases/portal/marcar-notificacoes-lidas-portal.usecase.js';
import {
  ApiErrorResponses,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

@ApiTags('Portal Notificacoes')
@Controller('portal/notificacoes')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class MarcarNotificacoesLidasPortalController {
  constructor(
    private readonly marcarNotificacoesLidasPortalUseCase: MarcarNotificacoesLidasPortalUseCase,
  ) {}

  @Patch('lidas')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Marcar notificações do portal como lidas',
    operationId: 'marcarNotificacoesLidasPortal',
  })
  @ApiResponse({ status: 204, description: 'Notificações marcadas como lidas' })
  handle(
    @Body() body: MarcarNotificacoesLidasBodyDto,
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.marcarNotificacoesLidasPortalUseCase.execute({
      ids: body.ids,
      transportadoraId: req.user.transportadoraId,
    });
  }
}
