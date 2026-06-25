import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListDocumentosQueryDto,
  ListDocumentosResponseDto,
} from '../../../application/dtos/documento/documento.dto.js';
import { ListDocumentosUseCase } from '../../../application/usecases/documento/list-documentos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCUMENTO_PERMISSION } from '../../../shared/constants/documento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Documento')
@Controller('documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListDocumentosController {
  constructor(private readonly listDocumentosUseCase: ListDocumentosUseCase) {}

  @RequirePermissions(DOCUMENTO_PERMISSION.LIST)
  @Get()
  @ApiOperation({
    summary: 'List documentos',
    operationId: 'listDocumentos',
  })
  @ApiSuccessResponse(ListDocumentosResponseDto)
  handle(@Query() query: ListDocumentosQueryDto) {
    return this.listDocumentosUseCase.execute(query);
  }
}
