import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { GetMeUseCase } from '../../../application/usecases/auth/get-me.usecase.js';
import {
  ApiErrorResponses,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
@ApiErrorResponses()
export class MeController {
  constructor(private readonly getMeUseCase: GetMeUseCase) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Retorna o usuário autenticado', operationId: 'getMe' })
  handle(@Request() req: FastifyRequest & { user: { id: number; email: string } }) {
    return this.getMeUseCase.execute(req.user.id);
  }
}
