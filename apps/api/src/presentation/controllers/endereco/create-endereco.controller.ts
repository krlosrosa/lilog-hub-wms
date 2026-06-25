import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { EnderecoResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { CreateEnderecoUseCase } from '../../../application/usecases/endereco/create-endereco.usecase.js';
import {
  CurvaAbcEnderecoSchema,
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

const CreateEnderecoBodySchema = z.object({
  centroId: z.uuid(),
  zona: z.string().min(1).max(10),
  rua: z.string().min(1).max(10).regex(/^\d+$/),
  posicao: z.string().min(1).max(10).regex(/^\d+$/),
  nivel: z.string().min(1).max(10).regex(/^\d+$/),
  tipo: EnderecoTipoSchema,
  tipoEstrutura: EnderecoTipoEstruturaSchema,
  larguraMm: z.number().int().positive(),
  alturaMm: z.number().int().positive(),
  profundidadeMm: z.number().int().positive(),
  cargaMaxKg: z.number().positive(),
  capacidadeVolume: z.number().positive().optional(),
  prioridadePicking: z.number().int().optional(),
  coordenadaX: z.number().optional(),
  coordenadaY: z.number().optional(),
  coordenadaZ: z.number().optional(),
  observacao: z.string().optional(),
  vinculoSkuFixo: z.boolean().default(false),
  regraLoteUnico: z.boolean().default(false),
  permiteMisturaValidade: z.boolean().default(false),
  permiteFracionado: z.boolean().default(false),
  curvaAbc: CurvaAbcEnderecoSchema.default('B'),
});

class CreateEnderecoBodyDto extends createZodDto(CreateEnderecoBodySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateEnderecoController {
  constructor(private readonly createEnderecoUseCase: CreateEnderecoUseCase) {}

  @RequirePermissions(ADDRESS_PERMISSION.CREATE)
  @Auditable({ action: 'create', resource: 'endereco' })
  @Post()
  @ApiOperation({
    summary: 'Create endereco',
    operationId: 'createEndereco',
  })
  @ApiSuccessResponse(EnderecoResponseDto, 'created')
  handle(
    @Body() body: CreateEnderecoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.createEnderecoUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
