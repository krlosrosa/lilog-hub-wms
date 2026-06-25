import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CncResponseDto } from '../../../application/dtos/cnc/list-cncs.dto.js';
import { AprovarCncUseCase } from '../../../application/usecases/cnc/aprovar-cnc.usecase.js';
import { CncResponsavelSchema } from '../../../domain/model/cnc/cnc.model.js';
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

const AprovarCncBodySchema = z.object({
  responsavel: CncResponsavelSchema.optional(),
  responsavelId: z.string().min(1).max(50).nullable().optional(),
  valorDebito: z.number().nonnegative().nullable().optional(),
  observacaoAprovador: z.string().nullable().optional(),
});

class AprovarCncBodyDto extends createZodDto(AprovarCncBodySchema) {}

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AprovarCncController {
  constructor(private readonly aprovarCncUseCase: AprovarCncUseCase) {}

  @RequirePermissions(CNC_PERMISSION.APROVAR)
  @Auditable({ action: 'approve', resource: 'cnc' })
  @Put(':id/aprovar')
  @ApiOperation({
    summary: 'Aprovar CNC e definir responsável pelo débito',
    operationId: 'aprovarCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: AprovarCncBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    const user = getRequestUser(request);

    return this.aprovarCncUseCase.execute({
      cncId: id,
      aprovadorId: user?.id ?? 0,
      ...body,
    });
  }
}
