import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConfiguracaoOperacionalResponseDto } from '../../../application/dtos/configuracao-operacional/list-configuracoes-operacionais.dto.js';
import { DefinirPadraoConfiguracaoOperacionalUseCase } from '../../../application/usecases/configuracao-operacional/definir-padrao-configuracao-operacional.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Operacional')
@Controller('operacional/configuracoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DefinirPadraoConfiguracaoOperacionalController {
  constructor(
    private readonly definirPadraoConfiguracaoOperacionalUseCase: DefinirPadraoConfiguracaoOperacionalUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'configuracao_operacional_padrao' })
  @Patch(':id/padrao')
  @ApiOperation({
    summary: 'Definir configuração operacional como padrão do escopo',
    operationId: 'definirPadraoConfiguracaoOperacional',
  })
  @ApiSuccessResponse(ConfiguracaoOperacionalResponseDto)
  handle(@Param('id') id: string) {
    return this.definirPadraoConfiguracaoOperacionalUseCase.execute(id);
  }
}
