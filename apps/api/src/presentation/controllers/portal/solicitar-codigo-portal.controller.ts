import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { SolicitarCodigoPortalUseCase } from '../../../application/usecases/portal/solicitar-codigo-portal.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';

const SolicitarCodigoPortalBodySchema = z.object({
  email: z.string().email(),
});

class SolicitarCodigoPortalBodyDto extends createZodDto(
  SolicitarCodigoPortalBodySchema,
) {}

@ApiTags('Portal Auth')
@Controller('portal/auth')
@ApiErrorResponses()
export class SolicitarCodigoPortalController {
  constructor(
    private readonly solicitarCodigoPortalUseCase: SolicitarCodigoPortalUseCase,
  ) {}

  @Auditable({
    action: 'request-code',
    resource: 'portal-auth',
    capturePayload: false,
  })
  @Post('solicitar-codigo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Solicita código OTP por e-mail de transportadora',
    operationId: 'solicitarCodigoPortal',
  })
  async handle(@Body() body: SolicitarCodigoPortalBodyDto) {
    return this.solicitarCodigoPortalUseCase.execute(body);
  }
}
