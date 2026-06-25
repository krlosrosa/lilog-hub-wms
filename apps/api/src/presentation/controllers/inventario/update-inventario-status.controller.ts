import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  InventarioResponseDto,
  toInventarioResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { UpdateInventarioStatusUseCase } from '../../../application/usecases/inventario/inventario.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const UpdateInventarioStatusBodySchema = z.object({
  status: z.enum(['pausado', 'em_progresso', 'concluido']),
});

class UpdateInventarioStatusBodyDto extends createZodDto(
  UpdateInventarioStatusBodySchema,
) {}

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateInventarioStatusController {
  constructor(
    private readonly updateInventarioStatusUseCase: UpdateInventarioStatusUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'inventario' })
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update inventario status',
    operationId: 'updateInventarioStatus',
  })
  @ApiSuccessResponse(InventarioResponseDto)
  async handle(
    @Param('id') id: string,
    @Body() body: UpdateInventarioStatusBodyDto,
  ) {
    const updated = await this.updateInventarioStatusUseCase.execute(
      id,
      body.status,
    );
    return toInventarioResponse(updated);
  }
}
