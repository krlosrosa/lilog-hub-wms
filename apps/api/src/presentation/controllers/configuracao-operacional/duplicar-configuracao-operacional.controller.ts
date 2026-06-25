import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ConfiguracaoOperacionalResponseDto } from '../../../application/dtos/configuracao-operacional/list-configuracoes-operacionais.dto.js';
import { DuplicarConfiguracaoOperacionalUseCase } from '../../../application/usecases/configuracao-operacional/duplicar-configuracao-operacional.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
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
export class DuplicarConfiguracaoOperacionalController {
  constructor(
    private readonly duplicarConfiguracaoOperacionalUseCase: DuplicarConfiguracaoOperacionalUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'create', resource: 'configuracao_operacional_duplicar' })
  @Post(':id/duplicar')
  @ApiOperation({
    summary: 'Duplicar configuração operacional',
    operationId: 'duplicarConfiguracaoOperacional',
  })
  @ApiSuccessResponse(ConfiguracaoOperacionalResponseDto, 'created')
  handle(@Param('id') id: string) {
    return this.duplicarConfiguracaoOperacionalUseCase.execute(id);
  }
}
