import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  InteracaoTipoCdSchema,
  RegistrarInteracaoCdQueryDto,
  RegistrarInteracaoCdResponseDto,
} from '../../../application/dtos/cobranca-transportadora/listar-processos-debito.dto.js';
import { RegistrarInteracaoCdUseCase } from '../../../application/usecases/cobranca-transportadora/registrar-interacao-cd.usecase.js';
import { COBRANCA_TRANSPORTADORA_PERMISSION } from '../../../shared/constants/cobranca-transportadora-permissions.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import { getRequestUser, type RequestUser } from '../../../shared/utils/request-user.js';

const RegistrarInteracaoCdBodySchema = z.object({
  tipo: InteracaoTipoCdSchema,
  descricao: z.string().min(10).max(2000),
  anexoChaves: z.array(z.string()).max(5).default([]),
});

class RegistrarInteracaoCdBodyDto extends createZodDto(
  RegistrarInteracaoCdBodySchema,
) {}

@ApiTags('CobrancaTransportadora')
@Controller('cobranca-transportadora/processos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RegistrarInteracaoCdController {
  constructor(
    private readonly registrarInteracaoCdUseCase: RegistrarInteracaoCdUseCase,
  ) {}

  @RequirePermissions(COBRANCA_TRANSPORTADORA_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'processo_debito_interacao' })
  @Post(':id/interacao')
  @ApiOperation({
    summary: 'Registrar interação do CD no processo de débito',
    operationId: 'registrarInteracaoCd',
  })
  @ApiSuccessResponse(RegistrarInteracaoCdResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Query() query: RegistrarInteracaoCdQueryDto,
    @Body() body: RegistrarInteracaoCdBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.registrarInteracaoCdUseCase.execute({
      processoId: id,
      unidadeId: query.unidadeId,
      tipo: body.tipo,
      descricao: body.descricao,
      anexoChaves: body.anexoChaves ?? [],
      criadoPorUserId: getRequestUser(request)?.id ?? null,
    });
  }
}
