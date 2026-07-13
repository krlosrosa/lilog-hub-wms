import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import {
  CncOpcoesImpressaoSchema,
  CncResponseDto,
} from '../../../application/dtos/cnc/list-cncs.dto.js';
import { UpdateOpcoesImpressaoCncUseCase } from '../../../application/usecases/cnc/update-opcoes-impressao-cnc.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { CNC_PERMISSION } from '../../../shared/constants/cnc-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

class UpdateOpcoesImpressaoCncBodyDto extends createZodDto(
  CncOpcoesImpressaoSchema,
) {}

@ApiTags('CNC')
@Controller('cncs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateOpcoesImpressaoCncController {
  constructor(
    private readonly updateOpcoesImpressaoCncUseCase: UpdateOpcoesImpressaoCncUseCase,
  ) {}

  @RequirePermissions(CNC_PERMISSION.ANALISAR)
  @Patch(':id/opcoes-impressao')
  @ApiOperation({
    summary: 'Atualizar opções de impressão da CNC',
    operationId: 'updateOpcoesImpressaoCnc',
  })
  @ApiSuccessResponse(CncResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateOpcoesImpressaoCncBodyDto,
  ) {
    return this.updateOpcoesImpressaoCncUseCase.execute({
      cncId: id,
      opcoesImpressao: body,
    });
  }
}
