import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ConfiguracaoOperacionalResponseDto } from '../../../application/dtos/configuracao-operacional/list-configuracoes-operacionais.dto.js';
import { AtualizarConfiguracaoOperacionalUseCase } from '../../../application/usecases/configuracao-operacional/atualizar-configuracao-operacional.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateConfiguracaoOperacionalBodySchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  descricao: z.string().nullable().optional(),
  parametros: z.record(z.string(), z.unknown()).optional(),
  versaoSchema: z.number().int().min(1).max(32767).optional(),
  isPadrao: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

class UpdateConfiguracaoOperacionalBodyDto extends createZodDto(
  UpdateConfiguracaoOperacionalBodySchema,
) {}

@ApiTags('Operacional')
@Controller('operacional/configuracoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarConfiguracaoOperacionalController {
  constructor(
    private readonly atualizarConfiguracaoOperacionalUseCase: AtualizarConfiguracaoOperacionalUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'configuracao_operacional' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar configuração operacional',
    operationId: 'atualizarConfiguracaoOperacional',
  })
  @ApiSuccessResponse(ConfiguracaoOperacionalResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateConfiguracaoOperacionalBodyDto,
  ) {
    return this.atualizarConfiguracaoOperacionalUseCase.execute({ id, data: body });
  }
}
