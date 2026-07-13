import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CncResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { UpdateObservacaoCncUseCase } from '../../../application/usecases/cnc/update-observacao-cnc.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateObservacaoCncBodySchema = z.object({
  observacao: z.string().nullable(),
});

class UpdateObservacaoCncBodyDto extends createZodDto(
  UpdateObservacaoCncBodySchema,
) {}

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateObservacaoCncController {
  constructor(
    private readonly updateObservacaoCncUseCase: UpdateObservacaoCncUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Patch(':id/observacao')
  @ApiOperation({
    summary: 'Atualizar observação da CNC',
    operationId: 'updateObservacaoCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(@Param('id') id: string, @Body() body: UpdateObservacaoCncBodyDto) {
    return this.updateObservacaoCncUseCase.execute({
      cncId: id,
      observacao: body.observacao,
    });
  }
}
