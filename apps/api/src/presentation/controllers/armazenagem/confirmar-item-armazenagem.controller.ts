import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ItemArmazenagemResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { ConfirmarItemArmazenagemUseCase } from '../../../application/usecases/armazenagem/confirmar-item-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const ConfirmarItemParamsSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
});

class ConfirmarItemParamsDto extends createZodDto(ConfirmarItemParamsSchema) {}

const ConfirmarItemBodySchema = z.object({
  enderecoConfirmadoId: z.uuid(),
  unitizadorCodigo: z.string().min(1).optional(),
  motivoDivergencia: z.string().min(1).max(500).optional(),
});

class ConfirmarItemBodyDto extends createZodDto(ConfirmarItemBodySchema) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConfirmarItemArmazenagemController {
  constructor(
    private readonly confirmarItemArmazenagemUseCase: ConfirmarItemArmazenagemUseCase,
  ) {}

  @Post(':id/itens/:itemId/confirmar')
  @ApiOperation({
    summary: 'Confirm storage item placement',
    operationId: 'confirmarItemArmazenagem',
  })
  @ApiSuccessResponse(ItemArmazenagemResponseDto)
  handle(
    @Param() params: ConfirmarItemParamsDto,
    @Body() body: ConfirmarItemBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.confirmarItemArmazenagemUseCase.execute({
      demandaId: params.id,
      itemId: params.itemId,
      data: body,
      operatorId: req.user.id,
    });
  }
}
