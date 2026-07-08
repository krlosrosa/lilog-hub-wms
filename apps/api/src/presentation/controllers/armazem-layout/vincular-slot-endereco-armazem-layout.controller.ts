import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ArmazemLayoutSlotResponseDto } from '../../../application/dtos/armazem-layout/armazem-layout.dto.js';
import { VincularSlotEnderecoArmazemLayoutUseCase } from '../../../application/usecases/armazem-layout/vincular-slot-endereco-armazem-layout.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const VincularSlotEnderecoBodySchema = z.object({
  enderecoId: z.uuid().nullable(),
});

class VincularSlotEnderecoBodyDto extends createZodDto(
  VincularSlotEnderecoBodySchema,
) {}

@ApiTags('ArmazemLayout')
@Controller('armazem-layout/slots')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class VincularSlotEnderecoArmazemLayoutController {
  constructor(
    private readonly vincularSlotEnderecoArmazemLayoutUseCase: VincularSlotEnderecoArmazemLayoutUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.UPDATE)
  @Patch(':slotId/endereco')
  @ApiOperation({
    summary: 'Link layout slot to warehouse address',
    operationId: 'vincularArmazemLayoutSlotEndereco',
  })
  @ApiSuccessResponse(ArmazemLayoutSlotResponseDto)
  handle(
    @Param('slotId') slotId: string,
    @Body() body: VincularSlotEnderecoBodyDto,
  ) {
    return this.vincularSlotEnderecoArmazemLayoutUseCase.execute({
      slotId,
      enderecoId: body.enderecoId,
    });
  }
}
