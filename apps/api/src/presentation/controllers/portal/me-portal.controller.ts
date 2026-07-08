import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { PortalMeResponseDto } from '../../../application/dtos/portal/portal-auth.dto.js';
import { GetMePortalUseCase } from '../../../application/usecases/portal/get-me-portal.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

@ApiTags('Portal Auth')
@Controller('portal/auth')
@ApiErrorResponses()
export class MePortalController {
  constructor(private readonly getMePortalUseCase: GetMePortalUseCase) {}

  @Get('me')
  @UseGuards(PortalJwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retorna o contexto autenticado do portal',
    operationId: 'getMePortal',
  })
  @ApiSuccessResponse(PortalMeResponseDto)
  handle(
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.getMePortalUseCase.execute({
      email: req.user.email,
      transportadoraId: req.user.transportadoraId,
    });
  }
}
