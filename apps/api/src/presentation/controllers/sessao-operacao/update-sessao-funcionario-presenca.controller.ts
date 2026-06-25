import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { SessaoFuncionarioDto } from '../../../application/dtos/sessao-operacao/sessao.dto.js';
import { UpdateSessaoFuncionarioPresencaUseCase } from '../../../application/usecases/sessao-operacao/update-sessao-funcionario-presenca.usecase.js';
import { UpdateSessaoFuncionarioPresencaInputSchema } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

class UpdateSessaoFuncionarioPresencaBodyDto extends createZodDto(
  UpdateSessaoFuncionarioPresencaInputSchema,
) {}

@ApiTags('Sessão Operação')
@Controller('sessao-operacao/sessoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateSessaoFuncionarioPresencaController {
  constructor(
    private readonly updateSessaoFuncionarioPresencaUseCase: UpdateSessaoFuncionarioPresencaUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.SESSAO_OPERACAO_MANAGE)
  @Patch(':id/funcionarios/:funcionarioId')
  @Auditable({ action: 'update', resource: 'sessao_funcionario' })
  @ApiOperation({
    summary: 'Update presenca do funcionario na sessao',
    operationId: 'updateSessaoFuncionarioPresenca',
  })
  @ApiSuccessResponse(SessaoFuncionarioDto)
  handle(
    @Param('id') id: string,
    @Param('funcionarioId', ParseIntPipe) funcionarioId: number,
    @Body() body: UpdateSessaoFuncionarioPresencaBodyDto,
  ) {
    return this.updateSessaoFuncionarioPresencaUseCase.execute(
      id,
      funcionarioId,
      body,
    );
  }
}
