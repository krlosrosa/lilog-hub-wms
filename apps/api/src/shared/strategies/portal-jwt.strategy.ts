import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type PortalJwtPayload = {
  sub: string;
  transportadoraId: string;
  type: 'portal';
};

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => {
          return (
            (req?.cookies as Record<string, string> | undefined)?.[
              'portal_access_token'
            ] ?? null
          );
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: PortalJwtPayload) {
    if (payload.type !== 'portal') {
      throw new UnauthorizedException('Token inválido para o portal');
    }

    return {
      email: payload.sub,
      transportadoraId: payload.transportadoraId,
    };
  }
}
