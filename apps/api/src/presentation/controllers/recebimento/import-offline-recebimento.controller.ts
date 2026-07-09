import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ImportOfflineRecebimentoResponseDto } from '../../../application/dtos/recebimento/import-offline-recebimento.dto.js';
import {
  ImportOfflineRecebimentoUseCase,
} from '../../../application/usecases/recebimento/import-offline-recebimento.usecase.js';
import { OfflineImportEntrySchema } from '../../../domain/model/offline-import/offline-import.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const ImportOfflineRecebimentoBodySchema = z.object({
  exportId: z.string().min(1).max(64),
  unidadeId: z.string().min(1).optional(),
  entries: z.array(OfflineImportEntrySchema).min(1),
});

class ImportOfflineRecebimentoBodyDto extends createZodDto(
  ImportOfflineRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImportOfflineRecebimentoController {
  constructor(
    private readonly importOfflineRecebimentoUseCase: ImportOfflineRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CONFERIR)
  @Auditable({ action: 'import_offline', resource: 'pre_recebimento' })
  @Post(':id/offline/importar')
  @ApiOperation({
    summary: 'Importar pacote offline do PWA para a demanda',
    operationId: 'importOfflineRecebimento',
  })
  @ApiSuccessResponse(ImportOfflineRecebimentoResponseDto, 'created')
  handle(
    @Param('id') id: string,
    @Body() body: ImportOfflineRecebimentoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.importOfflineRecebimentoUseCase.execute({
      data: {
        demandId: id,
        exportId: body.exportId,
        unidadeId: body.unidadeId,
        entries: body.entries,
      },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
