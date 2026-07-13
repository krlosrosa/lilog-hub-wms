import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CncItemResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { UpdateCncItemUseCase } from '../../../application/usecases/cnc/update-cnc-item.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const UpdateCncItemBodySchema = z.object({
  quantidadeEsperada: z.number().nullable().optional(),
  quantidadeRecebida: z.number().nullable().optional(),
  quantidadeDivergente: z.number().nullable().optional(),
  pesoEsperado: z.number().nullable().optional(),
  pesoRecebido: z.number().nullable().optional(),
});

class UpdateCncItemBodyDto extends createZodDto(UpdateCncItemBodySchema) {}

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateCncItemController {
  constructor(private readonly updateCncItemUseCase: UpdateCncItemUseCase) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Auditable({ action: 'update-item', resource: 'cnc' })
  @Patch(':id/itens/:itemId')
  @ApiOperation({
    summary: 'Atualizar item da CNC',
    operationId: 'updateCncItem',
  })
  @ApiSuccessResponse(CncItemResponseDto)
  handle(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCncItemBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.updateCncItemUseCase.execute({
      cncId: id,
      itemId,
      userId: user?.id ?? 0,
      data: body,
    });
  }
}
