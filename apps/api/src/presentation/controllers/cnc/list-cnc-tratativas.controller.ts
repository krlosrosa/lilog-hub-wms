import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListCncTratativasResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { ListCncTratativasUseCase } from '../../../application/usecases/cnc/list-cnc-tratativas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListCncTratativasController {
  constructor(
    private readonly listCncTratativasUseCase: ListCncTratativasUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.VISUALIZAR)
  @Get(':id/tratativas')
  @ApiOperation({
    summary: 'Listar tratativas da CNC',
    operationId: 'listCncTratativas',
  })
  @ApiSuccessResponse(ListCncTratativasResponseDto)
  async handle(@Param('id') id: string) {
    const items = await this.listCncTratativasUseCase.execute(id);

    return { items };
  }
}
