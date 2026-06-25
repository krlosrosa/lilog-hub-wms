import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { CreatePreRecebimentoUseCase } from '../../../application/usecases/recebimento/create-pre-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const CreatePreRecebimentoItemBodySchema = z.object({
  produtoId: z.uuid(),
  quantidadeEsperada: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.number().positive().optional(),
  validadeEsperada: z.iso.datetime().optional(),
});

const CreatePreRecebimentoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transportadoraId: z.string().min(1).max(50),
  placa: z.string().min(1).max(20),
  horarioPrevisto: z.iso.datetime(),
  observacao: z.string().optional(),
  itens: z.array(CreatePreRecebimentoItemBodySchema).min(1),
});

class CreatePreRecebimentoBodyDto extends createZodDto(
  CreatePreRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreatePreRecebimentoController {
  constructor(
    private readonly createPreRecebimentoUseCase: CreatePreRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CRIAR)
  @Auditable({ action: 'create', resource: 'pre-recebimento' })
  @Post()
  @ApiOperation({
    summary: 'Create pre-recebimento',
    operationId: 'createPreRecebimento',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto, 'created')
  handle(
    @Body() body: CreatePreRecebimentoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.createPreRecebimentoUseCase.execute({
      data: {
        ...body,
        horarioPrevisto: new Date(body.horarioPrevisto),
        itens: body.itens.map((item) => ({
          ...item,
          validadeEsperada: item.validadeEsperada
            ? new Date(item.validadeEsperada)
            : undefined,
        })),
      },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
