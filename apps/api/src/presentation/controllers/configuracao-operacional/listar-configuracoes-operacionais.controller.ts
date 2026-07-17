import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListConfiguracoesOperacionaisQueryDto,
  ListConfiguracoesOperacionaisResponseDto,
} from '../../../application/dtos/configuracao-operacional/list-configuracoes-operacionais.dto.js';
import { ListarConfiguracoesOperacionaisUseCase } from '../../../application/usecases/configuracao-operacional/listar-configuracoes-operacionais.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Operacional')
@Controller('operacional/configuracoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarConfiguracoesOperacionaisController {
  constructor(
    private readonly listarConfiguracoesOperacionaisUseCase: ListarConfiguracoesOperacionaisUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Get()
  @ApiOperation({
    summary: 'Listar configurações operacionais',
    operationId: 'listarConfiguracoesOperacionais',
  })
  @ApiSuccessResponse(ListConfiguracoesOperacionaisResponseDto)
  handle(@Query() query: ListConfiguracoesOperacionaisQueryDto) {
    return this.listarConfiguracoesOperacionaisUseCase.execute(query);
  }
}
