import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConfiguracaoImpressaoResponseDto } from '../../../application/dtos/configuracao-impressao/list-configuracoes-impressao.dto.js';
import { DefinirPadraoConfiguracaoImpressaoUseCase } from '../../../application/usecases/configuracao-impressao/definir-padrao-configuracao-impressao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
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
export class DefinirPadraoConfiguracaoImpressaoController {
  constructor(
    private readonly definirPadraoConfiguracaoImpressaoUseCase: DefinirPadraoConfiguracaoImpressaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'configuracao_impressao_padrao' })
  @Patch(':id/padrao')
  @ApiOperation({
    summary: 'Definir configuração de impressão como padrão da unidade',
    operationId: 'definirPadraoConfiguracaoImpressao',
  })
  @ApiSuccessResponse(ConfiguracaoImpressaoResponseDto)
  handle(@Param('id') id: string) {
    return this.definirPadraoConfiguracaoImpressaoUseCase.execute(id);
  }
}
