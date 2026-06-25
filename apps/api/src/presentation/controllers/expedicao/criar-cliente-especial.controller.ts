import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ClienteEspecialResponseDto } from '../../../application/dtos/expedicao/cliente-especial.dto.js';
import { CriarClienteEspecialUseCase } from '../../../application/usecases/expedicao/criar-cliente-especial.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateClienteEspecialBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codCliente: z.string().min(1).max(50),
  nomeCliente: z.string().min(1).max(255),
  ativo: z.boolean().optional().default(true),
  exigeSegregacaoMapa: z.boolean().optional().default(false),
  exigeSeparacaoEspecial: z.boolean().optional().default(false),
  exigeCarregamentoEspecial: z.boolean().optional().default(false),
  observacaoSeparacao: z.string().max(2000).nullable().optional(),
  observacaoCarregamento: z.string().max(2000).nullable().optional(),
  observacaoGeral: z.string().max(2000).nullable().optional(),
});

class CreateClienteEspecialBodyDto extends createZodDto(
  CreateClienteEspecialBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/clientes-especiais')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarClienteEspecialController {
  constructor(
    private readonly criarClienteEspecialUseCase: CriarClienteEspecialUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'create', resource: 'cliente_especial' })
  @Post()
  @ApiOperation({
    summary: 'Cadastrar cliente especial',
    operationId: 'criarClienteEspecial',
  })
  @ApiSuccessResponse(ClienteEspecialResponseDto, 'created')
  handle(@Body() body: CreateClienteEspecialBodyDto) {
    return this.criarClienteEspecialUseCase.execute(body);
  }
}
