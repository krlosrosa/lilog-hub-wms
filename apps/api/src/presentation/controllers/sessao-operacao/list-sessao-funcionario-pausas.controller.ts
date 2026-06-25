import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListSessaoFuncionarioPausasResponseDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { ListSessaoFuncionarioPausasUseCase } from '../../../application/usecases/sessao-operacao/list-sessao-funcionario-pausas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListSessaoFuncionarioPausasController {
  constructor(
    private readonly listSessaoFuncionarioPausasUseCase: ListSessaoFuncionarioPausasUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_VIEW)
  @Get(':id/funcionarios/:funcionarioId/pausas')
  @ApiOperation({
    summary: 'Listar pausas do funcionario na sessao',
    operationId: 'listSessaoFuncionarioPausas',
  })
  @ApiSuccessResponse(ListSessaoFuncionarioPausasResponseDto)
  handle(
    @Param('id') id: string,
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
  ) {
    return this.listSessaoFuncionarioPausasUseCase.execute(id, funcionarioId);
  }
}
