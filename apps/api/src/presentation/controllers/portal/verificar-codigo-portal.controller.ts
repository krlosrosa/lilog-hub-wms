import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { VerificarCodigoPortalUseCase } from '../../../application/usecases/portal/verificar-codigo-portal.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';

const VerificarCodigoPortalBodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

class VerificarCodigoPortalBodyDto extends createZodDto(
  VerificarCodigoPortalBodySchema,
) {}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24,
};

@ApiTags('Portal Auth')
@Controller('portal/auth')
@ApiErrorResponses()
export class VerificarCodigoPortalController {
  constructor(
    private readonly verificarCodigoPortalUseCase: VerificarCodigoPortalUseCase,
  ) {}

  @Auditable({
    action: 'verify-code',
    resource: 'portal-auth',
    capturePayload: false,
  })
  @Post('verificar-codigo')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Valida código OTP e autentica no portal',
    operationId: 'verificarCodigoPortal',
  })
  async handle(
    @Body() body: VerificarCodigoPortalBodyDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.verificarCodigoPortalUseCase.execute(body);

    reply.setCookie('portal_access_token', result.token, COOKIE_OPTIONS);

    return {
      email: result.email,
      transportadoraId: result.transportadoraId,
    };
  }
}
