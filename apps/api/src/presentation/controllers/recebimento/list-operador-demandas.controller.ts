import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ListOperadorDemandasResponseDto } from '../../../application/dtos/recebimento/operador-conferencia.dto.js';
import { ListOperadorDemandasUseCase } from '../../../application/usecases/recebimento/list-operador-demandas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const ListOperadorDemandasQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50).optional(),
});

class ListOperadorDemandasQueryDto extends createZodDto(
  ListOperadorDemandasQuerySchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListOperadorDemandasController {
  constructor(
    private readonly listOperadorDemandasUseCase: ListOperadorDemandasUseCase,
  ) {}

  @RequirePermissions(
    RECEBIMENTO_PERMISSION.VISUALIZAR,
    RECEBIMENTO_PERMISSION.CONFERIR,
  )
  @Get('operador/demandas')
  @ApiOperation({
    summary: 'List operator demands (blind)',
    operationId: 'listOperadorDemandas',
  })
  @ApiSuccessResponse(ListOperadorDemandasResponseDto)
  handle(
    @Query() query: ListOperadorDemandasQueryDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.listOperadorDemandasUseCase.execute({
      unidadeId: query.unidadeId,
      userId: req.user.id,
    });
  }
}
