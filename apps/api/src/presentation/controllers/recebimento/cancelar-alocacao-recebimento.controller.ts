import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AlocacaoRecebimentoDto } from '../../../application/dtos/recebimento/recursos-recebimento-sessao.dto.js';
import { CancelarAlocacaoRecebimentoUseCase } from '../../../application/usecases/recebimento/cancelar-alocacao-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CancelarAlocacaoParamSchema = z.object({
  id: z.uuid(),
});

class CancelarAlocacaoParamDto extends createZodDto(CancelarAlocacaoParamSchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos/alocacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CancelarAlocacaoRecebimentoController {
  constructor(
    private readonly cancelarAlocacaoRecebimentoUseCase: CancelarAlocacaoRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'delete', resource: 'recebimento_alocacao' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Cancelar atribuição de conferente',
    operationId: 'cancelarAlocacaoRecebimento',
  })
  @ApiSuccessResponse(AlocacaoRecebimentoDto)
  handle(@Param() params: CancelarAlocacaoParamDto) {
    return this.cancelarAlocacaoRecebimentoUseCase.execute(params.id);
  }
}
