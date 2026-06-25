import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CriarDemandasResponseDto } from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { CriarDemandasSeparacaoUseCase } from '../../../application/usecases/op-wms/criar-demandas-separacao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarDemandasBodySchema = z.object({
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  mapaGrupoIds: z.array(z.uuid()).min(1),
});

class CriarDemandasBodyDto extends createZodDto(CriarDemandasBodySchema) {}

@ApiTags('OP WMS')
@Controller('op-wms/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarDemandasSeparacaoController {
  constructor(
    private readonly criarDemandasSeparacaoUseCase: CriarDemandasSeparacaoUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post()
  @ApiOperation({
    summary: 'Cadastrar demandas de separação',
    operationId: 'criarDemandasSeparacao',
  })
  @ApiSuccessResponse(CriarDemandasResponseDto, 'created')
  handle(
    @Body() body: CriarDemandasBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.criarDemandasSeparacaoUseCase.execute({
      sessaoId: body.sessaoId,
      sessaoFuncionarioId: body.sessaoFuncionarioId,
      mapaGrupoIds: body.mapaGrupoIds,
      atribuidoPor: req.user.id,
    });
  }
}
