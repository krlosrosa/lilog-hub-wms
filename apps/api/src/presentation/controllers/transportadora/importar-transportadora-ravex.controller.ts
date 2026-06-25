import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransportadoraResponseDto } from '../../../application/dtos/transportadora/transportadora.dto.js';
import { ImportarTransportadoraRavexUseCase } from '../../../application/usecases/transportadora/importar-transportadora-ravex.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { TRANSPORTADORA_PERMISSION } from '../../../shared/constants/transportadora-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const ImportarTransportadoraRavexBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavexTransportadora: z.number().int().positive(),
});

class ImportarTransportadoraRavexBodyDto extends createZodDto(
  ImportarTransportadoraRavexBodySchema,
) {}

@ApiTags('Transportadora')
@Controller('transportadoras')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImportarTransportadoraRavexController {
  constructor(
    private readonly importarTransportadoraRavexUseCase: ImportarTransportadoraRavexUseCase,
  ) {}

  @RequirePermissions(TRANSPORTADORA_PERMISSION.IMPORT_RAVEX)
  @Auditable({ action: 'import', resource: 'transportadora' })
  @Post('importar-ravex')
  @ApiOperation({
    summary: 'Import transportadora from Ravex',
    operationId: 'importarTransportadoraRavex',
  })
  @ApiSuccessResponse(TransportadoraResponseDto, 'created')
  handle(@Body() body: ImportarTransportadoraRavexBodyDto) {
    return this.importarTransportadoraRavexUseCase.execute(body);
  }
}
