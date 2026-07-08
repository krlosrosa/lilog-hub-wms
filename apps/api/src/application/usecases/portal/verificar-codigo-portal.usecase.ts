import { timingSafeEqual } from 'node:crypto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Cache } from 'cache-manager';

import type { PortalOtpCacheValue } from './solicitar-codigo-portal.usecase.js';

export type VerificarCodigoPortalInput = {
  email: string;
  code: string;
};

export type VerificarCodigoPortalOutput = {
  token: string;
  email: string;
  transportadoraId: string;
};

function codesMatch(expected: string, received: string): boolean {
  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

@Injectable()
export class VerificarCodigoPortalUseCase {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    input: VerificarCodigoPortalInput,
  ): Promise<VerificarCodigoPortalOutput> {
    const email = input.email.trim().toLowerCase();
    const code = input.code.trim();
    const cacheKey = `portal:otp:${email}`;
    const cached = await this.cacheManager.get<PortalOtpCacheValue>(cacheKey);

    if (!cached || !codesMatch(cached.code, code)) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    await this.cacheManager.del(cacheKey);

    const token = this.jwtService.sign({
      sub: email,
      transportadoraId: cached.transportadoraId,
      type: 'portal',
    });

    return {
      token,
      email,
      transportadoraId: cached.transportadoraId,
    };
  }
}
