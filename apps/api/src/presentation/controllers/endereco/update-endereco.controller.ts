import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { EnderecoResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { UpdateEnderecoUseCase } from '../../../application/usecases/endereco/update-endereco.usecase.js';
import {
  CurvaAbcEnderecoSchema,
  EnderecoStatusSchema,
  EnderecoTipoEstruturaSchema,
  EnderecoTipoSchema,
} from '../../../domain/model/endereco/endereco.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const UpdateEnderecoBodySchema = z.object({
  centroId: z.uuid().optional(),
  zona: z.string().min(1).max(10).optional(),
  rua: z.string().min(1).max(10).regex(/^\d+$/).optional(),
  posicao: z.string().min(1).max(10).regex(/^\d+$/).optional(),
  nivel: z.string().min(1).max(10).regex(/^\d+$/).optional(),
  tipo: EnderecoTipoSchema.optional(),
  status: EnderecoStatusSchema.optional(),
  tipoEstrutura: EnderecoTipoEstruturaSchema.optional(),
  larguraMm: z.number().int().positive().optional(),
  alturaMm: z.number().int().positive().optional(),
  profundidadeMm: z.number().int().positive().optional(),
  cargaMaxKg: z.number().positive().optional(),
  capacidadeVolume: z.number().positive().nullable().optional(),
  prioridadePicking: z.number().int().nullable().optional(),
  coordenadaX: z.number().nullable().optional(),
  coordenadaY: z.number().nullable().optional(),
  coordenadaZ: z.number().nullable().optional(),
  observacao: z.string().nullable().optional(),
  vinculoSkuFixo: z.boolean().optional(),
  regraLoteUnico: z.boolean().optional(),
  permiteMisturaValidade: z.boolean().optional(),
  permiteFracionado: z.boolean().optional(),
  curvaAbc: CurvaAbcEnderecoSchema.optional(),
  ocupacaoPercent: z.number().min(0).max(100).optional(),
  motivoAlteracao: z.string().min(1).optional(),
});

class UpdateEnderecoBodyDto extends createZodDto(UpdateEnderecoBodySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateEnderecoController {
  constructor(private readonly updateEnderecoUseCase: UpdateEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Auditable({ action: 'update', resource: 'endereco' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update endereco',
    operationId: 'updateEndereco',
  })
  @ApiSuccessResponse(EnderecoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.updateEnderecoUseCase.execute({
      id,
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
