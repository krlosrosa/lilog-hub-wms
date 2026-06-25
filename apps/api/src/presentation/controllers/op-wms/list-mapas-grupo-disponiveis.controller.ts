import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListMapasGrupoDisponiveisQueryDto,
  ListMapasGrupoDisponiveisResponseDto,
  SessaoIdParamDto,
} from '../../../application/dtos/op-wms/demanda-separacao.dto.js';
import { ListMapasGrupoDisponiveisUseCase } from '../../../application/usecases/op-wms/list-mapas-grupo-disponiveis.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('OP WMS')
@Controller('op-wms/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListMapasGrupoDisponiveisController {
  constructor(
    private readonly listMapasGrupoDisponiveisUseCase: ListMapasGrupoDisponiveisUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Get(':sessaoId/mapas-grupo-disponiveis')
  @ApiOperation({
    summary: 'Listar mapas-grupo disponíveis para atribuição',
    operationId: 'listMapasGrupoDisponiveis',
  })
  @ApiSuccessResponse(ListMapasGrupoDisponiveisResponseDto)
  handle(
    @Param() params: SessaoIdParamDto,
    @Query() query: ListMapasGrupoDisponiveisQueryDto,
  ) {
    return this.listMapasGrupoDisponiveisUseCase.execute(
      params.sessaoId,
      query.processo,
    );
  }
}
