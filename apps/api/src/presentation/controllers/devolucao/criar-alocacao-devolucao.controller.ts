import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CriarAlocacaoDevolucaoResponseDto,
  DevolucaoAlocacaoFuncaoDtoSchema,
} from '../../../application/dtos/devolucao/recursos-devolucao-sessao.dto.js';
import { CriarAlocacaoDevolucaoUseCase } from '../../../application/usecases/devolucao/criar-alocacao-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarAlocacaoDevolucaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  demandaId: z.uuid(),
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  funcao: DevolucaoAlocacaoFuncaoDtoSchema.optional(),
});

class CriarAlocacaoDevolucaoBodyDto extends createZodDto(
  CriarAlocacaoDevolucaoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/alocacoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarAlocacaoDevolucaoController {
  constructor(
    private readonly criarAlocacaoDevolucaoUseCase: CriarAlocacaoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'devolucao_alocacao' })
  @Post()
  @ApiOperation({
    summary: 'Alocar operador em demanda de devolução',
    operationId: 'criarAlocacaoDevolucao',
  })
  @ApiSuccessResponse(CriarAlocacaoDevolucaoResponseDto, 'created')
  handle(@Body() body: CriarAlocacaoDevolucaoBodyDto) {
    return this.criarAlocacaoDevolucaoUseCase.execute(body);
  }
}
