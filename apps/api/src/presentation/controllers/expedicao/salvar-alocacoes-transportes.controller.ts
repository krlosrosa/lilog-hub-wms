import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SalvarAlocacoesTransportesResponseDto } from '../../../application/dtos/expedicao/salvar-alocacoes-transportes.dto.js';
import { SalvarAlocacoesTransportesUseCase } from '../../../application/usecases/expedicao/salvar-alocacoes-transportes.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const SalvarAlocacaoItemSchema = z.object({
  transporteId: z.string().min(1).max(100),
  placaTransportadoraId: z.string().min(1).max(100),
  placa: z.string().min(1).max(20),
  transportadora: z.string().min(1).max(255),
  motorista: z.string().max(255).nullable().optional(),
  perfilTarifaId: z.uuid().nullable().optional(),
  perfilTarifaNome: z.string().max(255).nullable().optional(),
  perfilPagamentoId: z.uuid().nullable().optional(),
  perfilPagamentoNome: z.string().max(255).nullable().optional(),
  semCusto: z.boolean().optional(),
  itinerario: z.string().max(100).nullable().optional(),
  nivelPrioridade: z
    .enum(['urgente', 'prioritaria', 'normal', 'baixa'])
    .nullable()
    .optional(),
  horarioExpectativaSaida: z.iso.datetime().nullable().optional(),
  cidade: z.string().max(100).optional(),
  bairro: z.string().max(100).nullable().optional(),
  isPrioridade: z.boolean().optional(),
  custoPrevisto: z.number().nullable().optional(),
});

const SalvarAlocacoesTransportesBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  alocacoes: z.array(SalvarAlocacaoItemSchema).min(1),
});

class SalvarAlocacoesTransportesBodyDto extends createZodDto(
  SalvarAlocacoesTransportesBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/transportes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class SalvarAlocacoesTransportesController {
  constructor(
    private readonly salvarAlocacoesTransportesUseCase: SalvarAlocacoesTransportesUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'expedicao-transporte-alocacao' })
  @Post('alocacoes')
  @ApiOperation({
    summary: 'Persistir alocações de placas nos transportes',
    operationId: 'salvarAlocacoesTransportes',
  })
  @ApiSuccessResponse(SalvarAlocacoesTransportesResponseDto)
  handle(@Body() body: SalvarAlocacoesTransportesBodyDto) {
    return this.salvarAlocacoesTransportesUseCase.execute(body);
  }
}
