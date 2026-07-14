import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { ListMyUnidadesResponseDto } from '../../../application/dtos/auth/my-unidades.dto.js';
import { ListMyUnidadesUseCase } from '../../../application/usecases/auth/list-my-unidades.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { LiderancaGuard } from '../../../shared/guards/lideranca.guard.js';

@ApiTags('Auth')
@Controller('auth')
@ApiErrorResponses()
export class ListMyUnidadesController {
  constructor(private readonly listMyUnidadesUseCase: ListMyUnidadesUseCase) {}

  @Get('me/unidades')
  @UseGuards(JwtAuthGuard, LiderancaGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Lista unidades acessíveis ao usuário autenticado',
    operationId: 'listMyUnidades',
  })
  @ApiSuccessResponse(ListMyUnidadesResponseDto)
  handle(@Request() req: FastifyRequest & { user: { id: number } }) {
    return this.listMyUnidadesUseCase.execute(req.user.id);
  }
}
