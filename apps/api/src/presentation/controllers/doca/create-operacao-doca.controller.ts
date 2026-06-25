import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { OperacaoDocaResponseDto } from '../../../application/dtos/doca/operacao-doca.dto.js';
import { CreateOperacaoDocaUseCase } from '../../../application/usecases/operacao-doca/create-operacao-doca.usecase.js';
import {
  OperacaoDocaPrioridadeSchema,
  OperacaoDocaTipoSchema,
} from '../../../domain/model/doca/doca.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCA_PERMISSION } from '../../../shared/constants/doca-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const CreateOperacaoDocaBodySchema = z.object({
  tipoOperacao: OperacaoDocaTipoSchema,
  veiculoId: z.uuid(),
  transportadoraId: z.uuid(),
  motorista: z.string().optional(),
  dataPrevista: z.iso.datetime().optional(),
  prioridade: OperacaoDocaPrioridadeSchema.default('normal'),
  observacao: z.string().optional(),
});

class CreateOperacaoDocaBodyDto extends createZodDto(
  CreateOperacaoDocaBodySchema,
) {}

@ApiTags('Doca')
@Controller('docas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateOperacaoDocaController {
  constructor(
    private readonly createOperacaoDocaUseCase: CreateOperacaoDocaUseCase,
  ) {}

  @RequirePermissions(DOCA_PERMISSION.OPERACAO_CREATE)
  @Auditable({ action: 'create', resource: 'operacao-doca' })
  @Post(':docaId/operacoes')
  @ApiOperation({
    summary: 'Create operacao doca',
    operationId: 'createOperacaoDoca',
  })
  @ApiSuccessResponse(OperacaoDocaResponseDto, 'created')
  handle(
    @Param('docaId') docaId: string,
    @Body() body: CreateOperacaoDocaBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.createOperacaoDocaUseCase.execute({
      data: { ...body, docaId },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
