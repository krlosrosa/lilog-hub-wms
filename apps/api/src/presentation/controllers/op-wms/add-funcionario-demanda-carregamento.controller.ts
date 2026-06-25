import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DemandaFuncionarioDto } from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { AddFuncionarioDemandaCarregamentoUseCase } from '../../../application/usecases/op-wms/add-funcionario-demanda-carregamento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const DemandaIdParamSchema = z.object({
  demandaId: z.uuid(),
});

class DemandaIdParamDto extends createZodDto(DemandaIdParamSchema) {}

const AddFuncionarioDemandaBodySchema = z.object({
  sessaoFuncionarioId: z.uuid(),
});

class AddFuncionarioDemandaBodyDto extends createZodDto(
  AddFuncionarioDemandaBodySchema,
) {}

@ApiTags('OP WMS')
@Controller('op-wms/demandas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AddFuncionarioDemandaCarregamentoController {
  constructor(
    private readonly addFuncionarioDemandaCarregamentoUseCase: AddFuncionarioDemandaCarregamentoUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Post(':demandaId/funcionarios')
  @ApiOperation({
    summary: 'Adicionar auxiliar a demanda de carregamento',
    operationId: 'addFuncionarioDemandaCarregamento',
  })
  @ApiSuccessResponse(DemandaFuncionarioDto, 'created')
  handle(
    @Param() params: DemandaIdParamDto,
    @Body() body: AddFuncionarioDemandaBodyDto,
  ) {
    return this.addFuncionarioDemandaCarregamentoUseCase.execute(
      params.demandaId,
      body.sessaoFuncionarioId,
    );
  }
}
