import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import { DemandPatchRequestSchema, DemandPatchResultSchema } from '@lilog/contracts';

import { PushRecebimentoDemandUseCase } from '../../../application/usecases/pwa/push-recebimento-demand.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

class PushRecebimentoDemandBodyDto extends createZodDto(DemandPatchRequestSchema) {}

class PushRecebimentoDemandResponseDto extends createZodDto(DemandPatchResultSchema) {}

@ApiTags('PWA Sync')
@Controller('pwa/sync/recebimento-v2/demands')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class PushRecebimentoDemandController {
  constructor(
    private readonly pushRecebimentoDemandUseCase: PushRecebimentoDemandUseCase,
  ) {}

  @Post(':demandId/push')
  @Auditable({ action: 'pwa_push_demand', resource: 'sync' })
  @ApiOperation({
    summary: 'Sincroniza patch de estado de uma demanda de recebimento (PWA)',
    operationId: 'pushRecebimentoDemandPatch',
  })
  @ApiSuccessResponse(PushRecebimentoDemandResponseDto, 'ok')
  handle(
    @Param('demandId') demandId: string,
    @Body() body: PushRecebimentoDemandBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.pushRecebimentoDemandUseCase.execute({
      demandId,
      request: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
