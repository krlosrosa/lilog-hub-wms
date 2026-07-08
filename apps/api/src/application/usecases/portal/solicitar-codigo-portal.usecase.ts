import { randomInt } from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';

import {
  montarHtmlCodigoPortal,
  montarTextoCodigoPortal,
} from '../../services/portal/montar-html-codigo-portal.js';
import {
  TRANSPORTADORA_REPOSITORY,
  type ITransportadoraRepository,
} from '../../../domain/repositories/transportadora/transportadora.repository.js';
import {
  EMAIL_PROVIDER,
  type IEmailProvider,
} from '../../../infra/clients/email/email.types.js';
import { isEmailConfigured } from '../../../infra/clients/email/email.provider.js';

export type SolicitarCodigoPortalInput = {
  email: string;
};

export type SolicitarCodigoPortalOutput = {
  message: string;
};

export type PortalOtpCacheValue = {
  code: string;
  transportadoraId: string;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_EXPIRATION_MINUTES = 10;

@Injectable()
export class SolicitarCodigoPortalUseCase {
  private readonly logger = new Logger(SolicitarCodigoPortalUseCase.name);

  constructor(
    @Inject(TRANSPORTADORA_REPOSITORY)
    private readonly transportadoraRepository: ITransportadoraRepository,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: SolicitarCodigoPortalInput,
  ): Promise<SolicitarCodigoPortalOutput> {
    const email = input.email.trim().toLowerCase();
    const transportadora = await this.transportadoraRepository.findByEmail(email);

    if (!transportadora) {
      throw new UnprocessableEntityException(
        'E-mail não cadastrado. Solicite acesso ao administrador.',
      );
    }

    const code = String(randomInt(100000, 999999));
    const cacheKey = `portal:otp:${email}`;
    const cacheValue: PortalOtpCacheValue = {
      code,
      transportadoraId: transportadora.id,
    };

    await this.cacheManager.set(cacheKey, cacheValue, OTP_TTL_MS);

    if (!isEmailConfigured(this.configService)) {
      this.logger.warn(
        `RESEND_API_KEY não configurada. Código OTP para ${email}: ${code}`,
      );
    } else {
      await this.emailProvider.send({
        to: email,
        subject: 'Seu código de acesso — Portal de Terceiros',
        html: montarHtmlCodigoPortal({
          transportadoraNome: transportadora.nome,
          codigo: code,
          expiracaoMinutos: OTP_EXPIRATION_MINUTES,
        }),
        text: montarTextoCodigoPortal({
          transportadoraNome: transportadora.nome,
          codigo: code,
          expiracaoMinutos: OTP_EXPIRATION_MINUTES,
        }),
      });
    }

    return { message: 'Código enviado para o e-mail informado' };
  }
}
