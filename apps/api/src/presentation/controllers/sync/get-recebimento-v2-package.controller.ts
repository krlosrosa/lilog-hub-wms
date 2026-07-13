import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetRecebimentoV2PackageUseCase } from '../../../application/usecases/sync/get-recebimento-v2-package.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

@ApiTags('Sync')
@Controller('sync/adapters/recebimento-v2')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecebimentoV2PackageController {
  constructor(
    private readonly getPackageUseCase: GetRecebimentoV2PackageUseCase,
  ) {}

  @Get('processes/:id/package')
  @ApiOperation({
    summary: 'Pacote completo de dados para recebimento offline V2',
    operationId: 'getRecebimentoV2Package',
  })
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.getPackageUseCase.execute({
      demandId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
