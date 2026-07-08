import { Controller, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RemoverAlocacaoDevolucaoResponseDto } from '../../../application/dtos/devolucao/recursos-devolucao-sessao.dto.js';
import { RemoverAlocacaoDevolucaoUseCase } from '../../../application/usecases/devolucao/remover-alocacao-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const RemoverAlocacaoDevolucaoQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class RemoverAlocacaoDevolucaoQueryDto extends createZodDto(
  RemoverAlocacaoDevolucaoQuerySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/alocacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoverAlocacaoDevolucaoController {
  constructor(
    private readonly removerAlocacaoDevolucaoUseCase: RemoverAlocacaoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'delete', resource: 'devolucao_alocacao' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover alocação de operador em demanda de devolução',
    operationId: 'removerAlocacaoDevolucao',
  })
  @ApiSuccessResponse(RemoverAlocacaoDevolucaoResponseDto)
  handle(
    @Param('id') id: string,
    @Query() query: RemoverAlocacaoDevolucaoQueryDto,
  ) {
    return this.removerAlocacaoDevolucaoUseCase.execute(id, query.unidadeId);
  }
}
