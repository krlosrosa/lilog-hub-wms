import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { AtualizarItinerarioRemessasResponseDto } from '../../../application/dtos/expedicao/atualizar-itinerario-remessas.dto.js';
import { AtualizarItinerarioRemessasUseCase } from '../../../application/usecases/expedicao/atualizar-itinerario-remessas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const AtualizarItinerarioRemessaItemSchema = z.object({
  remessa: z.string().min(1).max(100),
  itinerario: z.string().min(1).max(100),
});

const AtualizarItinerarioRemessasBodySchema = z.object({
  itinerarios: z.array(AtualizarItinerarioRemessaItemSchema).min(1),
});

class AtualizarItinerarioRemessasBodyDto extends createZodDto(
  AtualizarItinerarioRemessasBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/upload-lotes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarItinerarioRemessasController {
  constructor(
    private readonly atualizarItinerarioRemessasUseCase: AtualizarItinerarioRemessasUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'expedicao-remessa-itinerario' })
  @Patch(':uploadLoteId/remessas/itinerario')
  @ApiOperation({
    summary: 'Atualizar itinerário das remessas de um upload lote',
    operationId: 'atualizarItinerarioRemessas',
  })
  @ApiSuccessResponse(AtualizarItinerarioRemessasResponseDto)
  handle(
    @Param('uploadLoteId') uploadLoteId: string,
    @Body() body: AtualizarItinerarioRemessasBodyDto,
  ) {
    return this.atualizarItinerarioRemessasUseCase.execute({
      uploadLoteId,
      itinerarios: body.itinerarios,
    });
  }
}
