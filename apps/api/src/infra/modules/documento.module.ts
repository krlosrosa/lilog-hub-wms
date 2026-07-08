import { Module } from '@nestjs/common';

import { ConfirmUploadUseCase } from '../../application/usecases/documento/confirm-upload.usecase.js';
import { DeleteDocumentoUseCase } from '../../application/usecases/documento/delete-documento.usecase.js';
import { GenerateUploadUrlUseCase } from '../../application/usecases/documento/generate-upload-url.usecase.js';
import { GetDownloadUrlUseCase } from '../../application/usecases/documento/get-download-url.usecase.js';
import { ListDocumentosUseCase } from '../../application/usecases/documento/list-documentos.usecase.js';
import { DOCUMENTO_REPOSITORY } from '../../domain/repositories/documento/documento.repository.js';
import { ConfirmUploadController } from '../../presentation/controllers/documento/confirm-upload.controller.js';
import { DeleteDocumentoController } from '../../presentation/controllers/documento/delete-documento.controller.js';
import { GenerateUploadUrlController } from '../../presentation/controllers/documento/generate-upload-url.controller.js';
import { GetDownloadUrlController } from '../../presentation/controllers/documento/get-download-url.controller.js';
import { ListDocumentosController } from '../../presentation/controllers/documento/list-documentos.controller.js';
import { PutDocumentUploadController } from '../../presentation/controllers/documento/put-document-upload.controller.js';
import { PermissionsGuard } from '../../shared/guards/permissions.guard.js';
import { r2Provider } from '../clients/r2/r2.provider.js';
import { DocumentoService } from '../db/documento/documento.service.js';
import { AuditLogModule } from './audit-log.module.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [
    GenerateUploadUrlController,
    ConfirmUploadController,
    ListDocumentosController,
    DeleteDocumentoController,
    GetDownloadUrlController,
    PutDocumentUploadController,
  ],
  providers: [
    r2Provider,
    GenerateUploadUrlUseCase,
    ConfirmUploadUseCase,
    ListDocumentosUseCase,
    DeleteDocumentoUseCase,
    GetDownloadUrlUseCase,
    PermissionsGuard,
    {
      provide: DOCUMENTO_REPOSITORY,
      useClass: DocumentoService,
    },
  ],
  exports: [DOCUMENTO_REPOSITORY, r2Provider],
})
export class DocumentoModule {}
