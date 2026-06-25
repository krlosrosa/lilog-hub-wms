import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ConfiguracaoOperacionalResponseDto } from '../../../application/dtos/configuracao-operacional/list-configuracoes-operacionais.dto.js';
import { CriarConfiguracaoOperacionalUseCase } from '../../../application/usecases/configuracao-operacional/criar-configuracao-operacional.usecase.js';
import { SubtipoConfiguracaoSchema } from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateConfiguracaoOperacionalBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  dominio: z.string().min(1).max(50),
  categoria: z.string().min(1).max(50),
  subtipo: SubtipoConfiguracaoSchema,
  nome: z.string().min(1).max(120),
  descricao: z.string().optional(),
  parametros: z.record(z.string(), z.unknown()),
  versaoSchema: z.number().int().min(1).max(32767).optional().default(1),
  isPadrao: z.boolean().optional().default(false),
  ativo: z.boolean().optional().default(true),
});

class CreateConfiguracaoOperacionalBodyDto extends createZodDto(
  CreateConfiguracaoOperacionalBodySchema,
) {}

@ApiTags('Operacional')
@Controller('operacional/configuracoes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarConfiguracaoOperacionalController {
  constructor(
    private readonly criarConfiguracaoOperacionalUseCase: CriarConfiguracaoOperacionalUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'create', resource: 'configuracao_operacional' })
  @Post()
  @ApiOperation({
    summary: 'Criar configuração operacional',
    operationId: 'criarConfiguracaoOperacional',
  })
  @ApiSuccessResponse(ConfiguracaoOperacionalResponseDto, 'created')
  handle(@Body() body: CreateConfiguracaoOperacionalBodyDto) {
    return this.criarConfiguracaoOperacionalUseCase.execute(body);
  }
}
