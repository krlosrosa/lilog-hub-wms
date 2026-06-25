import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoveFuncionarioDemandaCarregamentoUseCase } from '../../../application/usecases/op-wms/remove-funcionario-demanda-carregamento.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const RemoveFuncionarioDemandaParamSchema = z.object({
  demandaId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
});

class RemoveFuncionarioDemandaParamDto extends createZodDto(
  RemoveFuncionarioDemandaParamSchema,
) {}

@ApiTags('OP WMS')
@Controller('op-wms/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoveFuncionarioDemandaCarregamentoController {
  constructor(
    private readonly removeFuncionarioDemandaCarregamentoUseCase: RemoveFuncionarioDemandaCarregamentoUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Delete(':demandaId/funcionarios/:sessaoFuncionarioId')
  @ApiOperation({
    summary: 'Remover auxiliar de demanda de carregamento',
    operationId: 'removeFuncionarioDemandaCarregamento',
  })
  handle(@Param() params: RemoveFuncionarioDemandaParamDto) {
    return this.removeFuncionarioDemandaCarregamentoUseCase.execute(
      params.demandaId,
      params.sessaoFuncionarioId,
    );
  }
}
