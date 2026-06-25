import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  InventarioResponseDto,
  toInventarioResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { CreateInventarioUseCase } from '../../../application/usecases/inventario/inventario.usecases.js';
import { InventarioTipoSchema } from '../../../domain/model/inventario/inventario.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateInventarioBodySchema = z.object({
  nome: z.string().min(3),
  tipo: InventarioTipoSchema,
  dataProgramada: z.iso.date(),
  centroId: z.uuid(),
  responsavelGestorId: z.number().int().positive().optional(),
});

class CreateInventarioBodyDto extends createZodDto(CreateInventarioBodySchema) {}

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateInventarioController {
  constructor(
    private readonly createInventarioUseCase: CreateInventarioUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'inventario' })
  @Post()
  @ApiOperation({
    summary: 'Create inventario',
    operationId: 'createInventario',
  })
  @ApiSuccessResponse(InventarioResponseDto, 'created')
  async handle(@Body() body: CreateInventarioBodyDto) {
    const created = await this.createInventarioUseCase.execute({
      ...body,
      dataProgramada: new Date(body.dataProgramada),
    });
    return toInventarioResponse(created);
  }
}
