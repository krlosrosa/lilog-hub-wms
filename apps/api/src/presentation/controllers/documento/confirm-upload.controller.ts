import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DocumentoResponseDto } from '../../../application/dtos/documento/documento.dto.js';
import { ConfirmUploadUseCase } from '../../../application/usecases/documento/confirm-upload.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DOCUMENTO_PERMISSION } from '../../../shared/constants/documento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const ConfirmUploadBodySchema = z.object({
  chave: z.string().min(1).max(500),
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  tamanho: z.number().int().positive(),
  entidadeTipo: z.string().min(1).max(50).optional(),
  entidadeId: z.string().min(1).max(100).optional(),
});

class ConfirmUploadBodyDto extends createZodDto(ConfirmUploadBodySchema) {}

@ApiTags('Documento')
@Controller('documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ConfirmUploadController {
  constructor(private readonly confirmUploadUseCase: ConfirmUploadUseCase) {}

  @RequirePermissions(DOCUMENTO_PERMISSION.CONFIRM)
  @Auditable({ action: 'confirm-upload', resource: 'documento' })
  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm document upload',
    operationId: 'confirmDocumentoUpload',
  })
  @ApiSuccessResponse(DocumentoResponseDto)
  handle(
    @Body() body: ConfirmUploadBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.confirmUploadUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
