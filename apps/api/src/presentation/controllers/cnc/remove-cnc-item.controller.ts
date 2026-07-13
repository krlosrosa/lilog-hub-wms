import {
  Controller,
  Delete,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CncItemResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { RemoveCncItemUseCase } from '../../../application/usecases/cnc/remove-cnc-item.usecase.js';
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

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RemoveCncItemController {
  constructor(private readonly removeCncItemUseCase: RemoveCncItemUseCase) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Auditable({ action: 'remove-item', resource: 'cnc' })
  @Delete(':id/itens/:itemId')
  @ApiOperation({
    summary: 'Remover item da CNC',
    operationId: 'removeCncItem',
  })
  @ApiSuccessResponse(CncItemResponseDto)
  handle(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.removeCncItemUseCase.execute({
      cncId: id,
      itemId,
      userId: user?.id ?? 0,
    });
  }
}
