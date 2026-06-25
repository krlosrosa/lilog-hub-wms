import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeletarConfiguracaoOperacionalUseCase } from '../../../application/usecases/configuracao-operacional/deletar-configuracao-operacional.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Operacional')
@Controller('operacional/configuracoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeletarConfiguracaoOperacionalController {
  constructor(
    private readonly deletarConfiguracaoOperacionalUseCase: DeletarConfiguracaoOperacionalUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'delete', resource: 'configuracao_operacional' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar configuração operacional',
    operationId: 'deletarConfiguracaoOperacional',
  })
  handle(@Param('id') id: string) {
    return this.deletarConfiguracaoOperacionalUseCase.execute(id);
  }
}
