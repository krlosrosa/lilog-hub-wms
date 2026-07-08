import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  InteracaoTipoPortalSchema,
  RegistrarInteracaoPortalResponseDto,
} from '../../../application/dtos/portal/portal-cobranca.dto.js';
import { RegistrarInteracaoPortalUseCase } from '../../../application/usecases/portal/registrar-interacao-portal.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { PortalJwtAuthGuard } from '../../../shared/guards/portal-jwt-auth.guard.js';

const RegistrarInteracaoPortalBodySchema = z.object({
  tipo: InteracaoTipoPortalSchema,
  descricao: z.string().min(10).max(2000),
  anexoChaves: z.array(z.string()).max(5).default([]),
});

class RegistrarInteracaoPortalBodyDto extends createZodDto(
  RegistrarInteracaoPortalBodySchema,
) {}

@ApiTags('Portal Cobranca')
@Controller('portal/cobranca/processos')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RegistrarInteracaoPortalController {
  constructor(
    private readonly registrarInteracaoPortalUseCase: RegistrarInteracaoPortalUseCase,
  ) {}

  @Post(':id/interacao')
  @ApiOperation({
    summary: 'Registrar interação da transportadora no processo de débito',
    operationId: 'registrarInteracaoPortal',
  })
  @ApiSuccessResponse(RegistrarInteracaoPortalResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: RegistrarInteracaoPortalBodyDto,
    @Request()
    req: FastifyRequest & {
      user: { email: string; transportadoraId: string };
    },
  ) {
    return this.registrarInteracaoPortalUseCase.execute({
      processoId: id,
      transportadoraId: req.user.transportadoraId,
      tipo: body.tipo,
      descricao: body.descricao,
      anexoChaves: body.anexoChaves ?? [],
    });
  }
}
