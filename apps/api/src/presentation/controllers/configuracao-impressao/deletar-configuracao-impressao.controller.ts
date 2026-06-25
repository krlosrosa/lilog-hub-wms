import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeletarConfiguracaoImpressaoUseCase } from '../../../application/usecases/configuracao-impressao/deletar-configuracao-impressao.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Expedicao')
@Controller('expedicao/configuracoes-impressao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeletarConfiguracaoImpressaoController {
  constructor(
    private readonly deletarConfiguracaoImpressaoUseCase: DeletarConfiguracaoImpressaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'delete', resource: 'configuracao_impressao' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar configuração de impressão',
    operationId: 'deletarConfiguracaoImpressao',
  })
  handle(@Param('id') id: string) {
    return this.deletarConfiguracaoImpressaoUseCase.execute(id);
  }
}
