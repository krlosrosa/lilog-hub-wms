import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DownloadUrlResponseDto } from '../../../application/dtos/documento/documento.dto.js';
import { GetDownloadUrlUseCase } from '../../../application/usecases/documento/get-download-url.usecase.js';
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
export class GetDownloadUrlController {
  constructor(private readonly getDownloadUrlUseCase: GetDownloadUrlUseCase) {}

  @RequirePermissions(DOCUMENTO_PERMISSION.DOWNLOAD_URL)
  @Get(':id/url')
  @ApiOperation({
    summary: 'Get presigned download URL',
    operationId: 'getDocumentoDownloadUrl',
  })
  @ApiSuccessResponse(DownloadUrlResponseDto)
  handle(@Param('id') id: string) {
    return this.getDownloadUrlUseCase.execute({ id });
  }
}
