import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { UploadUrlResponseDto } from '../../../application/dtos/documento/documento.dto.js';
import { GenerateUploadUrlUseCase } from '../../../application/usecases/documento/generate-upload-url.usecase.js';
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

const GenerateUploadUrlBodySchema = z.object({
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  tamanho: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, 'Arquivo não pode exceder 100MB'),
  entidadeTipo: z.string().min(1).max(50).optional(),
  entidadeId: z.string().min(1).max(100).optional(),
});

class GenerateUploadUrlBodyDto extends createZodDto(
  GenerateUploadUrlBodySchema,
) {}

@ApiTags('Documento')
@Controller('documentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GenerateUploadUrlController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
  ) {}

  @RequirePermissions(DOCUMENTO_PERMISSION.UPLOAD)
  @Auditable({ action: 'generate-upload-url', resource: 'documento' })
  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate presigned upload URL',
    operationId: 'generateDocumentoUploadUrl',
  })
  @ApiSuccessResponse(UploadUrlResponseDto, 'created')
  handle(
    @Body() body: GenerateUploadUrlBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.generateUploadUrlUseCase.execute({
      data: body,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
