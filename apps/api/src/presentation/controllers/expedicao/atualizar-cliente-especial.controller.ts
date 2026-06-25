import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ClienteEspecialResponseDto } from '../../../application/dtos/expedicao/cliente-especial.dto.js';
import { AtualizarClienteEspecialUseCase } from '../../../application/usecases/expedicao/atualizar-cliente-especial.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateClienteEspecialBodySchema = z.object({
  codCliente: z.string().min(1).max(50).optional(),
  nomeCliente: z.string().min(1).max(255).optional(),
  ativo: z.boolean().optional(),
  exigeSegregacaoMapa: z.boolean().optional(),
  exigeSeparacaoEspecial: z.boolean().optional(),
  exigeCarregamentoEspecial: z.boolean().optional(),
  observacaoSeparacao: z.string().max(2000).nullable().optional(),
  observacaoCarregamento: z.string().max(2000).nullable().optional(),
  observacaoGeral: z.string().max(2000).nullable().optional(),
});

class UpdateClienteEspecialBodyDto extends createZodDto(
  UpdateClienteEspecialBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/clientes-especiais')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarClienteEspecialController {
  constructor(
    private readonly atualizarClienteEspecialUseCase: AtualizarClienteEspecialUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'cliente_especial' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar cliente especial',
    operationId: 'atualizarClienteEspecial',
  })
  @ApiSuccessResponse(ClienteEspecialResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateClienteEspecialBodyDto,
  ) {
    return this.atualizarClienteEspecialUseCase.execute({ id, data: body });
  }
}
