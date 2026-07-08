import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EMAIL_PROVIDER } from './email.types.js';
import { NoOpEmailProvider } from './noop-email.provider.js';
import { ResendEmailProvider } from './resend-email.provider.js';

function readEmailEnv(
  configService: ConfigService,
  key: string,
): string | undefined {
  const value = configService.get<string>(key)?.trim();
  return value || undefined;
}

export function isEmailConfigured(configService: ConfigService): boolean {
  return Boolean(readEmailEnv(configService, 'RESEND_API_KEY'));
}

export const emailProvider: Provider = {
  provide: EMAIL_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    if (!isEmailConfigured(configService)) {
      return new NoOpEmailProvider();
    }

    return new ResendEmailProvider(configService);
  },
};
