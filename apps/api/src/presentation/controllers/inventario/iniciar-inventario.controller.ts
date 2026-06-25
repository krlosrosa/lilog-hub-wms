import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  InventarioResponseDto,
  toInventarioResponse,
} from '../../../application/dtos/inventario/inventario.dto.js';
import { IniciarInventarioUseCase } from '../../../application/usecases/inventario/inventario.usecases.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Inventario')
@Controller('inventarios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class IniciarInventarioController {
  constructor(
    private readonly iniciarInventarioUseCase: IniciarInventarioUseCase,
  ) {}

  @Auditable({ action: 'update', resource: 'inventario' })
  @Post(':id/iniciar')
  @ApiOperation({
    summary: 'Start inventario',
    operationId: 'iniciarInventario',
  })
  @ApiSuccessResponse(InventarioResponseDto)
  async handle(@Param('id') id: string) {
    const updated = await this.iniciarInventarioUseCase.execute(id);
    return toInventarioResponse(updated);
  }
}
