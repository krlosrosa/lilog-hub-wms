import { Controller, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DocumentoResponseDto } from '../../../application/dtos/documento/documento.dto.js';
import { DeleteDocumentoUseCase } from '../../../application/usecases/documento/delete-documento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCUMENTO_PERMISSION } from '../../../shared/constants/documento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Documento')
@Controller('documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteDocumentoController {
  constructor(private readonly deleteDocumentoUseCase: DeleteDocumentoUseCase) {}

  @RequirePermissions(DOCUMENTO_PERMISSION.DELETE)
  @Auditable({ action: 'delete', resource: 'documento' })
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete documento',
    operationId: 'deleteDocumento',
  })
  @ApiSuccessResponse(DocumentoResponseDto)
  handle(@Param('id') id: string) {
    return this.deleteDocumentoUseCase.execute({ id });
  }
}
